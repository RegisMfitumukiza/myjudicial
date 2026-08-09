cd E:\myJudicial\myjudicial-frontend
$proc = Start-Process -FilePath "npx" -ArgumentList "next dev --port 3000" -NoNewWindow -PassThru -RedirectStandardOutput "dev_output.log" -RedirectStandardError "dev_error.log"
Start-Sleep -Seconds 18
Write-Host "=== STDOUT ==="
Get-Content dev_output.log -ErrorAction SilentlyContinue
Write-Host "=== STDERR ==="
Get-Content dev_error.log -ErrorAction SilentlyContinue
Write-Host "=== PORT CHECK ==="
netstat -ano | Select-String "LISTENING" | Select-String ":300"
