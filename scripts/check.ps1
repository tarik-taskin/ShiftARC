<#
.SYNOPSIS
Runs the complete local quality gate for the ShiftARC foundation.
#>
[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$frontendRoot = Join-Path $repoRoot "frontend"
$backendRoot = Join-Path $repoRoot "backend"
$environmentFile = Join-Path $repoRoot ".env.local"

. (Join-Path $PSScriptRoot "local-environment.ps1")
Import-ShiftArcLocalEnvironment -Path $environmentFile -Quiet

function Invoke-QualityStep {
    param(
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][scriptblock]$Action
    )

    Write-Host ""
    Write-Host "==> $Name"
    & $Action
    if ($LASTEXITCODE -ne 0) {
        throw "$Name failed with exit code $LASTEXITCODE."
    }
}

Push-Location $frontendRoot
try {
    Invoke-QualityStep -Name "OpenAPI contract" -Action { & npm.cmd run contract:check }
    Invoke-QualityStep -Name "Frontend lint" -Action { & npm.cmd run lint }
    Invoke-QualityStep -Name "Frontend tests" -Action { & npm.cmd run test }
    Invoke-QualityStep -Name "Frontend build" -Action { & npm.cmd run build }
}
finally {
    Pop-Location
}

Push-Location $backendRoot
try {
    Invoke-QualityStep -Name "Backend tests and executable JAR" -Action {
        & .\gradlew.bat clean test bootJar --no-daemon --console=plain
    }
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "ShiftARC quality checks passed."
