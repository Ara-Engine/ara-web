---
title: Properties and attributes
description: Describe your fields with units, ranges, defaults, replication and inspector hints, and see how each attribute shows up in the schema.
section: Scripting
order: 5
---

Attributes on your fields tell the engine what a value means: its unit, its valid range, its default, who receives it over the network and how the inspector shows it. The source generator copies them into the schema, so the inspector, `ara schema`, document validation and agents all see the same facts.

They work on component, resource and cue fields, and on behaviour `[Property]` properties. `[Unit]`, `[Range]`, `[Min]` and `[Max]` also work on command parameters.

## Example

```csharp
namespace MyGame;

/// <summary>Tuning and state of a turret.</summary>
[Component]
public partial struct Turret
{
    /// <summary>How far the turret can see.</summary>
    [Header("Targeting"), Unit(Units.Meters), Range(0, 200), Default(40)] public float ViewDistance;

    /// <summary>Turn rate.</summary>
    [Unit(Units.DegreesPerSecond), Min(0), Default(90)] public float TurnSpeed;

    /// <summary>Shots per second.</summary>
    [Header("Firing"), Unit(Units.Hertz), Max(20), Default(2)] public float FireRate;

    /// <summary>Current aim, sent to clients with rotation smoothing.</summary>
    [Unit(Units.Degrees), Replicate(Quantize = 0.1, Interpolate = Interpolate.Slerp)] public Vector3 Aim;

    /// <summary>Rounds left; only the owner sees it.</summary>
    [FormerlySerializedAs("Shells"), Replicate(Audience.Owner)] public int Ammo;

    [Tooltip("Muzzle offset from the turret's origin.")]
    [Unit(Units.Meters), Default(0, 1.2, 0.5)] public Vector3 Muzzle;
}
```

## Attribute reference

| Attribute | What it records |
|---|---|
| [`[Unit("m")]`](/docs/scripting/UnitAttribute) | The physical unit, by schema symbol. Use the [`Units`](/docs/scripting/Units) constants. |
| [`[Range(min, max)]`](/docs/scripting/RangeAttribute) | Inclusive bounds, as in Unity. |
| [`[Min(min)]`](/docs/scripting/MinAttribute), [`[Max(max)]`](/docs/scripting/MaxAttribute) | One inclusive bound. |
| [`[Default(...)]`](/docs/scripting/DefaultAttribute) | The schema default: a number, `bool` or string, or a vector's components. |
| [`[Replicate]`](/docs/scripting/ReplicateAttribute) | Network replication of the field. |
| [`[Tooltip("...")]`](/docs/scripting/TooltipAttribute) | Inspector tooltip. Used as the field's documentation when it has no `/// <summary>`. |
| [`[Header("...")]`](/docs/scripting/HeaderAttribute) | An inspector group heading for this field and the ones after it. |
| [`[FormerlySerializedAs("Old")]`](/docs/scripting/FormerlySerializedAsAttribute) | A previous name. Files that use it are renamed on read, as in Unity. Repeatable. |
| `[Obsolete("...")]` | Marks the field deprecated in the schema, with your message. |

## Documentation

Every reflected field needs documentation ([ARA0703](/docs/reference/errors/ARA0703)). Write a `/// <summary>`, or use `[Tooltip]` as the `Muzzle` field does. The text is what a designer sees on hover and what an agent reads when it decides how to set the value, so say what the field means and how it's used, not just its name.

## Units

Give every number with a physical meaning a unit. The engine's conventions are metres, seconds, kilograms and degrees; see the [Transform](/docs/reference/types/Transform) component for an example.

| Constant | Symbol | Constant | Symbol |
|---|---|---|---|
| `Units.Meters` | `m` | `Units.Newtons` | `N` |
| `Units.Centimeters` | `cm` | `Units.NewtonMeters` | `N*m` |
| `Units.Kilometers` | `km` | `Units.Hertz` | `Hz` |
| `Units.Degrees` | `deg` | `Units.Pixels` | `px` |
| `Units.Radians` | `rad` | `Units.Percent` | `%` |
| `Units.Seconds` | `s` | `Units.Kelvin` | `K` |
| `Units.Milliseconds` | `ms` | `Units.Lumens` | `lm` |
| `Units.Kilograms` | `kg` | `Units.Lux` | `lx` |
| `Units.MetersPerSecond` | `m/s` | `Units.Candela` | `cd` |
| `Units.MetersPerSecondSquared` | `m/s2` | `Units.Decibels` | `dB` |
| `Units.DegreesPerSecond` | `deg/s` | | |
| `Units.RadiansPerSecond` | `rad/s` | | |

## Ranges

`[Range]`, `[Min]` and `[Max]` are checked when values come from outside your code, and the engine never clamps them. A document value outside the range fails validation ([ARA1103](/docs/reference/errors/ARA1103)). A command parameter outside it refuses the call ([ARA0951](/docs/reference/errors/ARA0951)).

Your own C# code isn't checked. Assigning `Ammo = -1` in a script stores `-1`, so clamp values yourself where it matters.

## Defaults

`[Default]` takes a number, a `bool`, a string, or the components of a vector: `[Default(0, 1.2, 0.5)]`. It applies when a document leaves the field out, when `component.add` gets no value, and when the engine creates a resource. `new Turret()` in C# is still all zeros. See [Components and resources](/docs/manual/components-and-resources#defaults).

## Replication

[`[Replicate]`](/docs/scripting/ReplicateAttribute) declares how a field is sent to clients. The engine owns the codecs and the interpolation; the attribute only states the policy.

| Option | Meaning |
|---|---|
| `Audience` (constructor argument) | `Relevant` (the default): every client the entity is relevant to. `Owner`: only the owning client. `None`: not replicated. |
| `Quantize` | Wire precision in the field's unit; `0` (the default) sends full precision. |
| `Interpolate` | How remote views smooth the value between snapshots: `None`, `Linear`, or `Slerp` for rotations. |
| `Rollback` | `true` makes the field part of the rollback state used for prediction. |

The engine's `Transform` replicates its position with `Quantize = 0.001`, linear interpolation and rollback, and its rotation with `Quantize = 0.01` and `Slerp`.

## Renaming fields

To rename a field without breaking saved scenes, keep the old name in `[FormerlySerializedAs]`:

```text
[FormerlySerializedAs("Shells")] public int Ammo;
```

Documents written with `shells` load as `ammo`. A running Play session doesn't use the alias: when a hot reload renames a field, that field starts from its default in the running game. See [Hot reload](/docs/manual/hot-reload#what-survives-a-reload).
