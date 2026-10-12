Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'chrome.exe' -and $_.CommandLine -like '*channel_3*' } | Select-Object ProcessId, CommandLine | Format-List
