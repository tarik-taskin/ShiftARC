<#
.SYNOPSIS
Fails when tracked files contain common credential material or the configured local database password.
#>
[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$environmentFile = Join-Path $repoRoot ".env.local"
$findings = [System.Collections.Generic.List[string]]::new()
$trackedFiles = & git -C $repoRoot ls-files

if ($LASTEXITCODE -ne 0) {
    throw "Tracked files could not be listed."
}

$forbiddenNames = [regex]::new(
    '(^|/)(\.env($|\.)|\.pgpass$|pgpass\.conf$|credentials\.json$|.*secret.*|.*credential.*|id_rsa$|id_ed25519$)|\.(pem|key|p12|pfx|jks|keystore|backup|dump|sqlite|sqlite3|db)$',
    [Text.RegularExpressions.RegexOptions]::IgnoreCase
)
$safeEnvironmentExample = [regex]::new(
    '(^|/)\.env(\.[^/]+)?\.example$',
    [Text.RegularExpressions.RegexOptions]::IgnoreCase
)
$contentPatterns = @(
    @{
        Name = "private key"
        Regex = [regex]::new('-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----')
    },
    @{
        Name = "credential-bearing connection URL"
        Regex = [regex]::new(
            '(postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis)://[^\s/:]+:[^\s@]+@',
            [Text.RegularExpressions.RegexOptions]::IgnoreCase
        )
    },
    @{
        Name = "GitHub access token"
        Regex = [regex]::new('gh[pousr]_[A-Za-z0-9_]{20,}')
    },
    @{
        Name = "AWS access key"
        Regex = [regex]::new('AKIA[0-9A-Z]{16}')
    }
)

$localDatabasePassword = $null
if (Test-Path -LiteralPath $environmentFile) {
    foreach ($line in Get-Content -LiteralPath $environmentFile) {
        if ($line -match '^\s*SHIFTARC_DB_PASSWORD\s*=\s*(.*)\s*$') {
            $localDatabasePassword = $Matches[1].Trim().Trim('"').Trim("'")
        }
    }
}

foreach ($file in $trackedFiles) {
    $normalizedFile = $file.Replace("\", "/")
    if ($normalizedFile -eq "scripts/check-secrets.ps1") {
        continue
    }

    if ($forbiddenNames.IsMatch($normalizedFile) -and -not $safeEnvironmentExample.IsMatch($normalizedFile)) {
        $findings.Add("$file`: forbidden sensitive filename")
        continue
    }

    $path = Join-Path $repoRoot $file
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        continue
    }

    try {
        $content = [IO.File]::ReadAllText($path)
    }
    catch {
        continue
    }

    if (
        -not [string]::IsNullOrWhiteSpace($localDatabasePassword) -and
        $localDatabasePassword.Length -ge 4 -and
        $content.IndexOf($localDatabasePassword, [StringComparison]::Ordinal) -ge 0
    ) {
        $findings.Add("$file`: contains the configured local database password")
    }

    foreach ($pattern in $contentPatterns) {
        if ($pattern.Regex.IsMatch($content)) {
            $findings.Add("$file`: contains a possible $($pattern.Name)")
        }
    }
}

if ($findings.Count -gt 0) {
    $findings | Sort-Object -Unique | ForEach-Object { Write-Error $_ }
    throw "Secret safety check failed. Remove credentials from tracked files before committing."
}

Write-Host "Tracked files do not contain recognized credential material."
