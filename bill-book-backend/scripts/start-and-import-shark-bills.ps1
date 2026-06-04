param(
    [string]$BaseUrl = "http://localhost:9999/api",
    [long]$UserId = 1
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$logPath = Join-Path $root "logs\backend-import.log"
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $logPath) | Out-Null

Write-Host "Starting backend on port 9999..."
$process = Start-Process -FilePath "mvn" `
    -ArgumentList "spring-boot:run" `
    -WorkingDirectory $root `
    -RedirectStandardOutput $logPath `
    -RedirectStandardError $logPath `
    -PassThru

try {
    Write-Host "Waiting for backend: $BaseUrl/categories?type=EXPENSE"
    $ready = $false
    for ($i = 1; $i -le 60; $i++) {
        Start-Sleep -Seconds 2
        try {
            Invoke-RestMethod -Uri "$BaseUrl/categories?type=EXPENSE" -Method Get -TimeoutSec 3 | Out-Null
            $ready = $true
            break
        } catch {
            Write-Host "Waiting... $i"
        }
    }

    if (-not $ready) {
        throw "Backend did not become ready. Check log: $logPath"
    }

    Write-Host "Backend ready. Importing Shark bill CSV files..."
    & (Join-Path $PSScriptRoot "import-shark-bills.ps1") -BaseUrl $BaseUrl -UserId $UserId
    Write-Host "Import finished. Backend is still running. PID=$($process.Id)"
    Write-Host "Log: $logPath"
} catch {
    Write-Host $_
    if (-not $process.HasExited) {
        Stop-Process -Id $process.Id
    }
    throw
}
