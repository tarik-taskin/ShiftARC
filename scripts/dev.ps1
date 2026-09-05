<#
.SYNOPSIS
Validates and starts the local ShiftARC development services.

.EXAMPLE
.\scripts\dev.ps1

.EXAMPLE
.\scripts\dev.ps1 -Target frontend

.EXAMPLE
.\scripts\dev.ps1 -Target all -CheckOnly
#>
[CmdletBinding()]
param(
    [Parameter()]
    [ValidateSet("all", "frontend", "backend")]
    [string]$Target = "all",

    [Parameter()]
    [switch]$CheckOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$frontendRoot = Join-Path $repoRoot "frontend"
$backendRoot = Join-Path $repoRoot "backend"
$environmentFile = Join-Path $repoRoot ".env.local"
$logRoot = Join-Path $repoRoot "logs\dev"

. (Join-Path $PSScriptRoot "local-environment.ps1")

function Assert-CommandAvailable {
    param(
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][string]$InstallHint
    )

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' was not found. $InstallHint"
    }
}

function Assert-NodeVersion {
    $rawVersion = (& node --version).Trim().TrimStart("v")
    $version = [version]$rawVersion
    $isSupported =
        $version.Major -gt 22 -or
        ($version.Major -eq 22 -and $version.Minor -ge 12) -or
        ($version.Major -eq 20 -and $version.Minor -ge 19)

    if (-not $isSupported) {
        throw "Node.js $rawVersion is unsupported. Vite requires Node.js 20.19+, 22.12+, or newer."
    }

    Write-Host "Node.js: v$rawVersion"
}

function Assert-JavaVersion {
    $versionOutput = (& $env:ComSpec /d /c "java -version 2>&1" | Out-String)
    if ($versionOutput -notmatch 'version\s+"(?<major>\d+)') {
        throw "The installed Java version could not be determined."
    }

    $majorVersion = [int]$Matches.major
    if ($majorVersion -lt 17) {
        throw "Java $majorVersion is unsupported. ShiftARC requires Java 17 or newer."
    }

    Write-Host "Java: $majorVersion"
}

function Test-TcpEndpoint {
    param(
        [Parameter(Mandatory)][string]$HostName,
        [Parameter(Mandatory)][int]$Port
    )

    $client = [Net.Sockets.TcpClient]::new()
    try {
        $connection = $client.BeginConnect($HostName, $Port, $null, $null)
        if (-not $connection.AsyncWaitHandle.WaitOne(1500)) {
            return $false
        }

        $client.EndConnect($connection)
        return $true
    }
    catch {
        return $false
    }
    finally {
        $client.Dispose()
    }
}

function Assert-PortAvailable {
    param(
        [Parameter(Mandatory)][int]$Port,
        [Parameter(Mandatory)][string]$ServiceName
    )

    $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
    if ($listener) {
        $ownerIds = ($listener | Select-Object -ExpandProperty OwningProcess -Unique) -join ", "
        throw "$ServiceName cannot start because port $Port is already in use by process $ownerIds."
    }
}

function Get-DatabaseEndpoint {
    $databaseUrl = [Environment]::GetEnvironmentVariable("SHIFTARC_DB_URL", "Process")
    if (-not $databaseUrl) {
        $databaseUrl = "jdbc:postgresql://localhost:5432/shiftarc"
    }

    if ($databaseUrl -notmatch '^jdbc:postgresql://(?<host>[^/:]+)(:(?<port>\d+))?/') {
        throw "SHIFTARC_DB_URL must be a PostgreSQL JDBC URL."
    }

    $databasePort = if ($Matches.port) { [int]$Matches.port } else { 5432 }
    return [pscustomobject]@{
        Host = $Matches.host
        Port = $databasePort
    }
}

function Assert-BackendEnvironment {
    $password = [Environment]::GetEnvironmentVariable("SHIFTARC_DB_PASSWORD", "Process")
    if ([string]::IsNullOrWhiteSpace($password)) {
        throw "SHIFTARC_DB_PASSWORD is required. Copy .env.local.example to .env.local and set the local password."
    }

    $apiPortValue = [Environment]::GetEnvironmentVariable("SHIFTARC_API_PORT", "Process")
    if (-not $apiPortValue) {
        $apiPortValue = "8080"
        [Environment]::SetEnvironmentVariable("SHIFTARC_API_PORT", $apiPortValue, "Process")
    }

    $apiPort = 0
    if (-not [int]::TryParse($apiPortValue, [ref]$apiPort) -or $apiPort -lt 1 -or $apiPort -gt 65535) {
        throw "SHIFTARC_API_PORT must be an integer between 1 and 65535."
    }

    Assert-PortAvailable -Port $apiPort -ServiceName "Backend"

    $databaseEndpoint = Get-DatabaseEndpoint
    if (-not (Test-TcpEndpoint -HostName $databaseEndpoint.Host -Port $databaseEndpoint.Port)) {
        throw "PostgreSQL is not accepting connections at $($databaseEndpoint.Host):$($databaseEndpoint.Port)."
    }

    Write-Host "PostgreSQL: $($databaseEndpoint.Host):$($databaseEndpoint.Port)"
    Write-Host "Backend port: $apiPort"
}

