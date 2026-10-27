---
title: Lifecycle and determinism
description: When behaviour callbacks and systems run in each tick, what happens on spawn, despawn and faults, and how to keep simulation code deterministic.
section: Scripting
order: 3
---

Ara runs gameplay on a fixed simulation tick, separate from the variable-rate frames it presents. This page explains the order your code runs in during each tick, and the rules that keep that code deterministic: the same inputs give the same results on every machine and in every replay.

## The tick

Each fixed tick runs these steps in order:

1. **Tick boundary.** Pending hot reloads apply here, and only here. No C# code is running.
2. **Systems.** Every `[Query]` system runs over its matching entities. Systems that don't conflict run in parallel; see [Systems and queries](/docs/manual/systems-and-queries). Their structural commands (spawn, despawn, add, remove) apply at sync points between them.
3. **Behaviours.** Each behaviour type runs over every entity that has it, one entity at a time, with exclusive access to the world. The order is fixed: module, then behaviour type, then storage table, then row. Structural commands from behaviours apply after this phase.

Separately, every presented frame calls `OnFrame` on each behaviour object. Script commands called by tools and agents run between ticks; see [Script commands](/docs/manual/script-commands).

## Behaviour callbacks

| Callback | When it runs |
|---|---|
| `OnSpawn()` | When the object is created for an entity: the first tick the entity has the behaviour. `OnTick` runs right after it in the same tick. |
| `OnTick(in Tick tick)` | Every fixed tick. Put gameplay logic here. |
| `OnFrame(in Frame frame)` | Every presented frame, for presentation only. Never change simulation state here. It starts after the object's first tick. |
| `OnReload()` | Instead of `OnSpawn`, when a hot reload recreates the object. Rebuild `[Transient]` caches here. |

The object for an entity is created lazily, so `OnSpawn` runs whenever a fresh object meets an entity that has the behaviour. That includes a play process that restarts from a snapshot, which is what an [L4 reload](/docs/manual/hot-reload) does. `OnSpawn` therefore isn't a once-per-lifetime event. If one-time setup must not repeat, record that it happened in a `[Property]`:

```csharp
namespace MyGame;

/// <summary>A crate that rolls its contents once, when it first appears.</summary>
public sealed partial class LootCrate : Behaviour
{
    /// <summary>Medkits inside.</summary>
    [Property, Range(0, 3)] public partial int Medkits { get; set; }

    /// <summary>True once the contents have been rolled.</summary>
    [Property] public partial bool Rolled { get; set; }

    /// <inheritdoc/>
    protected override void OnSpawn()
    {
        if (Rolled) return;
        Medkits = Rng.Range(0, 4);
        Rolled = true;
    }
}
```

## Despawning and detaching

When an entity is despawned, or its behaviour component is removed, the engine drops the object within a tick or two. No callback runs.

```csharp
namespace MyGame;

/// <summary>Despawns its entity when its time runs out.</summary>
public sealed partial class Lifetime : Behaviour
{
    /// <summary>Seconds left.</summary>
    [Property, Unit(Units.Seconds), Default(3)] public partial float Remaining { get; set; }

    /// <inheritdoc/>
    protected override void OnTick(in Tick tick)
    {
        Remaining -= tick.Dt;
        if (Remaining <= 0f) Commands.Despawn(Entity);
    }
}
```

> **Gap:** Behaviours have no despawn or destroy callback (no equivalent of Unity's `OnDestroy`). Do cleanup in the code that despawns the entity.

## Ticks and frames

`OnTick`, systems and commands receive a [`Tick`](/docs/scripting/Tick). `OnFrame` receives a [`Frame`](/docs/scripting/Frame).

| Field | Meaning |
|---|---|
| `Tick.Frame` | Tick number since the session started. |
| `Tick.Dt` | The fixed step, in seconds. Use it for all simulation movement and timers. |
| `Tick.Elapsed` | Simulation time in seconds (`Frame * Dt`). |
| `Tick.Seed` | The session seed that deterministic random streams derive from. |
| `Frame.Index` | Presented frame number since the session started. |
| `Frame.Dt` | Seconds since the previous frame. Presentation only. |
| `Frame.Alpha` | Interpolation factor between the last two ticks, from 0 to 1. |

## When code throws

An exception in your code doesn't crash the game. The engine reports it and disables the code that threw until the next successful reload:

- a behaviour callback that throws disables the whole behaviour type, not just one entity ([ARA0911](/docs/reference/errors/ARA0911)). Writes the callback already made are kept. When the next reload re-enables the type, it keeps its objects, so `OnSpawn` doesn't run again;
- a system that throws is disabled ([ARA0910](/docs/reference/errors/ARA0910));
- a command that throws is rolled back and disabled ([ARA0912](/docs/reference/errors/ARA0912)).

Fix the code and save. The reload turns it back on.

## Determinism

Ara's prediction, replays and lockstep tests need simulation code to produce identical results from identical inputs. Mark your simulation code with [`[Simulation]`](/docs/scripting/SimulationAttribute), on a type or on the whole module:

```csharp
[assembly: Simulation]
```

In `[Simulation]` code, [ARA0200](/docs/reference/errors/ARA0200) rejects:

- `async` methods, `await`, tasks, `Parallel`, threads, the thread pool and timers;
- `System.Random`;
- wall-clock time: `DateTime.Now`, `UtcNow` and `Today`, `DateTimeOffset.Now` and `UtcNow`, `Environment.TickCount`, `Stopwatch`;
- `Guid.NewGuid`;
- I/O: anything in `System.IO` or `System.Net`, and `Console`;
- lambdas that capture variables inside a `[Command]`.

> **Note:** The gameplay allowlist already blocks threads, files, the network and the console in every gameplay module. It allows `System.Random`, `DateTime` and `Stopwatch`, so only `[Simulation]` catches those. Add `[assembly: Simulation]` to your gameplay modules.

Follow these rules in simulation code:

- **Use `Tick.Dt`, never frame time.** The fixed step is the same everywhere; `Frame.Dt` isn't.
- **Use the provided `Rng`.** Behaviours have `Rng`, systems take `ref Rng`, and commands have `ctx.Rng`. Each is seeded from the session seed, the tick and a stream key, so results don't depend on iteration order, thread count or machine. Its methods are `NextUInt()`, `NextFloat()` (in `[0, 1)`), `Range(min, max)` for `float` and `int` (max excluded) and `Chance(p)`.
- **Keep state in components and resources.** Mutable static fields are rejected ([ARA0100](/docs/reference/errors/ARA0100)), and behaviour objects can be recreated at any time.

| Where | Random stream |
|---|---|
| Behaviour `Rng` | Reseeded before every callback from the tick, the behaviour type and the entity. |
| System `ref Rng` | One stream per tick, system and entity. |
| Command `ctx.Rng` | One stream per command call. |

Check determinism with the `ara_test` tool: a playtest can run twice in separate processes and require equal final state hashes.
