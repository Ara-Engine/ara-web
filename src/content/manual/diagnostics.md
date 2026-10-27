---
title: Diagnostics
description: How Ara reports problems with stable diagnostic codes and runnable fixes, how to read them with ara check and ara logs, and how ara why explains what went wrong.
section: Concepts
order: 6
---

When something is wrong, Ara tells you in one consistent format, whether the problem is a broken reference, a bad command argument, a script reload or a slow frame. Every diagnostic has a stable code, a location and, when the engine knows one, a fix you can run. This page shows how to read them, where to find them, and how to ask the engine to explain a problem.

## Anatomy of a diagnostic

```text
error[ARA1302]: `@models/statue.glb#as_statue` does not resolve: no asset has that ID or path
  --> levels/main.scene · e_8vha · MeshRenderer.model
```

- **Severity**: `error`, `warning` or `info`.
- **Code**: `ARA1302`. Codes are stable: they are never renumbered or reused, so you can search for them, script against them and link to them.
- **Message**: what is wrong, with identifiers in backticks.
- **Location** (`-->`): the file, record and field, or for commands the call and argument, such as `call #0 · commands[0].args.entity`.
- **Fixes** (`= fix:`), when the engine knows them:

```text
warning[ARA1303]: stale path `props/crate.prefab` in `@props/crate.prefab#pf_crate001`; `pf_crate001` now lives at `prefabs/crate.prefab`
  --> levels/main.scene · e_p66p · prefab
  = fix: Write `@prefabs/crate.prefab#pf_crate001`
```

Fixes are machine-applicable. Depending on the problem, a fix sets a value, removes something, renames something, or is a command or CLI call you can run as written. `ara check --fix` applies every fix that is the only one offered for its diagnostic; when there are several candidates, you choose.

With `--json`, every `ara` command prints diagnostics as structured data, including their fixes.

## Every code has a page

Each code has a reference page with its meaning, common causes, fixes and the subsystem that reports it, for example [ARA1302](/docs/reference/errors/ARA1302). The same page is available offline:

```powershell
ara why ARA1302
```

```text
ARA1302 Unresolved reference: Neither the reference's path nor its ID is in the project's asset index. Not on the bus now; its usual causes:
1. [low] The asset was deleted, moved without a usable ID, or never added to the project. (ARA1302)
2. [low] Both halves are mistyped, or the target's document header or import sidecar is invalid and was not indexed. (ARA1302)
checked: on the bus n/a (no occurrences now)

Fixes in general:
- Restore the asset and its valid document header or import sidecar, then run `ara check`.
- Choose the intended reference from the diagnostic's suggestions; `ara check --fix <file>` applies it only when there is exactly one fix, otherwise use `property.set` or correct the file explicitly.
Docs: ara://docs/errors/ARA1302 (ara_docs ARA1302)
```

Codes are grouped by the part of the engine that owns them:

| Codes | Area |
|---|---|
| `ARA0001`–`ARA0899` | C# analyzers and source generators |
| `ARA0900`–`ARA0999` | The C# host and reload |
| `ARA1000`–`ARA1999` | The kernel: JSON (10xx), schema (11xx), documents (12xx), references (13xx), prefabs (14xx), transactions (15xx), commands (16xx), merge (17xx), protocol (18xx), projects (19xx) |
| `ARA2000`–`ARA2099` | The diagnostics bus, `ara why`, reloads and frame timing |
| `ARA2100`, `ARA2200`, `ARA2400`, `ARA2500` | Assets, world streaming, networking, collaboration |
| `ARA3100`, `ARA3200`, `ARA3300`, `ARA3400` | Graphs, materials, render visibility, audio |
| `ARA3600`s | Terrain, VFX, 2D and 2D physics |
| `ARA7000`, `ARA7100`, `ARA7400`, `ARA7500` | Physics, navigation, localization, saves |
| `ARA_GPU_*` | The GPU layer |
| `ARA-EXP-*` | Export, packaging and `ara doctor` checks, such as [ARA-EXP-CLI-001](/docs/reference/errors/ARA-EXP-CLI-001) |

## Checking documents: `ara check`

```powershell
ara check                       # every document in the project
ara check levels/main.scene     # just these files
ara check --fix                 # apply unambiguous fixes, then check again
```

`ara check` validates documents against the schema, their references, their structure and their prefabs. It exits with code 1 when it finds an error.

## Reading the log: `ara logs`

The engine's subsystems report diagnostics as they run: imports, script reloads, physics, rendering, failed commands. `ara logs` reads them, grouped by code with counts, the subjects involved and the best fix:

```powershell
ara logs
```

```text
3 errors · 0 warnings · 0 info (3 occurrences)
error ARA1204 Record not found
  no entity matches `name:Lantern` in this document
  --> call #0 · commands[0].args.entity
error ARA1610 Agent change needs a reason
  agent changes need a `why`: one sentence on the reason, shown to the human who reviews them
  --> why
  fix: Add a `why`
error ARA1609 Entity selector is ambiguous
  `name:Crate` matches 2 entities; use one of their IDs, or name a parent too (`name:Parent/Child`)
  --> call #0 · commands[0].args.entity
  fix: Use `e_8d41` (Crate)
