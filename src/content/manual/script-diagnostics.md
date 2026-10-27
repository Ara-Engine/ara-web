---
title: Script diagnostics
description: The ARA codes a script author meets, from the analyzers, the source generator and the C# host, what each one means, and where to see them.
section: Scripting
order: 11
---

Ara checks your scripts at three points. The **analyzers** check the rules that keep gameplay code safe to reload, replay and ship. The **source generator** checks that your declarations have a shape it can register. The **C# host** reports problems while loading and running modules. Each problem has an `ARA` code with its own reference page.

A diagnostic never breaks the running game. When a compile or a module load fails, the last good code keeps running.

## Where you see them

- **While playing**, compile and load diagnostics arrive with the reload; see them in the editor, with `ara logs`, or with the `ara_play` action `events`.
- **In your IDE**, if you add the generator and analyzers to the module's IDE project. See [Set up your IDE](/docs/manual/scripting-overview#set-up-your-ide).
- **To explain a code**, run `ara why ARA0101` (over MCP: `ara_why`). It answers with likely causes and fixes. For how diagnostics work across the engine, see [Diagnostics](/docs/manual/diagnostics).

A message names the problem and what to do instead:

```text
Door.cs(14,11): error ARA0101: Field '_speed' on Behaviour 'Door' would hold state outside the ECS; make it a [Property] partial property, or mark it [Transient] if it is a presentation cache
```

## Analyzer rules

These are errors, except ARA0300.

