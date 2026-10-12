import { execSync } from 'child_process';

const out = execSync('powershell -NoProfile -Command "Get-Process | Where-Object { \\$_.MainWindowTitle } | Select-Object Id, ProcessName, MainWindowTitle | Format-Table -AutoSize"').toString();
console.log(out);
