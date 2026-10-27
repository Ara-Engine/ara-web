---
title: Sessions and scopes
description: How agent sessions work in Ara, which scopes a session can hold and what agents get by default, and how checkpoints, rollback, presence and optional branch sessions fit in.
section: Agents
order: 2
---

Every call to the engine runs in a **session**. The session says who is acting, which **scopes** they hold, and keeps their turns and checkpoints together so their work can be reviewed and rolled back as a unit. Over MCP you rarely manage sessions by hand, but knowing what they hold explains what an agent can and can't do.

## Beginning a session

An agent begins a session with `ara_session` (the [session.begin](/docs/reference/methods/session.begin) method):

```json
{"action": "begin", "client": "level-designer", "label": "Block out the yard"}
```

| Parameter | Meaning |
|---|---|
| `client` | Who is connecting, such as `claude-code` or `codex`. Required. |
| `author` | The author recorded on transactions: `human` or `agent:<name>`. Defaults to `agent:<client>`. |
| `scopes` | The scopes to request. Defaults to everything the policy allows. |
| `label` | A short description of the work, shown in review. |

The answer contains the session handle, the scopes granted and denied, the current revision and the project's documents:

```json
{
  "session": "ses_47xqph7g",
  "author": "agent:level-designer",
  "granted": [
    "read",
    "edit:scene"
  ],
  "denied": [
    "net"
  ],
  "approvedBy": "policy",
  "revision": 29,
  "documents": [
    {
      "path": "levels/main.scene",
      "kind": "scene",
      "id": "sc_akzn9ftc"
    }
  ],
  "mainScene": "levels/main.scene"
}
```

(The real answer lists every document in the project and ends with a short `hint` on how to use the other tools.)

Over `ara mcp` this step is optional. If the agent calls any tool without a `session`, one begins automatically on first use, named after the MCP client. The handle works for every tool that takes `session`, and sessions survive engine restarts until they end.

On the command line, each protocol command (`ara do`, `ara query`, `ara undo` and so on) begins and ends its own short session. The author comes from `--author`, the `ARA_AUTHOR` environment variable, or the agent whose shell runs `ara`; see [Connect an agent](/docs/manual/connect-an-agent).

## Scopes

Scopes limit what a session may do. They're checked before every method and command; each command's reference page lists the scope it needs.

| Scope | Allows |
|---|---|
| `read` | Read documents, schemas, history, logs and docs. |
| `edit:scene` | Edit scenes and prefabs through commands. |
| `edit:assets` | Edit other authored assets: materials, UI, settings. |
| `edit:code` | Edit game and editor code. |
| `play` | Start, step and control Play worlds. |
| `run` | Run scripts against the typed SDK (code mode). |
| `import` | Import source media. |
| `bake` | Bake derived data such as lighting and navigation. |
| `build` | Build and export the game. |
| `generate:$` | Run generation jobs that spend money. |
| `fs:outside-project` | Read or write files outside the project. |
| `net` | Use the network. |

**The default policy grants humans every scope, and agents every scope except `generate:$`, `fs:outside-project` and `net`.** An agent that asks for one of those gets it listed under `denied`, as `net` is above. An agent that asks for nothing gets the full default set:

```json
"granted": ["read", "edit:scene", "edit:assets", "edit:code", "play", "run", "import", "bake", "build"]
```

A session can ask for fewer scopes than the policy allows. A read-only reviewer agent, for example, can begin with `"scopes": ["read"]`. If it then tries to edit, the command is refused before anything happens:

```text
error[ARA1603]: `entity.create` needs the `edit:scene` scope, which this session lacks
  --> call #0
```

Denied scope requests are also logged as a warning, [ARA1805](/docs/reference/errors/ARA1805).

## Turns and checkpoints

Each `ara_apply` call is one **turn**. Before it runs, the engine records a **checkpoint**: the revision to return to. Agents can add their own:

```json
{"action": "checkpoint", "label": "Before the fence"}
```

```json
{
  "id": "cp_vs806dpe",
  "revision": 30,
  "label": "Before the fence",
  "auto": false
}
```

Then, within the session:

- `{"action": "diff"}` shows what the session changed since it began, or since `checkpoint`, per entity with old and new values;
- `{"action": "rollback", "to": "cp_…"}` undoes every transaction of this session after that checkpoint, all or nothing;
- `{"action": "status"}` shows the session's scopes, turns, checkpoints and any documents not yet saved.

Rollback only touches the session's own transactions; other people's work stays. See [Review and undo](/docs/manual/review-and-undo) for examples.

## Ending a session

```json
{"action": "end"}
```

After that, the handle stops working:

```text
error[ARA1803]: no live session `ses_47xqph7g`; begin one with `session.begin` and pass its handle
  --> params.session
  = fix: Begin a session
```

Ending a session doesn't undo anything. Its transactions stay in history, and you can still undo or revert them.

## Working alongside others

Several people and agents can work in one project at once. Agent edits apply immediately, so sessions add visibility rather than locks:

- **Who is here.** `{"action": "who"}` lists the participants, what they're looking at and what they last did:

  ```text
  1 here at revision 30 (nobody else)
  - level-designer (agent, you): doing entity.create "Test" 0 s ago
  ```

  From the command line, `ara hub activity` lists the agents and editors attached to each project.
- **Claims are advisory.** `{"action": "claim"}` marks entities, components, documents or files as something you're working on, with an expiry, and `release` drops them. Claims show up for others but never block an edit.
- **Overwrite notices and gesture safety** work for every session; see [Review and undo](/docs/manual/review-and-undo).

## Branch sessions

For larger changes an agent can work in private first. `{"action": "branch", "why": "…"}` opens a branch session: a private copy of the live documents. The agent passes the branch ID (`br_…`) as `branch` to `ara_apply`, and nobody sees those edits yet. `{"action": "submit", "branch": "br_…"}` merges the branch into the live documents immediately, with a field-level three-way merge like [ara merge](/docs/manual/merging).

Branches are optional. The default, and what most agents should do, is to edit live with a clear `why` on every turn.

## Sessions over the global MCP

Through the Hub, a session is also bound to one project. `{"action": "open", "project": "MyGame"}` binds it, or the agent passes `project` with each call. A session never crosses projects: a handle from one project is rejected in another. See [MCP server](/docs/manual/mcp-server).
