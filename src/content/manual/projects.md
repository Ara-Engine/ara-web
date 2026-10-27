---
title: Projects
description: How an Ara project is laid out, what ara.project.json holds, what ara init writes, and how the engine runs a project.
section: Concepts
order: 1
---

An Ara project is a folder with an `ara.project.json` file at its root. Everything you author lives in that folder as text documents and source media; the engine's local state lives in a hidden `.ara` folder next to them.

## What `ara init` writes

| File | Purpose |
|---|---|
| `ara.project.json` | Marks the project root and holds its name, main scene and engine version. |
| `levels/main.scene` | An empty scene, the project's main scene. |
| `ara.imports` | Project-wide texture import defaults. |
| `AGENTS.md` | The engine's conventions, written for AI agents. |
| `.mcp.json` | A per-project MCP server for agents. See [Connect an agent](/docs/manual/connect-an-agent). |
| `.gitattributes` | Routes `*.scene` and `*.prefab` through Ara's merge driver and sets LF line endings. |
| `.gitignore` | Ignores `.ara/`. |

Inside a git work tree, `ara init` also configures the `merge.ara` driver in the repository. Outside one, it prints the `git config` command to run later. See [Merging](/docs/manual/merging).

`ara init` refuses to run where a project already exists:

```text
error[ARA1902]: `\\?\C:\Games\MyGame` already has `ara.project.json`
```

The Hub's **Blank project** and **Starter** templates produce the same kind of project. The samples add their own folders, such as `levels`, `prefabs`, `materials`, `terrain` and `assets` in Outpost. Ara doesn't require a folder layout; documents are found by their file extension.

## `ara.project.json`

A new project's marker looks like this:

```json
{
  "name": "MyGame",
  "main": "levels/main.scene",
  "engineVersion": "0.0.1-alpha"
}
```

| Field | Meaning |
|---|---|
| `name` | The project's name. `ara init` uses the folder name unless you pass `--name`. |
| `main` | The startup scene: the scene `ara` commands edit by default and Play starts with. |
| `engineVersion` | The engine version the project is pinned to. The Hub opens the project with that version. |

The file is itself a document, of kind `project`, so changing it goes through commands with history and undo like any other edit. To change the startup scene, use [project.setMain](/docs/reference/commands/project.setMain):

```powershell
ara do doc.create --args '{path: "levels/yard.scene", id: sc_yard}' --why "Create the yard level"
ara do project.setMain --args '{scene: "@levels/yard.scene#sc_yard"}' --why "Start in the yard"
```

```text
applied tx_em3dn245 to ara.project.json (revision 7)
  created: levels/yard.scene (scene)
applied tx_fag6ceje to ara.project.json (revision 8)
  modified: p_settings unnamed
```

`ara undo` puts the old main scene back. In a running editor, `project.setMain` also changes Play's default scene immediately.

## How `ara` finds the project

Every project command works on one project root. `ara` uses `--root <dir>` if you pass it, and otherwise the nearest folder at or above the current one that contains `ara.project.json`. It never assumes the current folder is a project:

```text
error[ARA1901]: no `ara.project.json` in `C:\Users\you\Desktop` or any parent directory; run `ara init` to create a project, or pass `--root <dir>`
  = fix: Create a project here with `ara init`
```

When `ara` scans a project for documents, it skips hidden folders such as `.git` and `.ara`, plus `target/`, `node_modules/`, `spikes/` and nested projects.

## The `.ara` folder

`.ara/` holds the engine's local state for the project. It is ignored by git and belongs to your machine:

| Item | What it is |
|---|---|
| `journal` | Every transaction, so history, review and undo survive restarts. |
| `diagnostics.jsonl` | Diagnostics reported by the engine's subsystems, so `ara why` can use them later. |
| `lock` | Held by the process that owns the project. |
| `daemon.json`, `token` | How local clients find and authenticate with a running daemon. |
| `cache` | Derived data such as imported assets. |
| `docs` | Output of `ara docs --llms`. |

> **Note:** Because `.ara/` isn't committed, history and undo are local. A teammate who pulls your changes gets the documents, not your transaction history.

## Who runs the project

One process at a time owns a project. It holds `.ara/lock`, keeps the documents in memory, records transactions in the journal and saves changed files shortly after each edit. The owner can be:

- **the editor**, when you open the project there;
- **`ara serve`**, a headless daemon that serves the Engine Protocol over WebSocket and MCP at `/mcp` on `127.0.0.1`;
- **`ara mcp --root`**, which starts the engine when no daemon is running;
- **`ara hub open --headless`**, which starts a background daemon through the Hub.

```powershell
ara serve
```

```text
ara: serving \\?\C:\Games\MyGame on ws://127.0.0.1:62151/ (MCP: POST http://127.0.0.1:62151/mcp)
```

The port is picked at random unless you pass `--port`, and is written to `.ara/daemon.json`. A second process that tries to take the project fails with [ARA1903](/docs/reference/errors/ARA1903).

When an owner is running, `ara` commands go to it, so the editor, agents and your terminal see the same live state. When none is running, `ara` opens the project in-process for that one command and replays the journal first, so history and undo carry over between runs.

> **Gap:** `ara redo` only works while an owner process is running. Without one, each `ara` command starts fresh and the redo stack isn't rebuilt from the journal, so `ara redo` after an offline `ara undo` reports [ARA1505](/docs/reference/errors/ARA1505). Run `ara serve` (or keep the editor open) if you need redo from the command line.

## Editing files by hand

You can edit a document's JSON directly; the engine validates it. While an owner process is running, it notices the change and merges it in as a human `external edit`. If the file can't be read or conflicts with unsaved changes, the document is marked diverged until it is synced, keeping either the in-memory or the on-disk version ([doc.sync](/docs/reference/methods/doc.sync)).

For hierarchy, prefabs and graphs, use commands instead of editing files. They keep IDs, ordering and overrides consistent. See [Commands and transactions](/docs/manual/commands-and-transactions).
