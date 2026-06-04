param(
    [string]$BaseUrl = "http://localhost:9999/api",
    [long]$UserId = 1,
    [string]$CsvDir = "F:\xwechat_files\wxid_l1swei27mcya22_9b56\msg\file\2026-05"
)

$ErrorActionPreference = "Stop"

function From-Hex($hex) {
    $bytes = New-Object byte[] ($hex.Length / 2)
    for ($i = 0; $i -lt $bytes.Length; $i++) {
        $bytes[$i] = [Convert]::ToByte($hex.Substring($i * 2, 2), 16)
    }
    return [System.Text.Encoding]::BigEndianUnicode.GetString($bytes)
}

function To-Hex($text) {
    $bytes = [System.Text.Encoding]::BigEndianUnicode.GetBytes($text)
    return (($bytes | ForEach-Object { $_.ToString("X2") }) -join "")
}

function New-Category($code, $nameHex) {
    return @{ code = $code; name = (From-Hex $nameHex) }
}

$expenseCategories = @{
    "9910996E" = New-Category "FOOD" "9910996E"
    "8D2D7269" = New-Category "SHOPPING" "8D2D7269"
    "96F698DF996E6599" = New-Category "SNACK" "96F698DF996E6599"
    "4EA4901A" = New-Category "TRAFFIC" "4EA4901A"
    "533B7597" = New-Category "MEDICAL" "533B7597"
    "901A8BAF" = New-Category "PHONE" "901A8BAF"
    "4F4F623F" = New-Category "HOUSE" "4F4F623F"
    "5B664E60" = New-Category "STUDY" "5B664E60"
    "5F697968" = New-Category "LOTTERY" "5F697968"
    "5DE54F5C" = New-Category "WORK" "5DE54F5C"
    "5A314E505F00652F" = New-Category "ENTERTAINMENT_SPEND" "5A314E505F00652F"
    "4EB253CB" = New-Category "FRIENDS_FAMILY" "4EB253CB"
    "5C455BB6" = New-Category "HOME" "5C455BB6"
    "5A314E50" = New-Category "ENTERTAINMENT" "5A314E50"
    "53D17EA25305" = New-Category "RED_PACKET_EXPENSE" "53D17EA25305"
    "7ED35A5A" = New-Category "WEDDING" "7ED35A5A"
    "7F8E5BB9" = New-Category "BEAUTY" "7F8E5BB9"
    "793C91D1" = New-Category "GIFT_MONEY" "793C91D1"
    "5FEB9012" = New-Category "EXPRESS" "5FEB9012"
    "4FE175285361" = New-Category "CREDIT_CARD" "4FE175285361"
}

$incomeCategories = @{
    "5DE58D44" = New-Category "SALARY" "5DE58D44"
    "7EA25305" = New-Category "RED_PACKET" "7EA25305"
    "74068D22" = New-Category "INVEST" "74068D22"
    "517C804C" = New-Category "PART_TIME" "517C804C"
    "793C91D1" = New-Category "GIFT_MONEY_INCOME" "793C91D1"
    "51765B83" = New-Category "OTHER" "51764ED6"
    "51764ED6" = New-Category "OTHER" "51764ED6"
}

$incomeText = From-Hex "65365165"

function Convert-ToIsoDate($text) {
    if ($text -notmatch "(\d{4}).(\d{2}).(\d{2}).") {
        throw "Cannot parse date: $text"
    }
    return "$($Matches[1])-$($Matches[2])-$($Matches[3])"
}

function New-Token($userId) {
    $raw = "wechat:${userId}:import-openid"
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($raw)
    return [Convert]::ToBase64String($bytes).TrimEnd("=").Replace("+", "-").Replace("/", "_")
}

$encoding = [System.Text.Encoding]::GetEncoding(936)
$token = New-Token $UserId
$headers = @{
    Authorization = "Bearer $token"
}

$files = Get-ChildItem -LiteralPath $CsvDir -Filter "*.csv" | Sort-Object Name
$seen = @{}
$existing = @{}
$imported = 0
$skipped = 0
$skippedExisting = 0

function New-RecordKey($recordDate, $type, $categoryName, $amount, $remark) {
    $normalizedRemark = if ([string]::IsNullOrWhiteSpace($remark)) { "" } else { $remark.Trim() }
    $normalizedAmount = ([decimal]$amount).ToString("0.##")
    return "$recordDate|$type|$categoryName|$normalizedAmount|$normalizedRemark"
}

Write-Host "Loading existing bills from backend..."
for ($year = 2022; $year -le 2026; $year++) {
    for ($month = 1; $month -le 12; $month++) {
        try {
            $result = Invoke-RestMethod -Uri "$BaseUrl/bills/month?year=$year&month=$month" -Method Get -Headers $headers -TimeoutSec 10
            foreach ($day in $result.data.days) {
                foreach ($item in $day.items) {
                    $existing[(New-RecordKey $item.recordDate $item.type $item.categoryName $item.amount $item.remark)] = $true
                }
            }
        } catch {
            Write-Host "Skip existing check for $year-$month"
        }
    }
}
Write-Host "Existing keys loaded: $($existing.Count)"

foreach ($file in $files) {
    Write-Host "Reading $($file.Name)"
    $text = [System.IO.File]::ReadAllText($file.FullName, $encoding)
    $rows = $text | ConvertFrom-Csv
    foreach ($row in $rows) {
        $values = @($row.PSObject.Properties | ForEach-Object { $_.Value })
        $dateText = $values[0]
        $typeText = $values[1]
        $categoryText = $values[2]
        $amountText = $values[4]
        $remarkText = $values[5]

        $type = if ($typeText -eq $incomeText) { "INCOME" } else { "EXPENSE" }
        $categoryKey = To-Hex $categoryText
        $category = if ($type -eq "INCOME") { $incomeCategories[$categoryKey] } else { $expenseCategories[$categoryKey] }
        if (-not $category) {
            throw "Unknown category: type=$type key=$categoryKey text=$categoryText"
        }

        $recordDate = Convert-ToIsoDate $dateText
        $amount = [decimal]$amountText
        $remark = if ([string]::IsNullOrWhiteSpace($remarkText)) { $null } else { $remarkText.Trim() }
        $key = New-RecordKey $recordDate $type $category.name $amount $remark
        if ($seen.ContainsKey($key)) {
            $skipped++
            continue
        }
        $seen[$key] = $true
        if ($existing.ContainsKey($key)) {
            $skippedExisting++
            continue
        }

        $body = @{
            type = $type
            categoryCode = $category.code
            categoryName = $category.name
            amount = $amount
            remark = $remark
            recordDate = $recordDate
        } | ConvertTo-Json -Depth 4

        try {
            Invoke-RestMethod -Uri "$BaseUrl/bills" -Method Post -Headers $headers -ContentType "application/json; charset=utf-8" -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) | Out-Null
        } catch {
            Write-Host "Failed row: date=$recordDate type=$type category=$($category.code) amount=$amount remark=$remark"
            if ($_.Exception.Response) {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                Write-Host $reader.ReadToEnd()
            }
            throw
        }
        $imported++
        if ($imported % 200 -eq 0) {
            Write-Host "Imported $imported..."
        }
    }
}

Write-Host "Done. imported=$imported skippedDuplicateInFiles=$skipped skippedExisting=$skippedExisting userId=$UserId"
