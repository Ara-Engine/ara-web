---
title: Install
description: Install Ara 0.0.1-alpha on Windows through Ara Hub or the engine setup, then check that the CLI and its prerequisites work.
section: Start
order: 2
---

Ara installs per user, and each engine version lives in its own folder, so you can keep several versions side by side. The usual way to install is through Ara Hub, which manages engine versions for you.

## Requirements

| Item | Requirement |
|---|---|
| Operating system | Windows 10 or 11, x64 |
| Memory | 16 GB RAM |
| GPU | A Vulkan 1.3 GPU with a current driver |
| .NET | The x64 [.NET 10 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/10.0), which includes the runtime |
| C++ runtime | The [Microsoft Visual C++ v14 Redistributable (x64)](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist), used by the bundled shader tools |

Exporting a game with NativeAOT also needs the MSVC C++ Build Tools and the Windows SDK. You don't need Rust or the Vulkan SDK: the shader tools ship with the engine.

Every rendering preset in this release is raster. Hardware ray tracing is experimental; the install notes recommend an RTX 20-series or Radeon RX 6000 GPU or newer if you want to try it.

## Install with Ara Hub

1. Download `ara-hub-0.0.1-alpha-windows-x64-setup.exe` from the [GitHub Releases page](https://github.com/Ara-Engine/ara/releases) and run it.
2. In the Hub, open **Installs**, select **Preview**, and install engine **0.0.1-alpha**. Hub releases and engine releases are separate, and the alpha is a prerelease, so it appears under Preview.
3. Create a project from **New project**. [Your first project](/docs/manual/first-project) walks through it.

The Hub installs engines into `%LOCALAPPDATA%\Ara\Engines\<version>`. It verifies downloads against signed release manifests and SHA-256 hashes, and it can update itself.

Once an engine is installed, you can also manage versions from the command line:

```powershell
ara hub engines                               # installed versions
ara hub engines --available --channel preview # published versions, including prereleases
ara hub install 0.0.1-alpha                   # download, verify and register a version
ara hub uninstall 0.0.1-alpha                 # remove a Hub-managed version
```

`ara hub uninstall` refuses while a project pinned to that version is open. See the [hub CLI reference](/docs/reference/cli/hub).

## Install with the engine setup

`ara-0.0.1-alpha-windows-x64-setup.exe` installs the engine and the Hub together. By default it installs to `%LOCALAPPDATA%\Programs\Ara\<version>` and creates versioned Start menu shortcuts.

For a silent install or a custom folder, run it from PowerShell. Piping to `Out-Host` makes PowerShell wait for it to finish:

```powershell
.\ara-0.0.1-alpha-windows-x64-setup.exe --silent --destination C:\Tools\Ara | Out-Host
```

Running setup again for a version that is already installed asks before replacing it. Silent installs need `--replace` to do that. Setup never touches a folder that isn't an Ara installation.

There is also a portable ZIP. Extract it and run its install script:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1
```

The engine setup adds its folder to your per-user `PATH`. Restart your terminal afterwards so `ara` is found.

> **Warning:** Neither the Hub setup nor the engine setup has Authenticode signing in this alpha, so Windows SmartScreen may warn when you run them. Check that the file came from the official Releases page before you choose **More info**, then **Run anyway**. The Hub's signed manifests protect its own downloads and updates, but they don't remove the Windows warning.

## Check the installation

Open a new terminal and run:

```powershell
ara --version
ara doctor
```

On a working machine you see:

```text
ara 0.0.1-alpha
OK .NET 10 SDK
OK .NET 10 runtime
OK Slang shader compiler
OK SPIR-V validator
Graphics: Windows 10/11 x64, Vulkan 1.3 GPU/driver; ray tracing recommended. RAM: 16 GB. GPU launch is verified by opening the editor.
```

`ara doctor` needs no project. If a prerequisite is missing it says which one, prints where to download it, and exits with code 1. It doesn't test the GPU; opening the editor does.

> **Note:** If `ara` isn't found, either restart the terminal or call it by its full path, for example `%LOCALAPPDATA%\Ara\Engines\0.0.1-alpha\ara.exe` for a Hub-installed engine. Agents don't need `ara` on `PATH` when you connect them through the Hub; see [Connect an agent](/docs/manual/connect-an-agent).

## Engine versions and projects

Every project records the engine version it uses in the `engineVersion` field of its `ara.project.json`. The Hub uses that pin to open each project with the right engine. See [Projects](/docs/manual/projects).

## Crash reports

Editor and Hub crash reports are written to `%LOCALAPPDATA%\Ara\crashes` and are never uploaded. The next time you open the editor, it offers to open any new reports.

## Uninstall

Close your projects and any editor or player windows, then uninstall from **Settings > Apps > Installed apps** in Windows. Your projects and user settings stay where they are.
