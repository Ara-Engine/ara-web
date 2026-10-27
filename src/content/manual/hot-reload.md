---
title: Hot reload
description: What happens when you save a script while playing, the four reload levels and their costs, what state survives, and how to keep reloads fast.
section: Scripting
order: 9
---

While Play is running, saving a `.cs` file reloads it into the running game. The game keeps ticking while the code compiles, the new code takes over at the next tick boundary, and the game state stays where it was. You don't restart Play to try a change.

## How a reload happens

1. The compile server notices the save. It runs in its own process, so compiling never stalls the game.
2. It works out the smallest kind of reload the edit allows, compiles, and runs the generator and analyzers.
3. If anything fails, nothing changes: the diagnostics are reported and the last good code keeps running ([ARA0900](/docs/reference/errors/ARA0900)).
4. Otherwise the new code is staged and swapped in at the next tick boundary, before that tick's systems run.

## Reload levels

The engine picks the cheapest of four levels for each edit:

| Level | Edits | Typical time, save to visible |
|---|---|---|
| **L1** | Changes inside existing method bodies | about 19 ms |
| **L2** | Additions: new methods, operators and non-auto properties; new fields and auto-properties on classes, without initializers; constants; new non-generic, non-partial types; lambdas inside new members | about 35–41 ms |
| **L3** | Everything else: changed signatures, struct fields, attributes, removed members, any Ara declaration, edits to a cold module | about 285 ms |
| **L4** | The engine's `Ara.Runtime.dll` changed on disk, or an old module version is still held in memory | The play process restarts from a snapshot of the current tick |

The times are medians measured on a Ryzen 7 7800X3D with a 5,200-line module, 20,000 entities and a 60 Hz tick. Treat them as a guide, not a promise.

A few more rules decide the level:

- An L1 edit must not touch lambdas or closures, iterators or `async` state machines, or constructors. Such an edit takes L3.
- The source generator's output depends only on declarations, attributes and doc comments. If an edit changes that output, it takes L3. Changing a `[Property]`, a component field, or a reflected doc comment always takes L3.
- If the runtime refuses an L1 or L2 change, the engine rebuilds it as L3 automatically ([ARA0905](/docs/reference/errors/ARA0905)).
- With a debugger attached, every edit takes L3.

An L3 builds a new copy of the module and swaps it in whole. An L4 can't be applied inside the running process, so Play restarts the player from a snapshot of the current tick, with the game state kept ([ARA0926](/docs/reference/errors/ARA0926)).

## Hot and cold modules

A module starts **cold**: compiled optimized, like release code. The first edit to a cold module is one L3 that recompiles it **hot**, as debuggable code that supports Edit and Continue. After that, body edits take L1 and additions take L2.

Set `hot = true` in `ara.module.toml` to start hot, so even the first edit is fast. **Create > C# Behaviour** sets it for you:

```toml
[module]
name = "MyGame"
hot = true
```

Hot code runs slower than optimized code. Exported games are always compiled ahead of time with NativeAOT, whatever this setting says.

## What survives a reload

Every component, resource and behaviour `[Property]` is ECS data, so it survives every reload, including L4. What changes is the code and the objects it creates:

- **Behaviour objects** are recreated. They get `OnReload` instead of `OnSpawn`, and their `[Transient]` fields start empty. See [Lifecycle and determinism](/docs/manual/lifecycle-and-determinism).
- **Changed component layouts** are migrated entity by entity at the boundary. A field that keeps its name and type keeps its value. A new field starts from its `[Default]`, and a removed field is dropped.
- **Renamed or retyped fields** start from their default in the running game, because migration matches fields by name and type. `[FormerlySerializedAs]` renames fields in files, not in a running session.
- **Disabled code comes back.** A system, behaviour or command disabled because it threw is re-enabled by the next successful reload. A re-enabled behaviour keeps its objects and doesn't get `OnSpawn` again.

## Several modules

When module A changes with an L3, every module that references A is relinked, or rebuilt if A's public types changed. All of them swap at the same tick boundary. If one of them no longer compiles, nothing applies, and both modules report [ARA0925](/docs/reference/errors/ARA0925).

## Edits from agents

An agent can write a script through the `ara_play` tool with the action `write` (a project-relative path inside a module folder, and the new text). Running players claim the file before it is written, then reload it like a save.

Agent edits wait their turn. They are batched per module until 150 ms pass without another edit, and they compile at lower priority, only when no edit of yours is queued. If you save the same module, your save absorbs the agent's pending edits.

## Watching reloads

The `ara_play` action `events` returns the reload reports and diagnostics since your last call. Each reload report gives its level (`0` is the initial load; `1` to `3` are hot reloads), its error count and its origin (your save or an agent edit). Diagnostics also appear in `ara logs`.

## Keeping reloads fast

- **Keep modules small.** An L3 costs time in proportion to the module's size, not the edit's. Stay under about 5,000 lines per module: the compile server notes modules past that ([ARA0902](/docs/reference/errors/ARA0902)) and warns past 8,000 lines ([ARA0903](/docs/reference/errors/ARA0903)).
- **Start hot** with `hot = true` while you iterate.
- **Windows scans each new module image.** Microsoft Defender's AMSI scan takes about 110–250 ms for a 5,200-line module, and it is most of an L3's load time. Smaller modules, or edits that stay at L1 and L2, avoid most of it. Adding a Defender exclusion also does, but that is your security decision to make.
