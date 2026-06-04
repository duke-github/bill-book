param(
    [string]$BaseUrl = "http://localhost:9999/api",
    [long]$UserId = 1
)

$ErrorActionPreference = "Stop"

function New-Token($userId) {
    $raw = "wechat:${userId}:import-openid"
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($raw)
    return [Convert]::ToBase64String($bytes).TrimEnd("=").Replace("+", "-").Replace("/", "_")
}

function New-RecordKey($item) {
    $remark = if ($item.remark) { $item.remark.Trim() } else { "" }
    $amount = ([decimal]$item.amount).ToString("0.##")
    return "$($item.recordDate)|$($item.type)|$($item.categoryCode)|$amount|$remark"
}

$headers = @{
    Authorization = "Bearer $(New-Token $UserId)"
}

$items = @()
for ($year = 2022; $year -le 2026; $year++) {
    for ($month = 1; $month -le 12; $month++) {
        try {
            $result = Invoke-RestMethod -Uri "$BaseUrl/bills/month?year=$year&month=$month" -Method Get -Headers $headers -TimeoutSec 30
            foreach ($day in $result.data.days) {
                foreach ($item in $day.items) {
                    $items += $item
                }
            }
        } catch {
            Write-Host "Skip $year-$month"
        }
    }
}

$deleteIds = @()
$groups = $items | Group-Object { New-RecordKey $_ }
foreach ($group in $groups) {
    if ($group.Count -le 1) {
        continue
    }
    $sorted = $group.Group | Sort-Object id
    $deleteIds += ($sorted | Select-Object -Skip 1 | ForEach-Object { $_.id })
}

Write-Host "Total=$($items.Count) duplicateDeleteCount=$($deleteIds.Count)"

foreach ($id in $deleteIds) {
    Invoke-RestMethod -Uri "$BaseUrl/bills/$id" -Method Delete -Headers $headers -TimeoutSec 10 | Out-Null
}

Write-Host "Cleanup done. deleted=$($deleteIds.Count)"
