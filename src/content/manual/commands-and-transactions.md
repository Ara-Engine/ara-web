---
title: Commands and transactions
description: How every edit in Ara runs as a command inside an atomic, attributed transaction, and how to use ara do, batches, symbols, dry runs and the required why.
section: Concepts
order: 4
---

Every change to an Ara project is a **command**: a named, typed operation such as `entity.create` or `property.set`. Commands run inside a **transaction** that applies completely or not at all, records who made it and why, and can be undone. The editor, the `ara` CLI and agents over MCP all use the same command registry, so an edit means the same thing wherever it comes from.

## The command registry

The registry in 0.0.1-alpha has 90 commands. They cover:

- entities, components and prefabs: `entity.*`, `component.*`, `property.set`, `transform.*`, `prefab.*`;
- documents and the project: `doc.create`, `doc.delete`, `project.setMain`;
- assets and imports: `import.*`, `material.*`, `physics.collider.fromModel`;
- domain editors: `animation.*`, `audiograph.*`, `music.*`, `terrain.*`, `foliage.*`, `tilemap.*`, `sprite.set`, `vfx.*`, `behavior.*`, `l10n.*`, `ui.source.apply`.

List them, or describe one with its parameters, units and examples:

```powershell
ara schema                    # every type, document kind and command
ara schema entity.create      # one command in full
```

```text
# Command `entity.create`

Create an entity, optionally with a parent, a position among its siblings and components.

- Kind: Command
- Scope: `edit:scene`
- Idempotent: false · destructive: false

## Params (`EntityCreateParams`)

| Field | Type | Default | Unit | Description |
|---|---|---|---|---|
| `id` | `option<string>` | `null` |  | ID of the new entity: a symbol (`$crate`) that later calls in the batch can use, or a concrete unused record ID. Minted when absent. |
| `name` | `option<string>` | `null` |  | Display name. |
| `parent` | `option<entity>` | `null` |  | Parent entity; absent creates a root. May be inside a prefab instance. |
| `index` | `option<u32>` | `null` |  | Position among the parent's children; absent appends. |
| `components` | `option<map<json>>` | `null` |  | Components to add, by type name; `{}` uses every default. |
```

The [command reference](/docs/reference/commands/entity.create) has a page per command. Agents search the same information with the `ara_schema` MCP tool. The `Scope` line says which [session scope](/docs/manual/sessions-and-scopes) the command needs.

## Running one command: `ara do`

```powershell
ara do property.set -p entity=name:CrateLight -p path=Light.intensity -p value=500 --why "Dimmer crate light"
```

```text
applied tx_8qc3ga7e to levels/main.scene (revision 5)
  modified: e_4chy CrateLight
```

| Option | Use |
|---|---|
| `--args <json>` | All arguments as one JSON object. Quotes are optional (`{entity: e_8b21, value: [1, 0, 0, 1]}`), so shells that strip them, such as PowerShell, are fine. Also `@file.json`, or `-` for stdin. |
| `-p key=value` | One argument. Values are JSON (`[0,1,0]`, `true`) or text. `a.b=1` nests, and lists can skip quotes (`entities=[e_1,e_2]`). Repeatable. |
| `--doc <doc>` | The document to edit, as a path, an ID or a unique file name such as `main`. |
| `--why <text>` | The reason, in a sentence. Required for agents. |
| `--dry-run` | Show what would change without applying it. |
| `--as <$symbol>` | Name the record the command creates. |
| `--json` | Print the full result as JSON. |

When you leave out `--doc`, the engine picks the one document that holds every entity the command names, and otherwise the project's main scene. If the entities are in several documents, it asks you to choose ([ARA1814](/docs/reference/errors/ARA1814)). See the [`ara do` reference](/docs/reference/cli/do).

## Transactions

Each `ara do` call, each MCP `ara_apply` call and each edit in the editor becomes one transaction:

- **Atomic.** All its calls run in order against the same staged state. If any call fails, everything rolls back and nothing is written.
- **Validated.** Parameters are checked against their schema first. At commit, every touched document is checked again. A transaction only fails for errors it introduces; problems a document already had don't block unrelated edits.
- **Attributed.** It records its author (`human` or `agent:<name>`), its `why`, and the revision it produced. Revisions count up across the project.
- **Reversible.** Every operation has an automatic inverse, which is what undo and revert apply. See [Review and undo](/docs/manual/review-and-undo).

