---
title: Systems and queries
description: Write [Query] systems that run over every entity with a set of components, in parallel, and control their order with Order, With and Without.
section: Scripting
order: 7
---

A system is a static method that runs once for every entity that has the components it asks for. You mark it with [`[Query]`](/docs/scripting/QueryAttribute), and the source generator turns it into a tight loop over the engine's component storage. Use systems when the same logic applies to many entities: movement, timers, cooldowns, AI updates.

## A first system

```csharp
namespace MyGame;

/// <summary>World tuning shared by every system.</summary>
[Resource]
public partial struct GameRules
{
    /// <summary>Downward acceleration.</summary>
    [Unit(Units.MetersPerSecondSquared), Default(9.81)] public float Gravity;
}

/// <summary>Pulls drifting bodies down.</summary>
public static partial class Gravity
{
    [Query]
    static void Run(ref Drift d, in Tick t, in GameRules rules) => d.Linear.Y -= rules.Gravity * t.Dt;
}

/// <summary>Moves transforms by their drift.</summary>
public static partial class DriftMovement
{
    [Query(Order = 10)]
    static void Run(ref Transform tr, in Drift d, in Tick t) => tr.Position += d.Linear * t.Dt;
}
```

`Gravity` runs for every entity with a `Drift` component. `DriftMovement` runs for every entity with both `Transform` and `Drift`. `Drift` is declared in [Components and resources](/docs/manual/components-and-resources).

A system method must be `static`, return `void` and not be generic ([ARA0707](/docs/reference/errors/ARA0707)). Its class must be `partial` ([ARA0701](/docs/reference/errors/ARA0701)); a `static partial class` per system keeps things readable.

## Parameters

The parameters say what the system reads and writes:

| Parameter | Meaning |
|---|---|
| `ref C` | A component this system writes. |
| `in C` | A component this system only reads. |
| `in R`, `ref R` | A resource, read or written. |
| `Entity` | The current entity's handle. |
| `in Tick` | The current tick: `Dt`, `Elapsed`, `Frame`, `Seed`. |
| `ref Rng` | A deterministic random stream for this tick, system and entity. |
| `ref Commands` | A buffer for structural changes, applied at a sync point after the system runs. |

A system needs at least one component parameter ([ARA0707](/docs/reference/errors/ARA0707)). Anything else is an error ([ARA0702](/docs/reference/errors/ARA0702)). That includes a tag component, which has no data to pass; filter on it instead.

## Filters

`[With<T>]` limits a system to entities that also have `T`, and `[Without<T>]` to entities that don't. Both are repeatable, and they are how you use tags:

```csharp
namespace MyGame;

/// <summary>Turns pickups slowly so they catch the eye.</summary>
public static partial class SpinPickups
{
    [Query, With<Pickup>]
    static void Run(ref Transform tr, in Tick t) => tr.Rotation.Y += 45f * t.Dt;
}

/// <summary>Despawns drifting bodies that fell out of the world.</summary>
public static partial class FallCleanup
{
    [Query, With<Drift>, Without<Pickup>]
    static void Run(in Transform tr, Entity e, ref Commands commands)
    {
        if (tr.Position.Y < -100f) commands.Despawn(e);
    }
}
```

## Random numbers

Take `ref Rng` for randomness. Each entity gets its own stream for each tick, derived from the session seed, the tick, the system and the entity. Results are the same on every machine, however many threads run the system and however the engine splits the work.

```csharp
namespace MyGame;

/// <summary>Patrolling guards now and then pick a new heading.</summary>
public static partial class Wander
{
    [Query]
    static void Run(in Guard g, ref Drift d, ref Rng rng)
    {
        if (g.Mode != GuardMode.Patrol || !rng.Chance(0.02f)) return;
        d.Linear.X = rng.Range(-1f, 1f);
        d.Linear.Z = rng.Range(-1f, 1f);
    }
}
```

## Order and parallelism

The scheduler reads each system's parameters: `ref` is a write, `in` a read. Systems that don't touch the same data run in parallel, and each system's entities are split into chunks that also run in parallel on the engine's worker threads.

When two systems conflict (one writes what the other reads or writes), they run in order of `Order`, lowest first, then by name. In the example above, `Gravity` has the default `Order = 0` and `DriftMovement` has `Order = 10`, so gravity changes `Drift` before movement reads it.

A system that writes a resource (`ref R`) or takes `ref Commands` processes its chunks one at a time.

All systems run before the tick's behaviours. See [Lifecycle and determinism](/docs/manual/lifecycle-and-determinism#the-tick).

## Names

A system's name is its class name when the method is called `Run` (`Gravity`), or `Class.Method` otherwise. Set another with `[Query(Name = "...")]`. The name appears in diagnostics and seeds the system's random streams, so renaming a system changes its random sequence.

## Rules for system code

- **No `World`.** Systems run in parallel and can't use `World.Get` or `World.Resource`. Declare what you need as parameters. A call to `World` throws, and the system is disabled until the next reload ([ARA0910](/docs/reference/errors/ARA0910)).
- **No allocations.** Systems run for every entity every tick. `new` on a class or array, LINQ, capturing lambdas, boxing and string building are reported as [ARA0300](/docs/reference/errors/ARA0300). It is a warning while you play, but exported builds treat it as an error; see [NativeAOT builds](/docs/manual/native-aot).
- **No behaviour data.** A behaviour's generated `Data` component can't be a system parameter or filter ([ARA0702](/docs/reference/errors/ARA0702)). Keep data that systems need in a `[Component]`.

## Systems or behaviours?

| Use a system when | Use a behaviour when |
|---|---|
| The same logic runs for many entities | The logic belongs to a few specific entities |
| It only needs the entity's own components and resources | It needs other entities' components through `World` |
| Throughput matters: it runs in parallel without per-entity calls | Convenience matters: it runs one entity at a time, with callbacks such as `OnSpawn` |

> **Gap:** All C# systems run together in one gameplay step of the engine's frame. You can't schedule a C# system between engine systems, for example between physics steps.
