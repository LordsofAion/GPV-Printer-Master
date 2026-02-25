# This script must be run with Admin privileges
# Step 1: Enable Developer Mode (allows symlinks)
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock" /t REG_DWORD /f /v "AllowDevelopmentWithoutDevLicense" /d "1"

# Step 2: Clean old winCodeSign cache
$cachePath = "$env:LOCALAPPDATA\electron-builder\Cache\winCodeSign"
if (Test-Path $cachePath) {
    Remove-Item -Recurse -Force $cachePath
}

# Step 3: Build
Set-Location "d:\TRABALHO PARA ESSE ANO 2026\gpv-print-manager"
$env:CSC_IDENTITY_AUTO_DISCOVERY = 'false'
npx electron-builder --win --x64

# Step 4: Signal completion
"BUILD_SUCCESS" | Out-File "d:\TRABALHO PARA ESSE ANO 2026\gpv-print-manager\build_status.txt" -Encoding ascii

Write-Host "`n=== BUILD COMPLETO ===" -ForegroundColor Green
Read-Host "Pressione Enter para fechar"