Errors point at the call that failed, so in a long batch you can see which one to fix:

```text
error[ARA1607]: `e_254d` has no `Light`; add it with `component.add` first
  --> call #1
```

## Batches

To run several commands as one transaction, pass a batch instead of a command name. A batch is a JSON object with `commands`, a `why` and an optional `doc`:

```json
{
  "why": "Add a lamp post next to the crate",
  "doc": "levels/main.scene",
  "commands": [
    {"cmd": "entity.create", "as": "$post", "args": {"name": "LampPost", "components": {"Transform": {"position": [3, 0, 4]}}}},
    {"cmd": "entity.create", "args": {"name": "Bulb", "parent": "$post", "components": {"Transform": {"position": [0, 2.5, 0]}, "Light": {"intensity": 600}}}}
  ]
}
```

```powershell
ara do --args @lamp.json
```

```text
applied tx_qt8nfzrg to levels/main.scene (revision 17)
  created: e_68px LampPost ($post), e_fmcj Bulb
```

Use batches for anything that should be undone as a unit: a prop with its children, a generated layout, or deleting and recreating a document.

## Symbols

New records get IDs the engine mints, so you can't know them in advance. A **symbol** solves that inside a batch. `"as": "$post"` (or `"id": "$post"` in the arguments) binds the new entity's ID to `$post`, and later calls in the same batch use `$post` anywhere an entity or string is expected, including as the head of an address such as `$post/e_lid1`. The result reports what each symbol became: `e_68px LampPost ($post)`.

Symbols last for one batch. A later call can't use them:

```text
error[ARA1604]: `$barrel` is not defined by an earlier call in this batch
  --> call #0
```

Use the minted ID, or a `name:` selector, from then on. If you need predictable IDs, pass a concrete unused ID instead of a symbol, such as `"id": "e_lamp01"`.

## Dry runs

A dry run does everything an apply would do, including the commit checks, then rolls back. You see the exact diff without changing anything:

```powershell
ara do --args @lamp.json --dry-run
```

```text
dry run on levels/main.scene: nothing was applied
  would create: e_4s0c LampPost ($post), e_tmr2 Bulb
```

With `--json`, the result includes each operation with its previous value:

```json
"ops": [
  {
    "op": "set",
    "doc": "sc_akzn9ftc",
    "id": "e_fmcj",
    "path": "Light.intensity",
    "value": 900,
    "prev": 600
  }
]
```

Over MCP, pass `"dryRun": true` to `ara_apply`. Agents don't need a `why` for a dry run.

> **Note:** IDs in a dry run's output are a preview. The real apply can mint different ones, as in the two outputs above.

## Why

Every transaction can carry a `why`: one sentence on the reason. It appears in `ara history`, in the editor's Agents feed and in review. It's optional for you and required for agents. An agent edit without one is rejected with [ARA1610](/docs/reference/errors/ARA1610), along with any other problems a dry run of the batch finds, so the agent can fix everything in one retry.

## Base revisions and retries

Two more options make agent edits safe to plan and retry. They're parameters of the `ara_apply` MCP tool and the [cmd.apply](/docs/reference/methods/cmd.apply) method:

- **`base`**: the revision the batch was planned against. If a later transaction touched the same fields, the commit fails with [ARA1501](/docs/reference/errors/ARA1501) instead of overwriting them. Edits to other fields still go through.
- **`idempotencyKey`**: retrying with the same key returns the first result instead of applying twice.

## When a human is editing the same field

Agent edits apply immediately. If an agent's command touches a field you're dragging or typing in at that moment, only that field waits until your gesture ends, for at most two seconds. If an edit overwrites a field someone else changed recently, both of you get a notice ([ARA2503](/docs/reference/errors/ARA2503)). See [Review and undo](/docs/manual/review-and-undo).

## Commands that read

A few registry entries read instead of write, such as [entity.inspect](/docs/reference/commands/entity.inspect). Day to day you'll use the dedicated readers instead: `ara query`, `ara inspect`, `ara history` and `ara logs` on the command line, or `ara_query`, `ara_inspect` and `ara_logs` over MCP.
