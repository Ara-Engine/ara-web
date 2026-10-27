---
title: C# scripting
description: What C# scripting is in Ara, how gameplay code is organised into modules with ara.module.toml, and how the engine builds and loads it.
section: Scripting
order: 1
---

You write gameplay for Ara in C# 14 on .NET 10. The engine is written in Rust and hosts .NET in the same process. While you play in the editor, a compile server rebuilds your code on every save and swaps it into the running game. Exported games run the same code compiled ahead of time with NativeAOT.

C# is the only scripting language. This page covers how a script project is laid out and built. The rest of the section covers each part of the API.

## The building blocks

Gameplay code is made of four kinds of declarations:

| You write | What it is | Read more |
|---|---|---|
| `[Component]` and `[Resource]` structs | Data stored in the engine's ECS: per entity, or one per world | [Components and resources](/docs/manual/components-and-resources) |
| A class deriving from `Behaviour` | A per-entity object with callbacks such as `OnTick`, similar to a Unity `MonoBehaviour` | [Behaviours](/docs/manual/behaviours) |
| A `[Query]` method | A system that runs over every entity with the components it asks for, in parallel | [Systems and queries](/docs/manual/systems-and-queries) |
| A `[Command]` class | A named, validated gameplay action that tools and agents can call | [Script commands](/docs/manual/script-commands) |

All gameplay state lives in ECS components and resources. Behaviour objects and static fields hold none, and the analyzers enforce this. That is why saves, replays, networking and hot reload all see the whole game state.

## Create your first script

In the editor, choose **Create > C# Behaviour**. The editor:

- creates the folder `scripts/<ProjectName>/` with an `ara.module.toml`, if the project has no script module yet (otherwise it uses the first module it finds);
- adds `Spinner.cs` (then `Spinner2.cs`, and so on);
- writes `<Module>.csproj` beside it for your IDE;
- opens the folder in VS Code if it is installed, or the file in your default editor.

The new file is a complete behaviour:

```csharp
namespace MyGame;

/// <summary>Spins its entity around the Y axis. Edit while playing: saving hot-reloads it.</summary>
public sealed partial class Spinner : Behaviour
{
    /// <summary>Turn speed.</summary>
    [Property, Unit(Units.Degrees)] public partial float Speed { get; set; }

    /// <inheritdoc/>
    protected override void OnTick(in Tick t)
    {
        ref var transform = ref Get<Transform>();
        transform.Rotation.Y += (Speed == 0 ? 90f : Speed) * t.Dt;
    }
}
```

Press **Play** to compile it. Then attach it to an entity by adding the `Spinner` component, the same way you add any component. Each behaviour gets a component named after its class. From the command line:

```sh
ara do component.add -p entity=name:Crate -p component=Spinner -p value.speed=45 --why "Spin the crate"
```

Field names in documents are camelCase versions of the C# names, so `Speed` is `speed`.

> **Gap:** The editor and `ara serve` read C# types from the module's `<Module>.types.json` only when they open the project. Play writes that file the first time it compiles the module and rewrites it when you change a reflected declaration. Reopen the project, or restart `ara serve`, before you add a new C# component or field to entities in a document.

## Modules

A module is a folder that contains an `ara.module.toml` file. Every `.cs` file under the folder is compiled into one assembly, and that assembly is the unit of hot reload. The engine finds modules anywhere in the project. It skips hidden folders and `bin`, `obj` and `target` folders, and it does not look for modules inside a module.

```toml
[module]
name = "MyGame"              # module and assembly name
hot = true                   # start ready for fast hot reload (default: false)
references = ["MyGame.Core"] # modules this one uses (default: none)
profile = "gameplay"         # API allowlist: "gameplay" (default) or "editor"
```

| Key | Meaning |
|---|---|
| `name` | Required. The module and assembly name. For exported games, use ASCII letters, digits, `.` and `_`, and keep it unique in the project. |
| `hot` | `true` compiles the module as debuggable IL with Edit and Continue from the start, so the first edit is already fast. Modules start optimized otherwise. See [Hot reload](/docs/manual/hot-reload). |
| `references` | Other modules whose public types this module uses. They load first. A cycle refuses every module in it ([ARA0923](/docs/reference/errors/ARA0923)); an unknown name refuses this module ([ARA0924](/docs/reference/errors/ARA0924)). |
| `profile` | `gameplay` restricts code to the gameplay API allowlist ([ARA0500](/docs/reference/errors/ARA0500)). `editor` allows a broader set, including files, processes and tasks. Editor modules still load in Play but are left out of exported games. |

Any other key is an error. Keep each module under about 5,000 lines: reload time grows with module size, not edit size. The compile server reports modules past 5,000 lines ([ARA0902](/docs/reference/errors/ARA0902)) and warns past 8,000 ([ARA0903](/docs/reference/errors/ARA0903)). Split large games into several modules that reference each other.

> **Gap:** `Ara.Runtime` has no editor API yet. An `editor` module gets a broader allowlist, not extra engine features.

## Project layout

A typical project with one module looks like this:

```text
MyGame/
  ara.project.json
  levels/
    main.scene
  scripts/
    MyGame/
      ara.module.toml
      MyGame.csproj        for your IDE only; Ara does not use it
      MyGame.types.json    written by Play; lets tools validate your components
      Spinner.cs
      Door.cs
```

Commit `<Module>.types.json` with the rest of the project. The editor, `ara check` and agents use it to validate C# components in scenes without running .NET.

## How a module is built

You never build a module yourself. When Play starts, each player process loads your modules through a warm compile server that runs in its own process, so compiling never stalls the game. The compile server:

- compiles every `.cs` file in the module with C# 14, nullable reference types enabled and unsafe code allowed;
- adds these global usings: `System`, `System.Collections.Generic`, `System.Linq`, `System.Numerics` and `Ara`;
- runs the Ara source generator, which writes the registration code, the storage behind each `[Property]` and the entry points for systems and commands;
- runs the Ara analyzers on the files you changed, and blocks the reload on any error.

When a compile fails, nothing is applied and the last good code keeps running. Errors arrive as diagnostics; see [Script diagnostics](/docs/manual/script-diagnostics).

Play needs the x64 .NET 10 SDK on your machine. If the project has modules but the engine can't find its .NET host, Play is refused; run `ara doctor` to check your setup.

## Set up your IDE

The generated `<Module>.csproj` gives your IDE completion and navigation. As generated, it references only `Ara.Runtime.dll`, so the IDE reports error CS9248 on every `[Property]` and doesn't run the Ara analyzers. To fix both, add the engine's generator and analyzers and allow unsafe code. They are installed beside the engine, under `dotnet\artifacts\bin\` in the engine's install folder (for example `%LOCALAPPDATA%\Ara\Engines\0.0.1-alpha`):

```text
<PropertyGroup>
  <AllowUnsafeBlocks>true</AllowUnsafeBlocks>
</PropertyGroup>
<ItemGroup>
  <Analyzer Include="<engine>\dotnet\artifacts\bin\Ara.Generators\release\Ara.Generators.dll" />
  <Analyzer Include="<engine>\dotnet\artifacts\bin\Ara.Analyzers\release\Ara.Analyzers.dll" />
</ItemGroup>
```

With these lines, a plain `dotnet build` of the IDE project checks the same rules the compile server does. Ara itself still ignores the project file.

## Next steps

- [Behaviours](/docs/manual/behaviours): per-entity scripts and their properties.
- [Lifecycle and determinism](/docs/manual/lifecycle-and-determinism): when your code runs, and the rules simulation code follows.
- [Hot reload](/docs/manual/hot-reload): what happens when you save while playing.
