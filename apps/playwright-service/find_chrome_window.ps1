Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class WindowFinder {
    public delegate bool CallBackPtr(IntPtr hwnd, int lParam);
    [DllImport("user32.dll")]
    public static extern int EnumWindows(CallBackPtr callPtr, int lPar);
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@

$channelPids = (Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'chrome.exe' -and $_.CommandLine -like '*channel_3*' }).ProcessId
Write-Host "Channel 3 Chrome PIDs: $($channelPids -join ', ')"

$global:foundList = [System.Collections.ArrayList]::new()

[WindowFinder]::EnumWindows({
    param($hwnd, $lparam)
    $p = 0
    [WindowFinder]::GetWindowThreadProcessId($hwnd, [ref]$p)
    if ($global:channelPids -contains $p) {
        $sb = New-Object System.Text.StringBuilder 256
        [WindowFinder]::GetWindowText($hwnd, $sb, 256) | Out-Null
        $title = $sb.ToString()
        $vis = [WindowFinder]::IsWindowVisible($hwnd)
        $global:foundList.Add([PSCustomObject]@{
            Hwnd = $hwnd
            Pid = $p
            Visible = $vis
            Title = $title
        }) | Out-Null
    }
    return $true
}, 0)

$global:foundList | Format-Table -AutoSize
