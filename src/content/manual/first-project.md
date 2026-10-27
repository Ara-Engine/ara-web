---
title: Your first project
description: Create a project, open it in the editor, and make, inspect and undo your first edits from the command line.
section: Start
order: 3
---

This page takes you from an empty folder to a scene with a crate, a light and a camera. You'll create the project, open it in the editor, and make edits with `ara do` so you can see how each change is recorded.

## Create a project

### From Ara Hub

Click **New project** and pick a template:

| Template | What you get |
|---|---|
| Blank project | An empty scene, ready for your first entity. |
| Starter | The files `ara init` writes, with an empty main scene. |
| Outpost | Sample levels (`levels/outpost.scene`, `levels/hangar.scene`) from Outpost, the co-op salvage game being built on Ara. |
| Material and character showcase | A sample level, `levels/showcase.scene`. |

The Hub registers the new project, so it shows in your project list and agents connected through the Hub can see it.

> **Note:** The samples keep third-party art outside the engine package. If a sample's files are missing, the Hub shows a setup message on its template tile and won't create the project until they're in place ([ARA1913](/docs/reference/errors/ARA1913)).

### From the command line

`ara hub create` does the same as **New project**. The path must be absolute and must not exist yet:

```powershell
ara hub create C:\Games\MyGame --name MyGame --template blank
```

`ara init` creates a project without registering it. Run it in an empty folder, or give it a directory:

```powershell
ara init C:\Games\MyGame
```

```text
initialized Ara project `MyGame` in \\?\C:\Games\MyGame
  created ara.project.json
  created ara.imports
  created AGENTS.md
  created .gitattributes
  created .gitignore
  created .mcp.json
  created levels/main.scene
  not a git work tree; in one, run `git config merge.ara.driver "ara merge %O %A %B"`
next: `ara check`, then `ara serve` (or let `ara mcp --root .` start the engine)
```

To show an `ara init` project in the Hub, register it. Its files stay where they are:

```powershell
ara hub add C:\Games\MyGame
```

[Projects](/docs/manual/projects) explains each file `ara init` writes.

## Open it in the editor

In the Hub, click **Open** on the project card. From the command line:

```powershell
ara hub open MyGame                   # a registered project, by name, ID or path
ara-editor C:\Games\MyGame --sample   # open a folder directly
```

`--sample` fills an empty scene with a sample scene, as an undoable edit. `ara-editor` also takes `--scene levels/other.scene` to open a different scene and `--play` to start Play once the window is up.

While the editor has the project open, it is the project's engine authority. `ara` commands you run in the project folder go to it, so their changes appear in the editor straight away.

## Make an edit

Open a terminal in the project folder and create an entity:

```powershell
ara do entity.create --args '{name: Crate, components: {Transform: {position: [2, 0, 3]}, MeshRenderer: {}}}' --why "Add a crate"
```

```text
applied tx_tzs7x4fk to levels/main.scene (revision 1)
  created: e_8d41 Crate
```

What happened:

- [entity.create](/docs/reference/commands/entity.create) ran as one **transaction**, `tx_tzs7x4fk`, on the project's main scene.
- The engine minted the ID `e_8d41` for the new entity.
- `--why` recorded the reason. It's optional when you run `ara` yourself and required when an agent does.
- `MeshRenderer: {}` adds a [MeshRenderer](/docs/reference/types/MeshRenderer) with every default, which draws a 1 m box.

Simple values can go in `-p key=value` flags instead of JSON. Dots nest, and `name:Crate` refers to an entity by name:

```powershell
ara do entity.create -p name=Camera -p components.Transform.position=[0,2,8] -p components.Camera={} --why "Add a camera"
ara do transform.lookAt -p entity=name:Camera -p target=name:Crate --why "Aim the camera at the crate"
```

A scene needs an enabled [Camera](/docs/reference/types/Camera) to draw anything in Play. The editor's viewport has its own camera, so a scene can look fine there and still be empty in game.

Add a light as a child of the crate, 2 m above it:

```powershell
ara do entity.create --args '{name: CrateLight, parent: "name:Crate", components: {Transform: {position: [0, 2, 0]}, Light: {intensity: 400}}}' --why "Light the crate"
```

## Look at the scene

`ara inspect` prints the main scene's hierarchy. Name an entity to see all of its components, with defaults filled in:

```powershell
ara inspect
ara inspect name:CrateLight
```

```text
scene main (sc_akzn9ftc) · levels/main.scene · 3 entities · showing 1-3 of 3, depth≤2 · units m/deg · Y-up
e_8d41 Crate [MeshRenderer] pos(2,0,3)
  e_4chy CrateLight [Light] pos(0,2,0)
e_3fze Camera [Camera] pos(0,2,8) rot(-21.80141,-20.374525,-7.928141)

e_4chy CrateLight [Light] pos(0,2,0) · parent e_8d41 · defined in sc_akzn9ftc#e_4chy
  Light: kind=point color=(1,1,1,1) intensity=400 range=10m innerAngle=20deg outerAngle=30deg
  Transform: position=(0,2,0)m rotation=(0,0,0)deg scale=(1,1,1)
```

`ara query` finds entities without printing the whole scene:

```powershell
ara query Light                    # entities with a Light
ara query "Light.intensity>300"    # field comparisons
ara query crate                    # names containing "crate"
```

## Change a value, then undo it

```powershell
ara do property.set -p entity=name:CrateLight -p path=Light.intensity -p value=500 --why "Dimmer crate light"
ara history
```

```text
tx_8qc3ga7e r5 human · Dimmer crate light · 1 entities
tx_bnynzfx1 r4 human · Light the crate · 1 entities
tx_wpch9vb7 r3 human · Aim the camera at the crate · 1 entities
tx_yrbbvprx r2 human · Add a camera · 1 entities
tx_tzs7x4fk r1 human · Add a crate · 1 entities
```

Each line is one transaction: its ID, the revision it produced, the author, the reason and how many entities it touched. Now undo the last one:

```powershell
ara undo
```

```text
tx_vyrsk7fd reverting tx_8qc3ga7e (revision 6)
```

Undo doesn't erase history. It adds a new transaction that restores the old values. [Review and undo](/docs/manual/review-and-undo) covers redo, reverting one entity, and undoing an agent's whole turn.

## Check the project

```powershell
ara check
```

```text
checked 2 files: 0 errors, 0 warnings
```

`ara check` validates every document against the schema, its references and its prefabs. When something is wrong, it prints a diagnostic with a stable code and usually a fix. [Diagnostics](/docs/manual/diagnostics) shows how to read them.

## Play

Use Play in the editor to run the scene. Play runs in a separate player process, so a crash in game code doesn't take the editor down.

> **Gap:** The first import of a large project is slow: the Outpost sample took about 2.3 minutes for 115 imports in the team's test run. Later opens use the project's cache. A project's first Build can also take a couple of minutes.

## Next steps

- [Connect an agent](/docs/manual/connect-an-agent) so Claude Code or Codex can work in this project.
- Read [Commands and transactions](/docs/manual/commands-and-transactions) for batches, symbols and dry runs.
- Start writing gameplay with the [Scripting overview](/docs/manual/scripting-overview).
