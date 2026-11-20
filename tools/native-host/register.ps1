$jsonPath = "D:\DevDrop\tools\native-host\com.devdrop.launcher.json"

$targets = @(
    "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.devdrop.launcher",
    "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.devdrop.launcher",
    "HKCU:\Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\com.devdrop.launcher"
)

foreach ($target in $targets) {
    if (-not (Test-Path $target)) {
        New-Item -Path $target -Force | Out-Null
    }
    Set-ItemProperty -Path $target -Name "(Default)" -Value $jsonPath
    Write-Host "Registered Native Messaging Host at: $target"
}
Write-Host "Chrome Native Messaging registered successfully!"

