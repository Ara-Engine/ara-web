---
title: Behaviours
description: Write per-entity scripts by deriving from Behaviour, store their state in [Property] properties, and attach them to entities.
section: Scripting
order: 2
---

A behaviour is a C# class that runs code for each entity it is attached to. It is the closest thing in Ara to a Unity `MonoBehaviour`: you override callbacks such as `OnTick` and read and write the entity's components.

Unlike a `MonoBehaviour`, a behaviour object holds no game state. Its state lives in `[Property]` properties that the engine stores in an ECS component, so saves, replays, networking and hot reload all see it. The object itself can be thrown away and recreated at any time.

## A first behaviour

This door swings open around its Y axis when `IsOpen` is set. It is adapted from the engine's Outpost sample.

```csharp
namespace MyGame;

/// <summary>A door that swings open around its Y axis when <see cref="IsOpen"/> is set.</summary>
public sealed partial class Door : Behaviour
{
    /// <summary>How far the door opens.</summary>
    [Property, Unit(Units.Degrees), Range(0, 180)] public partial float OpenAngle { get; set; }

    /// <summary>Whether the door should be open.</summary>
    [Property, Replicate] public partial bool IsOpen { get; set; }

    /// <summary>Swing speed, read from tuning once (a presentation cache, not state).</summary>
    [Transient] float _degreesPerSecond;

    /// <inheritdoc/>
    protected override void OnSpawn() => _degreesPerSecond = 90f;

    /// <inheritdoc/>
    protected override void OnReload() => _degreesPerSecond = 90f;

    /// <inheritdoc/>
    protected override void OnTick(in Tick t)
    {
        ref var tr = ref Get<Transform>();
        var target = IsOpen ? OpenAngle : 0f;
        var step = _degreesPerSecond * t.Dt;
        tr.Rotation.Y = MathF.Abs(target - tr.Rotation.Y) <= step ? target : tr.Rotation.Y + MathF.Sign(target - tr.Rotation.Y) * step;
    }
}
```

A behaviour class must:

- derive from [`Behaviour`](/docs/scripting/Behaviour) and be `partial` ([ARA0701](/docs/reference/errors/ARA0701)). The examples also mark it `sealed`;
- have a public parameterless constructor, which the implicit one is ([ARA0706](/docs/reference/errors/ARA0706));
- have a `/// <summary>` doc comment, as must every `[Property]` ([ARA0703](/docs/reference/errors/ARA0703)). The text becomes the inspector tooltip, the schema documentation and the description agents see.

## Properties

Declare state as a `partial` property marked [`[Property]`](/docs/scripting/PropertyAttribute), with no body:

```text
[Property] public partial float OpenAngle { get; set; }
```

The source generator implements the property. It reads and writes a field of a component it generates for the behaviour, named after the class (`Door`) and holding one field per property. Because the value is ECS data, it is saved with the scene, replicated, and kept across hot reloads.

Property types follow the same rules as component fields: numbers, `bool`, vectors, `Quaternion`, `Color`, `Entity`, enums and structs of those. The metadata attributes (`[Unit]`, `[Range]`, `[Default]`, `[Replicate]` and the rest) work on properties too. See [Components and resources](/docs/manual/components-and-resources) and [Properties and attributes](/docs/manual/properties-and-attributes).

## Transient fields

Every other instance field must be marked [`[Transient]`](/docs/scripting/TransientAttribute), or the module doesn't compile ([ARA0101](/docs/reference/errors/ARA0101)). A transient field is a cache: it isn't saved or replicated, and it is lost whenever the object is recreated, for example by a hot reload. Fill it in `OnSpawn` and again in `OnReload`, as the door does with `_degreesPerSecond`.

If a value matters to the game, make it a `[Property]` instead.

## What a behaviour can use

| Member | Use |
|---|---|
| `Entity` | The entity this object belongs to. |
| `Get<T>()` | A `ref` to one of this entity's components. Write through it to change the value. Throws `MissingComponentException` if the entity lacks it. |
| `Has<T>()` | True if this entity has the component. |
| `Commands` | Structural changes: spawn, despawn, add and remove components, emit cues. They apply after the behaviour phase. |
| `Rng` | Deterministic random numbers, reseeded for every callback. |
| `OnSpawn`, `OnTick`, `OnFrame`, `OnReload` | Callbacks you override. See [Lifecycle and determinism](/docs/manual/lifecycle-and-determinism). |

