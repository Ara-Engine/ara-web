---
title: Components and resources
description: Declare your own ECS data in C# with [Component], [Resource] and [Cue] structs, which field types they support, and how they appear in the schema.
section: Scripting
order: 4
---

Components hold per-entity data, resources hold one value per world, and cues describe presentation events. You declare all three as C# structs. The source generator registers each one in the engine's Schema DB, so it shows up in the editor's inspector, in `ara schema`, in scene documents and in the tools agents use, exactly like an engine type.

For how entities and components work in general, see [Entities and components](/docs/manual/entities-and-components).

## Declare a component

Mark a `partial struct` with [`[Component]`](/docs/scripting/ComponentAttribute):

```csharp
namespace MyGame;

/// <summary>Linear velocity of a scripted body (physics bodies use the engine's Velocity).</summary>
[Component]
public partial struct Drift
{
    /// <summary>Metres per second.</summary>
    [Unit(Units.MetersPerSecond)] public Vector3 Linear;
}

/// <summary>Hit points that drain while the entity takes damage.</summary>
[Component]
public partial struct Health
{
    /// <summary>Current hit points.</summary>
    [Range(0, 100), Default(100)] public float Hp;
}
```

A component struct must:

- be `partial` ([ARA0701](/docs/reference/errors/ARA0701));
- contain only the field types below, so the engine can store it in place ([ARA0704](/docs/reference/errors/ARA0704));
- have a `/// <summary>` on the type and on every field ([ARA0703](/docs/reference/errors/ARA0703)). The text becomes the inspector tooltip and the schema documentation that agents read.

In documents and tools, field names are camelCase: `Linear` is `linear`, `Hp` is `hp`.

## Field types

| C# type | Schema type |
|---|---|
| `bool` | `bool` |
| `byte`, `ushort` | `u8`, `u16` |
| `int`, `uint`, `long`, `ulong` | `i32`, `u32`, `i64`, `u64` |
| `float`, `double` | `f32`, `f64` |
| `Vector2`, `Vector3`, `Vector4` | `vec2`, `vec3`, `vec4` |
| `Quaternion` | `quat` |
| `Color` | `color` (linear RGBA) |
| `Entity` | `entity` (a reference to another entity) |
| An enum with an `int` or `uint` base and values 0, 1, 2, ... in order | The enum, by name |
| A struct whose fields are all of these types | The struct, by name |

`sbyte`, `short`, `char`, `decimal`, `string`, arrays and classes aren't supported. Enums and nested structs are added to the schema too, so they need doc comments on the type and on each enum value or field:

```csharp
namespace MyGame;

/// <summary>How a guard is behaving.</summary>
public enum GuardMode
{
    /// <summary>Walking its route.</summary>
    Patrol,
    /// <summary>Chasing a target.</summary>
    Chase,
}

/// <summary>A guard's current mode and target.</summary>
[Component]
public partial struct Guard
{
    /// <summary>What the guard is doing.</summary>
    public GuardMode Mode;

    /// <summary>The entity being chased, or null.</summary>
    public Entity Target;
}
```

## Names

A component's schema name is the struct's name, or the name you pass: `[Component("Drift")]`. It must be PascalCase letters and digits, with no dots.

Schema names share one namespace with every engine type and every other module. A clash makes the module fail to register: [ARA1110](/docs/reference/errors/ARA1110) for a name the engine already uses, [ARA0933](/docs/reference/errors/ARA0933) for a component another module declares. For example, don't name a component `Velocity`: the engine's physics module already has a [`Velocity`](/docs/reference/types/Velocity) component. Check a name with `ara schema <Name>` before you use it.

## Tags

A component with no fields is a tag. It marks entities without storing data:

```csharp
namespace MyGame;

/// <summary>Marks an entity the player can pick up.</summary>
[Component]
public partial struct Pickup { }
```

Systems filter on tags with `[With<Pickup>]` or `[Without<Pickup>]`; they can't take a tag as a parameter. See [Systems and queries](/docs/manual/systems-and-queries).

## Defaults

[`[Default]`](/docs/scripting/DefaultAttribute) sets a field's schema default. The engine uses it when a document leaves the field out, when `component.add` gets no value, and when it creates a resource.

C# itself doesn't use it: `new Health()` in your code has `Hp = 0`, not 100. When you add a component from code, set every field you care about. That includes `Transform.Scale`, which must be `Vector3.One` for an unscaled entity.

## Resources

A resource is a world singleton, such as game rules or round state. Mark a `partial struct` with [`[Resource]`](/docs/scripting/ResourceAttribute):

```csharp
namespace MyGame;

/// <summary>Round settings and score.</summary>
[Resource]
public partial struct Round
{
    /// <summary>Seconds per round.</summary>
    [Unit(Units.Seconds), Default(120)] public float Length;

    /// <summary>Points scored so far.</summary>
    public int Score;
}
```

The engine creates each resource with its `[Default]` values when the module loads. Resources follow the same field rules as components and are included in snapshots.

- Systems take a resource as a parameter: `in Round` to read it, `ref Round` to write it.
- Behaviours and commands use `World.Resource<Round>()`, which returns a `ref`.

## Cues

A cue is a presentation event, such as a sound or a visual effect trigger. It never changes simulation state. Mark a `partial struct` with [`[Cue]`](/docs/scripting/CueAttribute):

```csharp
namespace MyGame;

/// <summary>Played when a pickup is collected.</summary>
[Cue]
public partial struct PickedUp
{
    /// <summary>The entity that collected it.</summary>
    public Entity By;
}
```

Emit a cue with `Commands.Cue(new PickedUp { By = Entity })` from a behaviour or system, or `ctx.Cue(...)` from a command. A command's cues are kept only if the command succeeds, and they are listed in the command's result.

## Engine components

The engine's own components are generated into the `Ara` namespace. Use them like your own: `Get<Transform>()`, `in Transform` in a system, `Commands.Add(entity, new Transform { ... })`.

| Field of [`Transform`](/docs/reference/types/Transform) | Type | Meaning |
|---|---|---|
| `Position` | `Vector3`, metres | Position relative to the parent. |
| `Rotation` | `Vector3`, degrees | Rotation relative to the parent, as XYZ Euler angles. |
| `Scale` | `Vector3` | Scale relative to the parent; `(1, 1, 1)` is unscaled. |

> **Gap:** `Transform` is the only engine component scripts can use today (`EngineComponents.Names` lists the bound ones). Lights, renderers, physics bodies, audio sources and the rest exist in scenes but have no C# type yet, so `Get<Light>()` doesn't compile.
