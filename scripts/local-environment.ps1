function Import-ShiftArcLocalEnvironment {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Path,

        [Parameter()]
        [switch]$Quiet
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        if (-not $Quiet) {
            Write-Host "No .env.local file found; existing process environment will be used."
        }
        return
    }

    foreach ($line in Get-Content -LiteralPath $Path) {
        $trimmedLine = $line.Trim()
        if (-not $trimmedLine -or $trimmedLine.StartsWith("#")) {
            continue
        }

        $separatorIndex = $trimmedLine.IndexOf("=")
        if ($separatorIndex -lt 1) {
            throw "Invalid .env.local entry. Expected KEY=VALUE."
        }

        $name = $trimmedLine.Substring(0, $separatorIndex).Trim()
        $value = $trimmedLine.Substring($separatorIndex + 1).Trim()
        $isValidName = [regex]::IsMatch(
            $name,
            "^[A-Za-z_][A-Za-z0-9_]*$",
            [Text.RegularExpressions.RegexOptions]::CultureInvariant
        )
        if (-not $isValidName) {
            throw "Invalid environment variable name in .env.local: $name"
        }

        if (
            $value.Length -ge 2 -and
            (($value.StartsWith('"') -and $value.EndsWith('"')) -or
             ($value.StartsWith("'") -and $value.EndsWith("'")))
        ) {
            $value = $value.Substring(1, $value.Length - 2)
        }

        if ($null -eq [Environment]::GetEnvironmentVariable($name, "Process")) {
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }

    if (-not $Quiet) {
        Write-Host "Loaded local environment from .env.local."
    }
}
