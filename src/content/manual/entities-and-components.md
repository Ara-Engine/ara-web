---
title: Entities and components
description: How scenes are built from entities in a hierarchy with plain data components, how to edit them with commands, and how prefab instances and overrides work.
section: Concepts
order: 3
---

A scene is a set of **entities**. Each entity has a name, an optional parent, and any number of **components**: plain data such as a [Transform](/docs/reference/types/Transform), a [Light](/docs/reference/types/Light) or a [RigidBody](/docs/reference/types/RigidBody). Behaviour comes from systems and C# scripts that read and write those components; see the [Scripting overview](/docs/manual/scripting-overview).

## An entity record

In a scene file, each entity is one record keyed by its ID:

```json
"e_4chy": {
  "name": "CrateLight",
  "parent": "e_8d41",
  "order": "a0",
  "Light": {
    "intensity": 400
  },
  "Transform": {
    "position": [0, 2, 0]
  }
}
```

| Field | Meaning |
|---|---|
| `name` | Display name in the hierarchy. Names don't have to be unique. |
| `parent` | The parent entity; absent for a root. |
| `order` | A sort key that places the entity among its siblings. The engine manages it. |
| `prefab`, `overrides`, `removed` | Only on prefab instances; see below. |
| Components | Stored inline under their type names, with default values omitted. |

The full record type is [Entity](/docs/reference/types/Entity).

## Components

Components are plain data with typed, documented fields. Each field has a default and, where it applies, a unit. To see a component's fields:

```powershell
ara schema Light
```

```text
| Field | Type | Default | Unit | Description |
|---|---|---|---|---|
| `kind` | `LightKind` | `"point"` |  | Point, spot or directional. |
| `color` | `color` | `[1,1,1,1]` |  | Linear RGB tint (alpha is ignored). |
| `intensity` | `f32` | `800` |  | Luminous flux in lumens (point/spot) or illuminance in lux (directional). |
| `range` | `f32` | `10` | m | Influence radius of point and spot lights. |
| `innerAngle` | `f32` | `20` | deg | Spot inner cone half-angle. |
| `outerAngle` | `f32` | `30` | deg | Spot outer cone half-angle. |
```

`ara schema` with no arguments lists every component in your engine version. In 0.0.1-alpha they include:

| Area | Components |
|---|---|
| Core and rendering | [Transform](/docs/reference/types/Transform), [MeshRenderer](/docs/reference/types/MeshRenderer), [Camera](/docs/reference/types/Camera), [Light](/docs/reference/types/Light), [Environment](/docs/reference/types/Environment), [SkyAtmosphere](/docs/reference/types/SkyAtmosphere), [HeightFog](/docs/reference/types/HeightFog), [PostProcessVolume](/docs/reference/types/PostProcessVolume) |
| Physics | [RigidBody](/docs/reference/types/RigidBody), [Collider](/docs/reference/types/Collider), [Joint](/docs/reference/types/Joint), [CharacterController](/docs/reference/types/CharacterController), [Vehicle](/docs/reference/types/Vehicle) |
| Audio | [AudioSource](/docs/reference/types/AudioSource), [AudioListener](/docs/reference/types/AudioListener), [MusicSource](/docs/reference/types/MusicSource), [ReverbZone](/docs/reference/types/ReverbZone) |
| Navigation and AI | [NavAgent](/docs/reference/types/NavAgent), [NavMeshSurface](/docs/reference/types/NavMeshSurface), [Brain](/docs/reference/types/Brain), [Perceiver](/docs/reference/types/Perceiver) |
| Animation and VFX | [Animator](/docs/reference/types/Animator), [VisualEffect](/docs/reference/types/VisualEffect) |
| Terrain and worlds | [Terrain](/docs/reference/types/Terrain), [StreamedWorld](/docs/reference/types/StreamedWorld) |
| 2D | [Sprite](/docs/reference/types/Sprite), [Tilemap](/docs/reference/types/Tilemap), [Camera2d](/docs/reference/types/Camera2d), [RigidBody2d](/docs/reference/types/RigidBody2d), [Collider2d](/docs/reference/types/Collider2d) |

The [type reference](/docs/reference/types/Transform) documents all of them.

## Hierarchy

An entity's [Transform](/docs/reference/types/Transform) is relative to its parent: position in meters, rotation as XYZ Euler angles in degrees, and scale. Moving a parent moves its children.

## Editing entities

Use commands to create, change and delete entities. Each one is a transaction you can undo.

