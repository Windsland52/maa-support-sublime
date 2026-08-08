param(
    [string]$SublimeRoot = "C:\Program Files\Sublime Text",
    [string]$DependencyData = (Join-Path $env:APPDATA "Sublime Text"),
    [string]$PackagePath = "",
    [switch]$KeepTemp
)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
if (-not $PackagePath) {
    $PackagePath = Join-Path $repo "release\LSP-MaaFramework.sublime-package"
}
$PackagePath = [IO.Path]::GetFullPath($PackagePath)
$SublimeRoot = [IO.Path]::GetFullPath($SublimeRoot)
$DependencyData = [IO.Path]::GetFullPath($DependencyData)

if (-not (Test-Path -LiteralPath (Join-Path $SublimeRoot "sublime_text.exe") -PathType Leaf)) {
    throw "Sublime Text executable not found under $SublimeRoot"
}
if (-not (Test-Path -LiteralPath $PackagePath -PathType Leaf)) {
    throw "Package not found: $PackagePath. Run pnpm package:sublime first."
}

$temporaryBase = [IO.Path]::GetFullPath($env:TEMP).TrimEnd([IO.Path]::DirectorySeparatorChar)
$testRoot = Join-Path $temporaryBase ("maa-support-sublime-ui-" + [guid]::NewGuid().ToString("N"))
$testRoot = [IO.Path]::GetFullPath($testRoot)
if (-not $testRoot.StartsWith($temporaryBase + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to create UI test outside the temporary directory: $testRoot"
}

$app = Join-Path $testRoot "app"
$data = Join-Path $app "Data"
$fixture = Join-Path $testRoot "fixture"
$resultFile = Join-Path $testRoot "result.json"
$stdoutFile = Join-Path $testRoot "sublime.stdout.log"
$stderrFile = Join-Path $testRoot "sublime.stderr.log"
$process = $null
$oldResult = $env:MAA_SUBLIME_UI_RESULT
$oldProject = $env:MAA_SUBLIME_UI_PROJECT
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

try {
    New-Item -ItemType Directory -Path $app | Out-Null
    Copy-Item -Path (Join-Path $SublimeRoot "*") -Destination $app -Recurse -Force
    New-Item -ItemType Directory -Path (Join-Path $data "Installed Packages") -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $data "Packages\User") -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $data "Packages\MaaFrameworkUITest") -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $data "Lib\python38") -Force | Out-Null

    Copy-Item -LiteralPath $PackagePath -Destination (Join-Path $data "Installed Packages\LSP-MaaFramework.sublime-package")

    $installedLsp = Join-Path $DependencyData "Installed Packages\LSP.sublime-package"
    $sourceLsp = Join-Path $DependencyData "Packages\LSP"
    if (Test-Path -LiteralPath $installedLsp -PathType Leaf) {
        Copy-Item -LiteralPath $installedLsp -Destination (Join-Path $data "Installed Packages\LSP.sublime-package")
    }
    elseif (Test-Path -LiteralPath $sourceLsp -PathType Container) {
        Copy-Item -LiteralPath $sourceLsp -Destination (Join-Path $data "Packages\LSP") -Recurse
    }
    else {
        throw "A real LSP package was not found under dependency data $DependencyData"
    }

    $dependencyLib = Join-Path $DependencyData "Lib\python38"
    if (-not (Test-Path -LiteralPath (Join-Path $dependencyLib "lsp_utils") -PathType Container)) {
        throw "lsp_utils was not found under $dependencyLib"
    }
    Copy-Item -Path (Join-Path $dependencyLib "*") -Destination (Join-Path $data "Lib\python38") -Recurse -Force
    $portableLib = Join-Path $data "Lib\python38"
    if (-not (Test-Path -LiteralPath (Join-Path $portableLib "sublime_lib") -PathType Container)) {
        $sublimeLibWheel = Join-Path $testRoot "sublime_lib-2.1.0-py3-none-any.whl"
        Invoke-WebRequest -Uri "https://github.com/SublimeText/sublime_lib/releases/download/v2.1.0/sublime_lib-2.1.0-py3-none-any.whl" -OutFile $sublimeLibWheel
        $wheelHash = (Get-FileHash -LiteralPath $sublimeLibWheel -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($wheelHash -ne "0e7419793a7104d61abb8429d109520463b7688eceb328e283bdb759a4a4b195") {
            throw "Downloaded sublime_lib wheel failed SHA-256 verification"
        }
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [IO.Compression.ZipFile]::ExtractToDirectory($sublimeLibWheel, $portableLib)
    }

    Copy-Item -LiteralPath (Join-Path $PSScriptRoot "sublime_ui_runner.py") -Destination (Join-Path $data "Packages\MaaFrameworkUITest\ui_test.py")
    [IO.File]::WriteAllText((Join-Path $data "Packages\MaaFrameworkUITest\.python-version"), "3.8", $utf8NoBom)
    [IO.File]::WriteAllText((Join-Path $data "Packages\User\Preferences.sublime-settings"), @'
{
  "hot_exit": false,
  "remember_open_files": false,
  "index_files": false,
  "show_update_window": false,
  "update_check": false
}
'@, $utf8NoBom)

    New-Item -ItemType Directory -Path (Join-Path $fixture "resource\pipeline") -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $fixture "config") -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $fixture "debug") -Force | Out-Null
    [IO.File]::WriteAllText((Join-Path $fixture "interface.json"), '{"name":"UI Fixture","controller":[{"name":"ADB","type":"Adb"}],"resource":[{"name":"Default","path":"resource"}],"task":[]}', $utf8NoBom)
    [IO.File]::WriteAllText((Join-Path $fixture "config\maa_pi_config.json"), '{"controller":"ADB","resource":"Default","task":[]}', $utf8NoBom)
    $fixtureFile = Join-Path $fixture "resource\pipeline\main.json"
    [IO.File]::WriteAllText($fixtureFile, '{"Entry":{"recognition":"DirectHit","action":"DoNothing"}}', $utf8NoBom)
    [IO.File]::WriteAllText((Join-Path $fixture "debug\maafw.log"), '[2026-08-08 10:00:00.000][INF][Tasker.cpp] [msg=Tasker.Task.Starting] [entry=Entry]', $utf8NoBom)

    $projectFile = Join-Path $testRoot "fixture.sublime-project"
    $projectJson = @{ folders = @(@{ path = $fixture }) } | ConvertTo-Json -Depth 4
    [IO.File]::WriteAllText($projectFile, $projectJson, $utf8NoBom)

    $env:MAA_SUBLIME_UI_RESULT = $resultFile
    $env:MAA_SUBLIME_UI_PROJECT = $fixture
    $executable = Join-Path $app "sublime_text.exe"
    $process = Start-Process -FilePath $executable -ArgumentList @("--project", "`"$projectFile`"", "`"$fixtureFile`"", "--new-window") -PassThru -WindowStyle Hidden -RedirectStandardOutput $stdoutFile -RedirectStandardError $stderrFile

    $deadline = [DateTime]::UtcNow.AddSeconds(45)
    while (-not (Test-Path -LiteralPath $resultFile -PathType Leaf) -and [DateTime]::UtcNow -lt $deadline) {
        if ($process.HasExited) {
            throw "Portable Sublime Text exited before producing a UI test result (exit code $($process.ExitCode))"
        }
        Start-Sleep -Milliseconds 250
    }
    if (-not (Test-Path -LiteralPath $resultFile -PathType Leaf)) {
        throw "Timed out waiting for the portable Sublime Text UI test"
    }

    $result = Get-Content -LiteralPath $resultFile -Raw | ConvertFrom-Json
    $result | ConvertTo-Json -Depth 8
    if (-not $result.passed) {
        if (Test-Path -LiteralPath $stdoutFile) {
            Get-Content -LiteralPath $stdoutFile
        }
        if (Test-Path -LiteralPath $stderrFile) {
            Get-Content -LiteralPath $stderrFile
        }
        throw "Real Sublime Text UI test failed"
    }
}
finally {
    $env:MAA_SUBLIME_UI_RESULT = $oldResult
    $env:MAA_SUBLIME_UI_PROJECT = $oldProject
    if ($process -and -not $process.HasExited) {
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        $process.WaitForExit(5000) | Out-Null
    }
    if (-not $KeepTemp -and (Test-Path -LiteralPath $testRoot)) {
        $verified = [IO.Path]::GetFullPath($testRoot)
        if (-not $verified.StartsWith($temporaryBase + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
            throw "Refusing to remove unverified UI test directory: $verified"
        }
        Remove-Item -LiteralPath $verified -Recurse -Force -ErrorAction SilentlyContinue
    }
    elseif ($KeepTemp) {
        Write-Output "UI test files retained at $testRoot"
    }
}
