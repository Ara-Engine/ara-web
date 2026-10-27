---
title: World and entities
description: Refer to entities with Entity handles, read and write any entity's components through World, and spawn, despawn, add and remove with Commands.
section: Scripting
order: 6
---

Behaviours and systems mostly work on their own entity's components. This page covers everything else: holding references to other entities, reading and writing their components through `World`, and making structural changes with `Commands`.

## Entity handles

An [`Entity`](/docs/scripting/Entity) is a small value that identifies one entity in the running world. It is generation-checked: once an entity is despawned, its handle never becomes valid again, even if the engine reuses the slot. A stale handle reads as missing instead of pointing at a different entity.

| Member | Use |
|---|---|
| `Entity.Null` | The null handle. `default(Entity)` is the same value. |
| `IsNull` | True for the null handle. |
| `IsAlive` | True if the entity exists right now. Behaviours and commands only. |
| `Equals(other)` | Compares two handles. `Entity` has no `==` operator. |
| `ToString()` | The engine's text form, such as `12v1` (index, then generation). |

To remember another entity, store its handle in a component field or a behaviour `[Property]`. Both support the `Entity` type, so the reference is saved, replicated and kept across hot reloads.

## Reading and writing any entity

[`World`](/docs/scripting/World) gives random access to every entity's components and to resources:

| Method | Returns |
|---|---|
| `World.Get<T>(entity)` | A `ref` to the component, for reading and writing. Throws `MissingComponentException` if the entity doesn't have it. |
| `World.Read<T>(entity)` | A `ref readonly` to the component. Throws if it is missing. |
| `World.Has<T>(entity)` | True if the entity exists and has the component. |
| `World.Resource<T>()` | A `ref` to a resource. Throws if the resource isn't registered. |

Check with `Has` before you `Get` or `Read` a component that might be missing. An uncaught exception disables the behaviour type or command until the next reload. References are valid only until the current callback returns, so never keep one.

This behaviour follows another entity:

```csharp
namespace MyGame;

/// <summary>Follows another entity at a fixed offset.</summary>
public sealed partial class Follow : Behaviour
{
    /// <summary>The entity to follow.</summary>
    [Property] public partial Entity Target { get; set; }

    /// <summary>Offset from the target.</summary>
    [Property, Unit(Units.Meters)] public partial Vector3 Offset { get; set; }

    /// <inheritdoc/>
    protected override void OnTick(in Tick tick)
    {
        if (Target.IsNull || !World.Has<Transform>(Target)) return;
        ref readonly var target = ref World.Read<Transform>(Target);
        Get<Transform>().Position = target.Position + Offset;
    }
}
```

> **Note:** `World` works only in behaviours and commands, which run with exclusive access to the world. A system that calls it throws an `InvalidOperationException` and is disabled ([ARA0910](/docs/reference/errors/ARA0910)). Systems declare the components they use as parameters instead, so the scheduler can run them in parallel.

## Structural changes

Spawning, despawning and adding or removing components change which components an entity has. Those changes go through [`Commands`](/docs/scripting/Commands), a buffer the engine applies at the next sync point, in a deterministic order:

| Method | Effect |
|---|---|
| `Spawn()` | Reserves a new entity and returns its handle. You can use the handle in later calls straight away; the entity exists from the sync point on. |
| `Despawn(entity)` | Despawns the entity. |
| `Add(entity, value)` | Adds the component, or replaces it if the entity already has one. |
| `Remove<T>(entity)` | Removes the component. |
| `Cue(value)` | Emits a presentation cue. Cues never change simulation state. |

Where you get a `Commands` and when its changes apply:

| In | Get it from | Applied |
|---|---|---|
| A behaviour | The `Commands` property | After the behaviour phase of the tick |
| A system | A `ref Commands` parameter | At a sync point after the system runs |
| A command | `ctx.Commands` | When the command finishes, and only if it succeeds |

Writes through `Get<T>()` or `ref` parameters change values immediately. Only structural changes wait for the sync point.

This command spawns a falling crate. Set every field you need: `new Transform()` has a zero scale.

```csharp
namespace MyGame;

/// <summary>Spawns a drifting crate above an entity.</summary>
[Command("game.SpawnCrate")]
public static partial class SpawnCrate
{
    /// <summary>Spawns the crate four metres above <paramref name="above"/>.</summary>
    /// <param name="ctx">The command context.</param>
    /// <param name="above">The entity to spawn it over.</param>
    /// <param name="at">That entity's transform.</param>
    public static CommandResult Execute(ref CommandContext ctx, Entity above, in Transform at)
    {
        var commands = ctx.Commands;
        var crate = commands.Spawn();
        commands.Add(crate, new Transform { Position = at.Position + new Vector3(0f, 4f, 0f), Scale = Vector3.One });
        commands.Add(crate, new Drift { Linear = new Vector3(0f, -1f, 0f) });
        commands.Add(crate, new Pickup());
        return CommandResult.Ok;
    }
}
```

This command combines the pieces: it checks two entities, updates a resource, emits a cue and despawns the pickup.

```csharp
namespace MyGame;

/// <summary>Collects a pickup that is within reach: one point, and the pickup disappears.</summary>
[Command("game.Collect")]
public static partial class Collect
{
    /// <summary>Lets <paramref name="collector"/> collect <paramref name="pickup"/>.</summary>
    /// <param name="ctx">The command context.</param>
    /// <param name="collector">The entity collecting.</param>
    /// <param name="pickup">The pickup to collect.</param>
    public static CommandResult Execute(ref CommandContext ctx, Entity collector, Entity pickup)
    {
        if (!pickup.IsAlive || !World.Has<Pickup>(pickup)) return ctx.Reject("not_a_pickup");
        if (!World.Has<Transform>(collector) || !World.Has<Transform>(pickup)) return ctx.Reject("no_transform");
        var distance = Vector3.Distance(World.Read<Transform>(collector).Position, World.Read<Transform>(pickup).Position);
        if (distance > 2f) return ctx.Reject("too_far");
        World.Resource<Round>().Score += 1;
        ctx.Cue(new PickedUp { By = collector });
        ctx.Commands.Despawn(pickup);
        return CommandResult.Ok;
    }
}
```

## Entities your scripts spawn

Entities spawned from C# get stable IDs right after they appear, so replays and snapshots name them the same way every time. Spawns from systems and behaviours are named `e_cs<tick>x<n>`; spawns from commands are named `e_cs<tick>c<n>`, after the tick that records the command. You can use these IDs in tools such as `ara_play`.

> **Gap:** C# has no API to find entities by name, to list them, or to read and change the hierarchy (parents and children). To work with many entities, write a system; to work with a specific one, store its `Entity` handle in a component or property, or pass it to a command.