Behaviours run with exclusive access to the world, so they can also use [`World`](/docs/scripting/World) to reach other entities and resources. See [World and entities](/docs/manual/world-and-entities).

This behaviour hurts its entity while it is attached, and removes itself when health reaches zero. It reads the `Health` component from [Components and resources](/docs/manual/components-and-resources):

```csharp
namespace MyGame;

/// <summary>Hurts its entity over time, if the entity has health.</summary>
public sealed partial class Burning : Behaviour
{
    /// <summary>Damage per second.</summary>
    [Property, Min(0), Default(5)] public partial float DamagePerSecond { get; set; }

    /// <inheritdoc/>
    protected override void OnTick(in Tick tick)
    {
        if (!Has<Health>()) return;
        ref var health = ref Get<Health>();
        health.Hp = MathF.Max(0f, health.Hp - DamagePerSecond * tick.Dt);
        if (health.Hp == 0f) Commands.Remove<Burning.Data>(Entity);
    }
}
```

## Attaching a behaviour

An entity runs a behaviour while it has the behaviour's component. Add it like any other component:

- in the editor, add the `Door` component to an entity;
- in a document or an agent batch, use `component.add` with `"component": "Door"` and camelCase field values such as `{"openAngle": 100, "isOpen": true}`;
- from C#, add the generated `Door.Data` struct with `Commands.Add`.

`Door.Data` is the generated component struct, with one public field per property. Use it to attach a behaviour from code, and `Commands.Remove<Door.Data>(entity)` to detach one:

```csharp
namespace MyGame;

/// <summary>Spawns an open door beside an entity.</summary>
[Command("game.SpawnDoor")]
public static partial class SpawnDoor
{
    /// <summary>Spawns an open door two metres from <paramref name="near"/>.</summary>
    /// <param name="ctx">The command context.</param>
    /// <param name="near">The entity to place it next to.</param>
    /// <param name="at">That entity's transform.</param>
    public static CommandResult Execute(ref CommandContext ctx, Entity near, in Transform at)
    {
        var door = ctx.Commands.Spawn();
        ctx.Commands.Add(door, new Transform { Position = at.Position + new Vector3(2f, 0f, 0f), Scale = Vector3.One });
        ctx.Commands.Add(door, new Door.Data { OpenAngle = 90f, IsOpen = true });
        return CommandResult.Ok;
    }
}
```

You can read another entity's behaviour state with `World.Get<Door.Data>(entity)`. Systems can't take `Door.Data` as a parameter ([ARA0702](/docs/reference/errors/ARA0702)); see [Systems and queries](/docs/manual/systems-and-queries).

## Coming from Unity

Ara keeps Unity's concepts but renames what behaves differently. The analyzer reports most of these Unity habits as [ARA0001](/docs/reference/errors/ARA0001) and names the Ara equivalent:

| Unity | Ara |
|---|---|
| `using UnityEngine;` | Not needed: the API is in the `Ara` namespace, which every module imports. |
| `class Door : MonoBehaviour` | `sealed partial class Door : Behaviour` |
| `Update()`, `FixedUpdate()` | `override OnTick(in Tick tick)` |
| `LateUpdate()` | `override OnFrame(in Frame frame)` |
| `Start()`, `Awake()` | `override OnSpawn()` |
| `GetComponent<T>()` | `Get<T>()`, which returns a `ref`; there is no null |
| `Time.deltaTime` | `tick.Dt`, the fixed step |
| `Debug.Log`, `LogWarning`, `LogError` | `Log.Info`, `Log.Warn`, `Log.Error` |
| `position.x` | `Position.X`: `System.Numerics` vector fields are uppercase |
| `[SerializeField] float speed;` | `[Property] public partial float Speed { get; set; }` |

`[Range]` and `[FormerlySerializedAs]` keep their Unity meaning.

Every engine component has a C# type, so `Get<Light>()`, `Get<RigidBody>()` and the rest work like `Get<Transform>()`. See [Components and resources](/docs/manual/components-and-resources#engine-components).
