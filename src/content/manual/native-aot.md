---
title: NativeAOT builds
description: How exported games compile your C# modules ahead of time with NativeAOT, what the build machine needs, and the rules that keep scripts AOT-safe.
section: Scripting
order: 10
---

Exported games don't need .NET installed, and they include neither a compiler nor your source code. The export compiles every gameplay module ahead of time with NativeAOT into one native library, and the game loads that library at startup. Your scripts run as native code, with no JIT warm-up and no hot reload.

You don't set any of this up. The export finds your modules and builds them; this page explains what it does and what can make it fail.

## What the export does

When you export (in the editor, **Build > Build Current Profile**), the export job:

1. finds every module (each folder with an `ara.module.toml`) whose `profile` is `gameplay`. Modules with `profile = "editor"` are left out;
2. orders them by their `references`, refusing cycles and unknown references;
3. generates its own build projects, with the Ara source generator and analyzers. It doesn't use or change any `.csproj` in your project;
4. links all the modules into one NativeAOT shared library, referenced modules first;
5. writes `game/scripts.json` beside it, recording the engine's script ABI version, its component layout hash and the linked modules.

At startup, the game checks `scripts.json` against the player before it loads the library, and the library checks its own compiled bindings again when it starts.

## What the build machine needs

- The x64 .NET 10 SDK.
- The MSVC C++ Build Tools and the Windows SDK, which NativeAOT uses to link native code.

Run `ara doctor` to check your setup. The first export of a project can take a couple of minutes; the installed Outpost sample's first export took about 130 seconds in testing.

## Stricter than Play

The export compiles with all warnings treated as errors. Code that hot-reloads fine in Play can still fail the export:

- **Allocation warnings.** [ARA0300](/docs/reference/errors/ARA0300) (an allocation on the tick path) is a warning in Play and an error in the export. A common case is string interpolation in `OnTick`, such as `Log.Info($"hp {hp}")`.
- **Compiler warnings.** Nullable-reference warnings and other C# warnings are also errors. In Play, the compile server reports only errors and Ara's own warnings, so you may not have seen them.

To catch these before you export, build your module's IDE project with the generator and analyzers added (see [C# scripting](/docs/manual/scripting-overview#set-up-your-ide)) and `TreatWarningsAsErrors` set to `true`.

## AOT-safe code

NativeAOT can't generate code at run time or load assemblies, and trimming removes code that only reflection reaches. The analyzers reject the APIs that break this while you develop, so AOT problems show up in Play, not at export time:

| Code | Rejects |
|---|---|
| [ARA0400](/docs/reference/errors/ARA0400) | `Assembly.Load*`, `Reflection.Emit`, `Activator.CreateInstance(Type)`, looking up types or members by name, `MakeGeneric*`, reflective `Invoke`, compiling expression trees, `dynamic` |
| [ARA0503](/docs/reference/errors/ARA0503) | Other reflection and dynamic-code APIs |

Use generated code and direct, typed calls instead. Registration, component storage and command parameters are already generated for you.

## Module names

In exported games, a module name must be unique in the project and may contain only ASCII letters, digits, `.` and `_`. A duplicate or invalid name fails the export with [ARA0920](/docs/reference/errors/ARA0920).

## When the game won't load its scripts

| Code | Meaning | Fix |
|---|---|---|
| [ARA0921](/docs/reference/errors/ARA0921) | The scripts and the player were built by different versions of Ara: the ABI version or layout hash differ. | Export again with the same engine version as the player. |
| [ARA0920](/docs/reference/errors/ARA0920) | The script library is missing, or the module list doesn't match it. | Export again; don't edit the `game/` folder by hand. |
| [ARA0922](/docs/reference/errors/ARA0922) | The C# tooling is missing on the build machine, or the runtime couldn't start. | Run `ara doctor` and install what it reports. |

## What's different in an exported game

- **No hot reload.** There is no compile server, no file watcher and no Roslyn. Editing a `.cs` file does nothing until you export again.
- **Same state model.** Components, resources and behaviour properties live in the ECS exactly as in Play, and snapshots and restores work the same way.
- **Same behaviour.** The generated registration code is the same in Play and in the export, so systems, behaviours and commands are registered identically.