| Command | Does |
|---|---|
| [entity.create](/docs/reference/commands/entity.create) | Create an entity, optionally with a parent, a position among its siblings and components. |
| [entity.delete](/docs/reference/commands/entity.delete) | Delete entities and everything below them. |
| [entity.reparent](/docs/reference/commands/entity.reparent) | Move an entity under a new parent, or to the root. |
| [component.add](/docs/reference/commands/component.add) | Add a component, with optional initial values. |
| [component.remove](/docs/reference/commands/component.remove) | Remove a component. |
| [property.set](/docs/reference/commands/property.set) | Set the name or one component field. |
| [transform.set](/docs/reference/commands/transform.set) | Set position, rotation or scale on several entities at once. |
| [transform.lookAt](/docs/reference/commands/transform.lookAt) | Aim an entity's local −Z axis at a point or another entity. |

`property.set` takes a field path: `name`, a component field such as `Light.intensity`, or a part of one, such as `Transform.position.y`:

```powershell
ara do property.set -p entity=name:CrateLight -p path=Light.intensity -p value=500 --why "Dimmer crate light"
ara do component.add --args '{entity: "name:Crate", component: RigidBody}' --why "Let the crate fall"
ara do entity.reparent --args '{entity: "name:CrateLight", parent: "name:Camera"}' --why "Carry the light with the camera"
```

Values use the field's schema type and unit. A wrong type fails before anything is applied:

```text
error[ARA1102]: expected a number (`f32`), got a string
  --> call #0 · Light.intensity
```

## Naming entities in commands

Wherever a command takes an entity, you can give:

- an ID: `e_8d41`;
- an address inside a prefab instance: `e_4f9a/e_m4tz`;
- a batch symbol minted earlier in the same batch: `$crate` (see [Commands and transactions](/docs/manual/commands-and-transactions));
- a name: `name:Crate`, or `name:Floor/Crate` to pick the `Crate` under `Floor`.

If a name matches several entities, the command fails and offers one fix per match:

```text
error[ARA1609]: `name:Crate` matches 2 entities; use one of their IDs, or name a parent too (`name:Parent/Child`)
  --> call #0 · commands[0].args.target
  = fix: Use `e_qg8h` (Crate)
  = fix: Use `e_tfc6` (Crate)
```

If the entities you name exist in more than one document, pass `--doc` to choose ([ARA1814](/docs/reference/errors/ARA1814)). `--doc` accepts a path, an ID or just a unique file name such as `main`.

## Prefabs

A prefab is a reusable entity subtree with exactly one root, saved as its own `.prefab` document. Placing it in a scene creates an **instance**: a record that links to the prefab and stores only what differs.

```powershell
ara do prefab.instantiate --args '{prefab: "prefabs/crate.prefab", position: [0, 0, 4]}' --why "Place a crate"
```

```json
"e_p66p": {
  "order": "a2",
  "prefab": "@prefabs/crate.prefab#pf_crate001",
  "overrides": {
    "Transform.position": [0, 0, 4]
  }
}
```

An instance never stores components inline. It carries:

- `prefab`: the [reference](/docs/manual/documents-and-ids) to the prefab;
- `overrides`: changed values, keyed by `[<id path>/]<field path>`. Only names and components can be overridden;
- `removed`: prefab entities or components this instance drops.

You don't write overrides yourself. Edit the instance, or an entity inside it, with the normal commands, and the engine records the change as an override:

```powershell
ara do property.set -p entity=e_p66p -p path=MeshRenderer.color -p value=[0.8,0.2,0.2,1] --why "Paint this crate red"
```

```json
"overrides": {
  "MeshRenderer.color": [0.8, 0.2, 0.2, 1],
  "Transform.position": [0, 0, 4]
}
```

Deleting an entity inside an instance adds it to `removed`, and `component.remove` on a prefab entity removes the component from this instance only. To undo overrides, use [prefab.override.revert](/docs/reference/commands/prefab.override.revert), which reverts one path or everything on the entity. [prefab.override.set](/docs/reference/commands/prefab.override.set) sets an override explicitly.

Changes you make to the prefab document itself reach every instance, except where an instance overrides that value.

## Seeing effective values

`ara inspect` shows an entity with prefab overrides applied and defaults filled in:

```powershell
ara inspect e_p66p
```

```text
e_p66p Crate prefab:crate [MeshRenderer] pos(0,0,4) · defined in pf_crate001#e_g1tm
  MeshRenderer: shape=box size=(1,1,1)m model=null node=null primitive=null materialOverrides=() color=(0.8,0.2,0.2,1) roughness=0.6 metallic=0 emissive=(0,0,0) emissiveEnabled=true emissiveStrength=1 emissiveFactor=null emissiveMaterials=()
  Transform: position=(0,0,4)m rotation=(0,0,0)deg scale=(1,1,1)
```

Agents get the same view from the `ara_inspect` MCP tool.
