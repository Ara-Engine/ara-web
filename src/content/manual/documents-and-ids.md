---
title: Documents and IDs
description: How Ara stores authored content as canonical JSON documents, how records, IDs and @path#id references work, and the engine's axis and unit conventions.
section: Concepts
order: 2
---

Everything you author in Ara is a **document**: a text file made of **records**, each with a short, stable ID. Documents point at each other with `@path#id` references. This page explains the format so you can read a diff, review an agent's change or fix a file by hand.

## A scene file

Here is a small scene after a few edits:

```json
{
  "$schema": "ara://schema/scene/1",
  "id": "sc_akzn9ftc",
  "records": {
    "e_3fze": {
      "name": "Camera",
      "order": "a1",
      "Camera": {},
      "Transform": {
        "position": [0, 2, 8],
        "rotation": [-21.80141, -20.374525, -7.928141]
      }
    },
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
    },
    "e_8d41": {
      "name": "Crate",
      "order": "a0",
      "MeshRenderer": {},
      "Transform": {
        "position": [2, 0, 3]
      }
    },
    "e_p66p": {
      "order": "a2",
      "prefab": "@prefabs/crate.prefab#pf_crate001",
      "overrides": {
        "Transform.position": [0, 0, 4]
      }
    }
  }
}
```

- `$schema` names the document kind and its format version.
- `id` is the document's own ID. Other files reference the document by it.
- `records` is a **flat** map. The hierarchy is in each record's `parent` field, not in nesting, so moving an entity changes one line.
- **Defaults are omitted.** `"Camera": {}` means a camera with every default; `Light` stores only `intensity` because the other fields are default.
- Inside a record, built-in fields (lowercase, such as `name`, `parent`, `order`) come first, then components (PascalCase) sorted by name.

The format is **canonical**: the same content always produces the same bytes. The engine writes files through one formatter, so diffs show only what changed. Never reorder keys by hand; `ara fmt` owns the layout.

## Document kinds

The kind decides the file extension, the records the document may contain and the prefix of its ID:

| Kind | Extension | ID prefix | Holds |
|---|---|---|---|
| `scene` | `.scene` | `sc` | A level or sub-level: a flat map of entities. |
| `prefab` | `.prefab` | `pf` | A reusable entity subtree with exactly one root. |
| `project` | `ara.project.json` | `pj` | Project startup and plugin settings. |
| `imports` | `.imports` | `ip` | Project texture import defaults. |
| `import` | `.import.json` | `as` | A source asset's identity and importer settings. |
| `graph` | `.graph` | `gr` | A typed graph, such as a material. |
| `materialinstance` | `.materialinstance` | `mi` | A material reference with parameter overrides. |
| `animation` | `.animation` | `ac` | Skeletons, clips and controller graphs. |
| `terrain` | `.terrain` | `tr` | A streamable layered heightfield. |
| `foliage` | `.foliage` | `fo` | Scatter rules and painted foliage. |
| `world` | `.world` | `wd` | A partitioned world manifest. |
| `mixer` | `.mixer` | `mx` | The audio mixer. |
| `music` | `.music` | `mu` | Interactive music. |
| `l10n` | `.l10n` | `lc` | One locale's messages. |
| `ui` | `.ui` | `ui` | Native UI markup, stored as lossless XML. |

`ara schema` lists the kinds in your engine version. Create a new, empty document of any kind with [doc.create](/docs/reference/commands/doc.create); it infers the kind from the extension:

```powershell
ara do doc.create --args '{path: "prefabs/crate.prefab", id: pf_crate001}' --why "Create a crate prefab"
```

## Records and IDs

IDs have the form `<prefix>_<base32>`. The prefix says what the ID names:

- **Records** inside a document: entities are `e_…`, such as `e_8d41`. A record ID is unique within its document; to name it from outside, qualify it with the document's ID, as in `sc_akzn9ftc/e_8d41`.
- **Documents**: `sc_…`, `pf_…` and the other prefixes above, unique across the project.
- **Transactions** `tx_…`, **checkpoints** `cp_…` and **sessions** `ses_…` belong to history, not to files. See [Review and undo](/docs/manual/review-and-undo).

