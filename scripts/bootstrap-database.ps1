<#
.SYNOPSIS
Creates the restricted PostgreSQL application role and local database for ShiftARC.

.DESCRIPTION
Finds PostgreSQL tools from PATH, a running Windows service, or a standard
installation directory. The administrator password is passed only to child
PostgreSQL processes and is removed from the process environment on completion.

.EXAMPLE
.\scripts\bootstrap-database.ps1

.EXAMPLE
.\scripts\bootstrap-database.ps1 -PostgresBin "C:\Program Files\PostgreSQL\16\bin"
#>
[CmdletBinding()]
param(
    [Parameter()]
    [ValidateNotNullOrEmpty()]
    [string]$HostName = "localhost",

    [Parameter()]
    [ValidateRange(1, 65535)]
    [int]$Port = 5432,

    [Parameter()]
    [ValidatePattern("^[a-z][a-z0-9_]*$")]
    [string]$AdminUser = "postgres",

    [Parameter()]
    [ValidatePattern("^[a-z][a-z0-9_]*$")]
    [string]$DatabaseName = "shiftarc",

    [Parameter()]
    [ValidatePattern("^[a-z][a-z0-9_]*$")]
    [string]$ApplicationRole = "shiftarc_app",

    [Parameter()]
    [string]$PostgresBin
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Test-PostgresBin {
    param([Parameter(Mandatory)][string]$Path)

    foreach ($executable in @("psql.exe", "createuser.exe", "createdb.exe")) {
        if (-not (Test-Path -LiteralPath (Join-Path $Path $executable))) {
            return $false
        }
    }

    return $true
}

function Resolve-PostgresBin {
    param([string]$RequestedPath)

    if ($RequestedPath) {
        $resolvedPath = (Resolve-Path -LiteralPath $RequestedPath).Path
        if (-not (Test-PostgresBin -Path $resolvedPath)) {
            throw "Required PostgreSQL tools were not found in the specified bin directory: $resolvedPath"
        }

        return $resolvedPath
    }

    $psqlCommand = Get-Command "psql.exe" -ErrorAction SilentlyContinue
    if ($psqlCommand) {
        $pathFromCommand = Split-Path -Parent $psqlCommand.Source
        if (Test-PostgresBin -Path $pathFromCommand) {
            return $pathFromCommand
        }
    }

    $postgresService = Get-CimInstance Win32_Service -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like "postgresql-*" -and $_.State -eq "Running" } |
        Select-Object -First 1

    if ($postgresService -and $postgresService.PathName -match '^"([^\"]+\\pg_ctl\.exe)"') {
        $pathFromService = Split-Path -Parent $Matches[1]
        if (Test-PostgresBin -Path $pathFromService) {
            return $pathFromService
        }
    }

    $postgresRoot = Join-Path $env:ProgramFiles "PostgreSQL"
    if (Test-Path -LiteralPath $postgresRoot) {
        $installations = Get-ChildItem -LiteralPath $postgresRoot -Directory |
            Sort-Object {
                $parsedVersion = $null
                if ([version]::TryParse($_.Name, [ref]$parsedVersion)) {
                    return $parsedVersion
                }

                return [version]"0.0"
            } -Descending

        foreach ($installation in $installations) {
            $candidate = Join-Path $installation.FullName "bin"
            if (Test-PostgresBin -Path $candidate) {
                return $candidate
            }
        }
    }

    throw "PostgreSQL tools were not found. Specify the bin directory with -PostgresBin."
}

function Invoke-PsqlScalar {
    param(
        [Parameter(Mandatory)][string]$Executable,
        [Parameter(Mandatory)][string]$Sql
    )

    $arguments = @(
        "--host", $HostName,
        "--port", $Port,
        "--username", $AdminUser,
        "--dbname", "postgres",
        "--no-psqlrc",
        "--tuples-only",
        "--no-align",
        "--set", "ON_ERROR_STOP=1",
        "--command", $Sql
    )

    $result = & $Executable @arguments
    if ($LASTEXITCODE -ne 0) {
        throw "The PostgreSQL query failed."
    }

    return ($result | Out-String).Trim()
}

