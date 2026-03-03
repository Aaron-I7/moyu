# 使用多个图片源下载鱼类图片
$ProgressPreference = 'SilentlyContinue'

$outputDir = "e:\project\must\moyu\public\fish-images"

# 使用 Unsplash Source (免费图片API)
$fishImages = @{
    'crucian' = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop'
    'minnow' = 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=400&h=300&fit=crop'
    'loach' = 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=400&h=300&fit=crop'
    'shrimp' = 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&h=300&fit=crop'
    'goldfish' = 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=400&h=300&fit=crop'
    'gudgeon' = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop'
    'bitterling' = 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=400&h=300&fit=crop'
    'crayfish' = 'https://images.unsplash.com/photo-1559715745-e1b33a271c8f?w=400&h=300&fit=crop'
    'carp' = 'https://images.unsplash.com/photo-1518925452580-5d7fb5b581a1?w=400&h=300&fit=crop'
    'catfish' = 'https://images.unsplash.com/photo-1534448238561-675f3e9c5a5d?w=400&h=300&fit=crop'
    'perch' = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop'
    'turtle' = 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=400&h=300&fit=crop'
    'bass' = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop'
    'bluegill' = 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=400&h=300&fit=crop'
    'pike' = 'https://images.unsplash.com/photo-1518925452580-5d7fb5b581a1?w=400&h=300&fit=crop'
    'lotus-koi' = 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400&h=300&fit=crop'
    'salmon' = 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=300&fit=crop'
    'trout' = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop'
    'sturgeon' = 'https://images.unsplash.com/photo-1518925452580-5d7fb5b581a1?w=400&h=300&fit=crop'
    'eel' = 'https://images.unsplash.com/photo-1534448238561-675f3e9c5a5d?w=400&h=300&fit=crop'
    'barbel' = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop'
    'chub' = 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=400&h=300&fit=crop'
    'grayling' = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop'
    'golden-trout' = 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=400&h=300&fit=crop'
    'sea-bass' = 'https://images.unsplash.com/photo-1518925452580-5d7fb5b581a1?w=400&h=300&fit=crop'
    'flounder' = 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=400&h=300&fit=crop'
    'mackerel' = 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=300&fit=crop'
    'pufferfish' = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop'
    'octopus' = 'https://images.unsplash.com/photo-1545671913-b89ac1b4ac10?w=400&h=300&fit=crop'
    'sea-bream' = 'https://images.unsplash.com/photo-1518925452580-5d7fb5b581a1?w=400&h=300&fit=crop'
    'swordfish' = 'https://images.unsplash.com/photo-1518925452580-5d7fb5b581a1?w=400&h=300&fit=crop'
    'manta-ray' = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop'
    'anglerfish' = 'https://images.unsplash.com/photo-1534448238561-675f3e9c5a5d?w=400&h=300&fit=crop'
    'jellyfish' = 'https://images.unsplash.com/photo-1545671913-b89ac1b4ac10?w=400&h=300&fit=crop'
    'lanternfish' = 'https://images.unsplash.com/photo-1534448238561-675f3e9c5a5d?w=400&h=300&fit=crop'
    'giant-squid' = 'https://images.unsplash.com/photo-1545671913-b89ac1b4ac10?w=400&h=300&fit=crop'
    'viperfish' = 'https://images.unsplash.com/photo-1534448238561-675f3e9c5a5d?w=400&h=300&fit=crop'
    'nautilus' = 'https://images.unsplash.com/photo-1545671913-b89ac1b4ac10?w=400&h=300&fit=crop'
    'coelacanth' = 'https://images.unsplash.com/photo-1518925452580-5d7fb5b581a1?w=400&h=300&fit=crop'
    'dragon-fish' = 'https://images.unsplash.com/photo-1534448238561-675f3e9c5a5d?w=400&h=300&fit=crop'
}

$successCount = 0
$failCount = 0

foreach ($fish in $fishImages.GetEnumerator()) {
    $outputFile = Join-Path $outputDir "$($fish.Key).jpg"
    Write-Host "Downloading: $($fish.Key)"
    try {
        Invoke-WebRequest -Uri $fish.Value -OutFile $outputFile -ErrorAction Stop -TimeoutSec 30
        $size = (Get-Item $outputFile).Length
        if ($size -gt 1000) {
            Write-Host "  Success: $outputFile ($size bytes)" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "  File too small, may be invalid" -ForegroundColor Yellow
            $failCount++
        }
    } catch {
        Write-Host "  Failed: $_" -ForegroundColor Red
        $failCount++
    }
    Start-Sleep -Milliseconds 200
}

Write-Host "`nDownload completed! Success: $successCount, Failed: $failCount"