The engine mints IDs when you create things. You can choose your own, such as `pf_crate001` above, when a stable, readable ID helps. IDs never change when you rename or move something.

An entity inside a prefab instance is addressed through the instance: `e_4f9a/e_m4tz` is the entity `e_m4tz` from the prefab, inside the instance `e_4f9a`. See [Entities and components](/docs/manual/entities-and-components).

In commands you can also name entities instead of using IDs: `name:Crate`, or `name:Floor/Crate` when several entities share a name.

## References: `@path#id`

A reference names an asset by both its path and its ID:

```text
@prefabs/crate.prefab#pf_crate001
```

Having both halves means either one can repair the other. If someone moves `crate.prefab`, the ID still finds it; if an ID is mistyped but the path is right, the path finds it. When the halves disagree, the ID wins. `ara check` reports a stale half as a warning with a fix:

```text
warning[ARA1303]: stale path `props/crate.prefab` in `@props/crate.prefab#pf_crate001`; `pf_crate001` now lives at `prefabs/crate.prefab`
  --> levels/main.scene · e_p66p · prefab
  = fix: Write `@prefabs/crate.prefab#pf_crate001`

checked 4 files: 0 errors, 1 warnings
hint: 1 of these have one machine-applicable fix; `ara check --fix` applies them
```

```powershell
ara check --fix
```

```text
fixed levels/main.scene: Write `@prefabs/crate.prefab#pf_crate001`
checked 4 files: 0 errors, 0 warnings
```

`ara check --fix` applies only fixes that are unambiguous: a diagnostic with exactly one fix. When neither half resolves, you get [ARA1302](/docs/reference/errors/ARA1302) and must choose the target yourself.

In command arguments you can shorten references. `prefabs/crate.prefab`, `@prefabs/crate.prefab` and a bare `pf_crate001` all work, and the engine writes the full form to the file.

Imported media such as glTF models or audio are referenced by their source file, for example `@models/crate.glb#as_crate`. The asset's ID and import settings live in a sidecar `.import.json` next to the source. See [import.initialize](/docs/reference/commands/import.initialize).

## Formatting

```powershell
ara fmt levels/main.scene          # rewrite in canonical form, repairing references
ara fmt --check levels/main.scene  # only report files that would change
```

`ara fmt` won't rewrite a file that has errors. It prints them and skips the file, so fix the errors (or run `ara check --fix`) first.

## Conventions

Every document and command uses the same conventions:

- **Axes:** Y is up, and the coordinate system is right-handed. [Cameras](/docs/reference/types/Camera) look along their entity's local −Z axis, and so do spot and directional [lights](/docs/reference/types/LightKind).
- **Units:** lengths in meters, time in seconds, mass in kilograms, angles in **degrees**. [Transform](/docs/reference/types/Transform)`.rotation` is XYZ Euler angles in degrees.
- **Colors** are linear RGB(A).
- **Each field's unit is in its schema.** `ara schema Light` shows a Unit column, and the generated JSON Schemas carry it as `x-unit`.

```powershell
ara schema Transform
```

```text
| Field | Type | Default | Unit | Description |
|---|---|---|---|---|
| `position` | `vec3` | `[0,0,0]` | m | Position relative to the parent. |
| `rotation` | `vec3` | `[0,0,0]` | deg | Rotation relative to the parent, as XYZ Euler angles. |
| `scale` | `vec3` | `[1,1,1]` |  | Scale relative to the parent; `[1, 1, 1]` is unscaled. |
```

## Editing documents by hand

Small value edits straight in the JSON are fine; the engine validates them when it reads the file. For anything structural, such as creating or deleting entities, reparenting, prefab overrides or graphs, use [commands](/docs/manual/commands-and-transactions) so IDs, ordering and history stay correct.