cursor 3 · explain: ara why ARA1204
```

The answer is kept to about 2,000 characters so it stays readable and cheap for agents. Narrow it down with filters:

| Option | Shows |
|---|---|
| `--since <cursor>` | Only entries new or repeated since that cursor. Pass the `cursor` from the last answer. |
| `--code <code>` | Only these codes. Repeatable. |
| `--severity <level>` | `error`, `warning` or `info` and above. |
| `--entity <entity>` | Only entries about this entity. |
| `--subject <subject>` | Only entries about a subject such as `asset:@meshes/crate.glb`, `module:Gameplay` or `system:physics.step`. Repeatable. |
| `--origin <origin>` | Only entries caused by `engine`, `human`, `agent` or `agent:<name>`. |
| `--grep <text>` | Only entries whose message contains the text. |
| `--all` | One entry per line instead of grouped by code. |
| `--budget <chars>`, `--limit <n>` | Size of the answer. |

```powershell
ara logs --since 3
```

```text
no new diagnostics since #3 (cursor 3)
```

Diagnostics that the engine's subsystems report are saved in `.ara/diagnostics.jsonl`, so `ara logs` and `ara why` still see them after the editor closes. Errors from failed commands are only kept while the project's owner process (the editor or `ara serve`) is running. Agents use the `ara_logs` MCP tool, which takes the same filters.

## Asking why: `ara why`

`ara why` takes a question and answers with a short, ranked list of likely causes. Each cause comes with its evidence and fixes you can run as they are, and the answer ends with what was checked and ruled out:

```powershell
ara why name:Box not visible
```

```text
why is `Box` (e_a2ww) in levels/main.scene not visible: 3 causes, 2 certain
1. [high] `Box` (e_a2ww)'s `Transform.scale` is 0 on x (ARA3303)
   evidence: e_a2ww Transform.scale = [0, 1, 1]
   fix: Give the scale its size back: property.set {"entity":"e_a2ww","path":"Transform.scale","value":[1,1,1]}
2. [high] `MeshRenderer.mesh` names no mesh (ARA3305)
   then: set `MeshRenderer.mesh` to a mesh asset (`ara_query` the meshes folder)
3. [medium] `levels/main.scene` has no enabled camera, so nothing in it is drawn in game (the editor viewport has its own) (ARA3310)
   then: add an entity with a `Camera` component (`entity.create`), or enable the existing one
checked: enabled ok, renderer ok (MeshRenderer), transform FAIL (world position [0, 0, -4]), mesh FAIL (none), material n/a (default), camera FAIL (none enabled), streaming n/a (no reports), passes ? (needs the running renderer)
run a fix: ara_apply {cmd, args}, or `ara do <cmd> --args '<args>'`
```

Run the first fix as it's printed:

```powershell
ara do property.set --args '{"entity":"e_a2ww","path":"Transform.scale","value":[1,1,1]}' --why "Give the box its size back"
```

A check marked `?` needs the running renderer, so `ara why` never claims it as a cause.

> **Gap:** In 0.0.2-alpha.3 the visibility check looks for a `MeshRenderer.mesh` field, but [MeshRenderer](/docs/reference/types/MeshRenderer) draws from `shape` and `model`. So it reports [ARA3305](/docs/reference/errors/ARA3305) "No mesh to draw" even for a `MeshRenderer` drawing its default box, as in cause 2 above, and it doesn't report an unresolved `MeshRenderer.model` reference. Ignore ARA3305 when `MeshRenderer.shape` or `model` is set, and run `ara check` to catch broken model references.

### What you can ask

`ara why --list` shows the explainers in your engine version:

| Explainer | Ask about | Examples |
|---|---|---|
| visibility | Why an entity doesn't show up | `name:Crate not visible`, `e_8b21 invisible` |
| code | What a code means, where it occurs now, and the fix for each occurrence | `ARA1302`, `ARA-EXP-AND-007` |
| reload | Why a C# edit took a full module swap or didn't reload | `did reload fall back to L3`, `module:Gameplay reload slow` |
| frame | Why frames are slow: percentiles against the budget, top scopes, hitches | `is the frame slow`, `frame hitches` |
| asset | Whether an asset resolves, imported, compiles, and who uses it | `@materials/crate.material`, `@meshes/crate.glb broken` |
| subject | Everything the diagnostics say about an entity, asset, system, pass or module | `name:Door not opening`, `system:physics.step` |
| audio | Why a sound can't be heard | `why can't I hear name:Radio`, `e_8b21 is silent` |
| npc | Why an AI character isn't moving or reacting | `why isn't name:Guard moving` |

Quotes around the question are optional. Use `--doc <doc>` when an entity name exists in several documents. With `--json`, the answer includes the fixes as structured commands; add `--full` for the complete report with evidence and checks.

When a code is currently on the bus, `ara why <code>` lists each occurrence with its own fix:

```text
ARA1609 Entity selector is ambiguous: A name selector matches multiple resolved entities in the selected document. 1 occurrences now:
1. [high] `name:Crate` matches 2 entities; use one of their IDs, or name a parent too (`name:Parent/Child`) (ARA1609)
   evidence: at call #0 · commands[0].args.entity
   fix: Use `e_8d41` (Crate) — set commands[0].args.entity = "e_8d41"
   fix: Use `e_p66p` (Crate) — set commands[0].args.entity = "e_p66p"
checked: on the bus FAIL (1 records, 1 occurrences)
```

Agents call the same thing with the `ara_why` MCP tool. The MCP server's instructions tell agents to ask `ara_why` first when something looks wrong, before inspecting by hand.

## Exit codes

Every `ara` command uses the same exit codes:

| Code | Meaning |
|---|---|
| `0` | Success. |
| `1` | The command ran and found a problem: `ara check` found errors, a batch failed, `ara merge` left conflicts, there was nothing to undo. |
| `2` | The command couldn't run: no project, a file error, or the project lock held for more than 10 seconds. With `--json` it prints `{"ok": false, "diagnostics": [...]}`. |