$resolvedPostgresBin = Resolve-PostgresBin -RequestedPath $PostgresBin
$psql = Join-Path $resolvedPostgresBin "psql.exe"
$createUser = Join-Path $resolvedPostgresBin "createuser.exe"
$createDatabase = Join-Path $resolvedPostgresBin "createdb.exe"

Write-Host "PostgreSQL tools: $resolvedPostgresBin"
Write-Host "Target server: ${HostName}:$Port"

$previousPassword = $env:PGPASSWORD
$previousConnectTimeout = $env:PGCONNECT_TIMEOUT
$adminPasswordPointer = [IntPtr]::Zero

try {
    if (-not $env:PGPASSWORD) {
        $secureAdminPassword = Read-Host "Password for PostgreSQL administrator '$AdminUser'" -AsSecureString
        $adminPasswordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureAdminPassword)
        $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($adminPasswordPointer)
    }

    $env:PGCONNECT_TIMEOUT = "5"

    $roleState = Invoke-PsqlScalar -Executable $psql -Sql @"
SELECT concat_ws('|', rolname, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolcanlogin)
FROM pg_roles
WHERE rolname = '$ApplicationRole';
"@

    if (-not $roleState) {
        Write-Host "Creating application role '$ApplicationRole'."
        & $createUser @(
            "--host", $HostName,
            "--port", $Port,
            "--username", $AdminUser,
            "--pwprompt",
            "--no-superuser",
            "--no-createdb",
            "--no-createrole",
            "--no-replication",
            "--login",
            $ApplicationRole
        )

        if ($LASTEXITCODE -ne 0) {
            throw "Application role '$ApplicationRole' could not be created."
        }

        $roleState = "$ApplicationRole|f|f|f|f|t"
        Write-Host "Application role created."
    }
    else {
        Write-Host "Application role '$ApplicationRole' already exists."
    }

    $expectedRoleState = "$ApplicationRole|f|f|f|f|t"
    if ($roleState -ne $expectedRoleState) {
        throw "Role '$ApplicationRole' does not have the expected restricted privileges. Current state: $roleState"
    }

    $databaseOwner = Invoke-PsqlScalar -Executable $psql -Sql @"
SELECT pg_get_userbyid(datdba)
FROM pg_database
WHERE datname = '$DatabaseName';
"@

    if (-not $databaseOwner) {
        Write-Host "Creating database '$DatabaseName'."
        & $createDatabase @(
            "--host", $HostName,
            "--port", $Port,
            "--username", $AdminUser,
            "--owner", $ApplicationRole,
            $DatabaseName
        )

        if ($LASTEXITCODE -ne 0) {
            throw "Database '$DatabaseName' could not be created."
        }

        $databaseOwner = $ApplicationRole
        Write-Host "Database created."
    }
    else {
        Write-Host "Database '$DatabaseName' already exists."
    }

    if ($databaseOwner -ne $ApplicationRole) {
        throw "Database '$DatabaseName' is owned by '$databaseOwner'; expected owner is '$ApplicationRole'."
    }

    Write-Host ""
    Write-Host "The ShiftARC local database is ready."
    Write-Host "SHIFTARC_DB_URL=jdbc:postgresql://${HostName}:$Port/$DatabaseName"
    Write-Host "SHIFTARC_DB_USERNAME=$ApplicationRole"
    Write-Host "Add SHIFTARC_DB_PASSWORD to your secure local environment file."
}
finally {
    if ($adminPasswordPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($adminPasswordPointer)
    }

    if ($null -eq $previousPassword) {
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    }
    else {
        $env:PGPASSWORD = $previousPassword
    }

    if ($null -eq $previousConnectTimeout) {
        Remove-Item Env:PGCONNECT_TIMEOUT -ErrorAction SilentlyContinue
    }
    else {
        $env:PGCONNECT_TIMEOUT = $previousConnectTimeout
    }
}