function Start-DevProcess {
    param(
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][string]$FilePath,
        [Parameter(Mandatory)][string[]]$ArgumentList,
        [Parameter(Mandatory)][string]$WorkingDirectory
    )

    if (-not (Test-Path -LiteralPath $logRoot)) {
        New-Item -ItemType Directory -Path $logRoot | Out-Null
    }

    $standardOutput = Join-Path $logRoot "$($Name.ToLowerInvariant()).stdout.log"
    $standardError = Join-Path $logRoot "$($Name.ToLowerInvariant()).stderr.log"

    $startParameters = @{
        FilePath = $FilePath
        ArgumentList = $ArgumentList
        WorkingDirectory = $WorkingDirectory
        WindowStyle = "Hidden"
        RedirectStandardOutput = $standardOutput
        RedirectStandardError = $standardError
        PassThru = $true
    }
    $process = Start-Process @startParameters

    Write-Host "$Name started with PID $($process.Id)."
    Write-Host "$Name logs: $standardOutput"

    return [pscustomobject]@{
        Name = $Name
        Process = $process
        StandardOutput = $standardOutput
        StandardError = $standardError
    }
}

function Stop-ProcessTree {
    param([Parameter(Mandatory)][int]$ProcessId)

    $children = Get-CimInstance Win32_Process -Filter "ParentProcessId = $ProcessId" -ErrorAction SilentlyContinue
    foreach ($child in $children) {
        Stop-ProcessTree -ProcessId $child.ProcessId
    }

    Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
}

function Show-ProcessFailure {
    param([Parameter(Mandatory)]$ProcessInfo)

    Write-Host "$($ProcessInfo.Name) stopped unexpectedly."
    foreach ($logPath in @($ProcessInfo.StandardOutput, $ProcessInfo.StandardError)) {
        if (Test-Path -LiteralPath $logPath) {
            Write-Host "--- $logPath"
            Get-Content -LiteralPath $logPath -Tail 40
        }
    }
}

Import-ShiftArcLocalEnvironment -Path $environmentFile
Use-ShiftArcNodeRuntime

$startFrontend = $Target -in @("all", "frontend")
$startBackend = $Target -in @("all", "backend")

if ($startFrontend) {
    Assert-CommandAvailable -Name "node" -InstallHint "Install a supported Node.js release."
    Assert-CommandAvailable -Name "npm.cmd" -InstallHint "Install npm with Node.js."
    Assert-NodeVersion
    Assert-PortAvailable -Port 5173 -ServiceName "Frontend"
    Write-Host "Frontend port: 5173"
}

if ($startBackend) {
    Assert-CommandAvailable -Name "java" -InstallHint "Install Java 17 or newer."
    Assert-JavaVersion
    if (-not (Test-Path -LiteralPath (Join-Path $backendRoot "gradlew.bat"))) {
        throw "The backend Gradle Wrapper was not found."
    }
    Assert-BackendEnvironment
}

if ($CheckOnly) {
    Write-Host "ShiftARC local environment is ready for target '$Target'."
    exit 0
}

$processes = @()
try {
    if ($startBackend) {
        $processes += Start-DevProcess -Name "Backend" -FilePath (Join-Path $backendRoot "gradlew.bat") -ArgumentList @("bootRun", "--no-daemon", "--console=plain") -WorkingDirectory $backendRoot
    }

    if ($startFrontend) {
        $processes += Start-DevProcess -Name "Frontend" -FilePath (Get-Command "npm.cmd").Source -ArgumentList @("run", "dev", "--", "--host", "127.0.0.1", "--port", "5173") -WorkingDirectory $frontendRoot
    }

    Write-Host "ShiftARC development services are running. Press Ctrl+C to stop."

    while ($true) {
        foreach ($processInfo in $processes) {
            if ($processInfo.Process.HasExited) {
                Show-ProcessFailure -ProcessInfo $processInfo
                throw "$($processInfo.Name) exited with code $($processInfo.Process.ExitCode)."
            }
        }

        Start-Sleep -Milliseconds 500
    }
}
finally {
    foreach ($processInfo in $processes) {
        Stop-ProcessTree -ProcessId $processInfo.Process.Id
    }

    if ($processes.Count -gt 0) {
        Write-Host "ShiftARC development services stopped."
    }
}