| Code | Reports | Do instead |
|---|---|---|
| [ARA0001](/docs/reference/errors/ARA0001) | Unity habits: `using UnityEngine`, `MonoBehaviour`, `Update`/`Start`/..., `GetComponent<T>()`, `Time.deltaTime`, `Debug.Log`, lowercase `.x` on vectors | The Ara equivalent named in the message; see [Coming from Unity](/docs/manual/behaviours#coming-from-unity) |
| [ARA0100](/docs/reference/errors/ARA0100) | A mutable static field, or a static auto-property with a setter | A `[Resource]`, or `const`/`static readonly` for data that never changes |
| [ARA0101](/docs/reference/errors/ARA0101) | A behaviour instance field without `[Transient]` | A `[Property]` partial property, or `[Transient]` for a cache |
| [ARA0200](/docs/reference/errors/ARA0200) | Non-deterministic code in `[Simulation]` code | `Tick.Dt` and the provided `Rng`; see [Determinism](/docs/manual/lifecycle-and-determinism#determinism) |
| [ARA0300](/docs/reference/errors/ARA0300) | **Warning:** an allocation in a system, `OnTick`, `OnFrame` or a command's `Execute` | Structs, spans, `stackalloc` or reused buffers. Exports treat it as an error |
| [ARA0400](/docs/reference/errors/ARA0400) | An API that breaks under NativeAOT or trimming | Generated code and direct calls; see [NativeAOT builds](/docs/manual/native-aot) |
| [ARA0500](/docs/reference/errors/ARA0500) | An API that isn't on the module profile's allowlist | An allowed API, or an `editor` module for tooling |
| [ARA0501](/docs/reference/errors/ARA0501) | File system access | Assets for data, components for state |
| [ARA0502](/docs/reference/errors/ARA0502) | Network access | Replication and commands |
| [ARA0503](/docs/reference/errors/ARA0503) | Reflection or dynamic code | Generated code and typed calls |
| [ARA0504](/docs/reference/errors/ARA0504) | Threads, locks, tasks or `await` | Systems, which already run in parallel |
| [ARA0505](/docs/reference/errors/ARA0505) | Native interop: `extern`, `Marshal` | Ara APIs |
| [ARA0506](/docs/reference/errors/ARA0506) | `Console`, `Environment`, `GC`, `Debug.Write*`, `Process`, the debugger | `Log.Info`, `Log.Warn` and `Log.Error` for output; the `Tick` for time |

### The gameplay allowlist

Gameplay modules may use the language runtime: primitives, strings, math, spans, collections, LINQ, `System.Numerics` and SIMD intrinsics, text and regular expressions, globalization, buffers, `Unsafe` and `MemoryMarshal`, in-memory streams, `Debug.Assert` and `Stopwatch`. Ara types and your own modules' types are always allowed.

Modules with `profile = "editor"` also get files, the network, processes, the console, tasks and threads, read-only reflection, XML, JSON and cryptography. They still can't generate code at run time, load assemblies, call native code or end the process.

## Generator rules

These are all errors.

| Code | Reports |
|---|---|
| [ARA0701](/docs/reference/errors/ARA0701) | A component, resource, cue, behaviour, system or command class (or a type that contains it) isn't `partial`. |
| [ARA0702](/docs/reference/errors/ARA0702) | A system parameter the generator can't bind, such as a tag component or a behaviour's `Data`. |
| [ARA0703](/docs/reference/errors/ARA0703) | A reflected type, field, property, enum value or command parameter has no documentation. |
| [ARA0704](/docs/reference/errors/ARA0704) | A field type that can't live in ECS storage, or an invalid schema name. |
| [ARA0705](/docs/reference/errors/ARA0705) | A `[Command]` class without a valid `Execute` method, or with misplaced `ref`/`in` parameters. |
| [ARA0706](/docs/reference/errors/ARA0706) | A behaviour without a public parameterless constructor, or a `[Property]` that isn't a partial instance property without a body. |
| [ARA0707](/docs/reference/errors/ARA0707) | A `[Query]` method that isn't `static void`, is generic, or has no component parameter. |

> **Note:** A field of an unsupported number type such as `short` currently reports ARA0703 about `Int16` instead of ARA0704. Use a supported type from [Field types](/docs/manual/components-and-resources#field-types).

## Compiling and loading

| Code | Meaning |
|---|---|
| [ARA0900](/docs/reference/errors/ARA0900) | A C# compile error. The message includes the compiler's `CS` code. |
| [ARA0901](/docs/reference/errors/ARA0901) | A C# compile warning. |
| [ARA0902](/docs/reference/errors/ARA0902) | Information: the module is past 5,000 lines. Split it to keep reloads fast. |
| [ARA0903](/docs/reference/errors/ARA0903) | Warning: the module is past 8,000 lines. Its full reloads will be slow. |
| [ARA0904](/docs/reference/errors/ARA0904) | The compile server failed or exited; reloads stop until it restarts. |
| [ARA0905](/docs/reference/errors/ARA0905) | The runtime refused a fast (L1/L2) reload; the edit is rebuilt as L3. |
| [ARA0920](/docs/reference/errors/ARA0920) | A module failed to load or register. |
| [ARA0921](/docs/reference/errors/ARA0921) | The generated bindings don't match the engine: rebuild with the same engine version. |
| [ARA0922](/docs/reference/errors/ARA0922) | The .NET runtime or the script runtime couldn't start. |
| [ARA0923](/docs/reference/errors/ARA0923) | Modules reference each other in a cycle; none of them load. |
| [ARA0924](/docs/reference/errors/ARA0924) | A module references a module that isn't loaded. |
| [ARA0925](/docs/reference/errors/ARA0925) | A module couldn't be rebuilt against a changed dependency; the whole cascade keeps its last good version. |
| [ARA0926](/docs/reference/errors/ARA0926) | The change needs an L4 restart of the play process. |
| [ARA0927](/docs/reference/errors/ARA0927) | An old module version is still held in memory after unloading. |
| [ARA0930](/docs/reference/errors/ARA0930), [ARA0931](/docs/reference/errors/ARA0931) | A component's memory layout can't be used, or doesn't match the schema. |
| [ARA0932](/docs/reference/errors/ARA0932) | Code names a component or resource the engine doesn't know. |
| [ARA0933](/docs/reference/errors/ARA0933) | A module declares something invalid, such as a component another module already declares. |
| [ARA0934](/docs/reference/errors/ARA0934) | A component used by a system has storage C# systems can't read. |

A name that clashes with an engine type fails registration with [ARA1110](/docs/reference/errors/ARA1110). See [Names](/docs/manual/components-and-resources#names).

## Running

| Code | Meaning |
|---|---|
| [ARA0910](/docs/reference/errors/ARA0910) | A system threw; it is disabled until the next reload. |
| [ARA0911](/docs/reference/errors/ARA0911) | A behaviour callback threw; the behaviour type is disabled until the next reload. |
| [ARA0912](/docs/reference/errors/ARA0912) | A command threw; the call is rolled back and the command is disabled until the next reload. |
| [ARA0950](/docs/reference/errors/ARA0950) | No command with this name is loaded. |
| [ARA0951](/docs/reference/errors/ARA0951) | Command params don't match the command's params type. |
| [ARA0952](/docs/reference/errors/ARA0952) | A command rejected the call with `ctx.Reject`; nothing it wrote is kept. |
| [ARA0953](/docs/reference/errors/ARA0953) | An undo record no longer applies, because an entity it touched is gone. |

Codes ARA0960 to ARA0963 belong to C# scripts that agents run through `ara_run`, not to your modules.

> **Gap:** The engine's source includes code fixes for ARA0001, ARA0101 and ARA0506 (for example, "Mark as [Transient] cache"), but the installed engine doesn't ship them, so IDEs don't offer them yet. Apply the fixes by hand.
