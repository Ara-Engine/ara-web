---
title: MCP server
description: The tools Ara's built-in MCP server gives agents, global ara mcp through Ara Hub versus per-project ara mcp --root, and how the tools map to the Engine Protocol.
section: Agents
order: 1
---

Ara's MCP server gives an agent the same engine the editor uses: it can find and read entities, look up components and commands, apply edits, control Play, read diagnostics and ask `ara why`. The tools are generated from the engine's own catalog of protocol methods, so they always match your engine version. To connect a client, see [Connect an agent](/docs/manual/connect-an-agent).

## Three ways to serve it

| Command | Transport | Scope |
|---|---|---|
| `ara mcp` | stdio | **Global**: every project registered with Ara Hub. Starts the Hub's background service if needed. |
| `ara mcp --root <project>` | stdio | **One project.** Connects to the project's running owner, or starts the engine for it. |
| `ara serve` | Streamable HTTP at `POST /mcp` on `127.0.0.1` | One project, alongside the Engine Protocol on WebSocket. The port is in `.ara/daemon.json`. |

Over stdio the server keeps one session per connection. Every tool takes an optional `session`; without it, calls use the session the client began, or one that begins automatically on first use, named after the client. Claude Code shows up as `agent:claude-code`.

## Tools

A per-project server has 13 tools. The global server has the same 13 plus `ara_projects`, 14 in all.

| Tool | Does | Protocol methods |
|---|---|---|
| `ara_projects` | Global only. List, create, open, close and check registered projects; list, install and uninstall engine versions. | Hub service |
| `ara_query` | Find entities or documents with the compact query syntax, paginated. | [query](/docs/reference/methods/query) |
| `ara_inspect` | A document's hierarchy as text, or entities with every field and unit. | [inspect](/docs/reference/methods/inspect) |
| `ara_schema` | `search`, `list` or `describe` components, types, commands and methods. | [schema.search](/docs/reference/methods/schema.search), [schema.list](/docs/reference/methods/schema.list), [schema.describe](/docs/reference/methods/schema.describe) |
| `ara_apply` | Run commands as one atomic transaction with a `why`. Supports `dryRun`, `base`, `idempotencyKey` and `branch`. | [cmd.apply](/docs/reference/methods/cmd.apply) |
| `ara_play` | Control Play worlds: start, stop, pause, step ticks with input, watch values, run until a condition, capture, record and replay. | `play.*` |
| `ara_test` | Run unit, play and golden tests. Steps run in order, optionally twice in separate processes to check determinism. | `test.*` |
| `ara_logs` | Diagnostics grouped by code, within a character budget, with filters and a cursor. | [logs](/docs/reference/methods/logs) |
| `ara_why` | Explain a problem: ranked causes, evidence and runnable fixes. | [why](/docs/reference/methods/why) |
| `ara_session` | Sessions, history, undo and redo, rollback to a checkpoint, review and revert, who is here, and branch sessions. | [session.begin](/docs/reference/methods/session.begin), [history.list](/docs/reference/methods/history.list), [review.revert](/docs/reference/methods/review.revert) and others |
| `ara_docs` | Search the generated docs for this engine version. | [docs.search](/docs/reference/methods/docs.search) |
| `ara_jobs` | Start, list, check and cancel long-running jobs. | [jobs.start](/docs/reference/methods/jobs.start), [jobs.status](/docs/reference/methods/jobs.status) |
| `ara_run` | Run C# against the engine SDK inside a transaction. | `run.*` |
| `ara_capture` | Capture images. With the editor open, it captures the viewport with entity marks, the editor UI or a layout report. | `capture` |

> **Gap:** `ara_run` is listed but not available in 0.0.2-alpha.3: calls return [ARA1806](/docs/reference/errors/ARA1806). `ara_capture` works only while the editor has the project open. From a headless engine (`ara serve`, `ara mcp --root` without the editor, or a project the Hub opened headless) it also returns ARA1806: ``error[ARA1806]: `capture` is not available yet: it is provided by the renderer's headless capture service, which is not registered in this engine build``. Headless, use `ara_play` with `"action": "capture"` on a running Play world instead.

Tools with several operations take an `action` parameter. `ara_schema` takes `list`, `describe` or `search`; `ara_jobs` takes `list`, `status`, `start` or `cancel`; `ara_play` and `ara_session` have longer lists, described in their input schemas. Each tool's input schema is generated from the method's parameter types, including the doc comment on every field, so clients see the same descriptions as the [method reference](/docs/reference/methods/cmd.apply).

`ara_apply`'s schema also lists every command with its arguments, so an agent can pick a command without a separate lookup. For details, it calls `ara_schema` with `"action": "describe"`.

What the tools can do depends on which process owns the project. With the editor open, `ara_capture` works and `ara_session` also offers `editor.*` actions for editor navigation; a headless engine doesn't have them.

## What the server tells agents

When a client connects, the server sends instructions. For a per-project server they are:

```text
Ara game engine tools. ara_session {"action": "begin", "client": "<your name>"} returns a `session` handle and the project's documents; over `ara mcp` the session is optional (one begins on first use). Read scenes with ara_inspect and ara_query; edit only through ara_apply (atomic batches with a `why`; `doc` defaults to the document holding the entities you name). Name entities by ID (`e_8b21`), `$symbol` from an earlier call, or `name:Crate` / `name:Floor/Crate`. Find components and fields with ara_schema {"action": "search"}. Conventions: Y-up, meters, degrees, linear colors, references @path#id. Diagnostics carry stable ARA codes and machine-applicable fixes; when something looks wrong (an entity does not show up, a code you do not know, a slow frame), ask ara_why first: it returns ranked causes with fixes. Other humans and agents may be working in the project at the same time: ara_session {"action": "who"} shows who is doing what and their activity. Changes apply immediately, with overwrite notices and undo per turn. Active human field gestures delay only that field, for at most two seconds.
```

The global server's instructions are shorter:

```text
Ara Hub: call ara_projects list to see registered projects. Target any tool with project, or bind using ara_session {action: open, project}. Agent changes apply immediately; undo per turn and overwrite notices are available. Only Hub-registered projects are visible.
```

> **Note:** A `$symbol` lasts only for the batch that mints it. A later `ara_apply` call that uses it fails with [ARA1604](/docs/reference/errors/ARA1604), so agents should switch to the minted ID from the result. See [Commands and transactions](/docs/manual/commands-and-transactions).

## Results

A successful call returns the method's text form in `content` (for example, the same text `ara do` prints) and the full result as JSON in `structuredContent`. Methods meant for agents, such as `why` and `logs`, keep their results short, since that JSON is what the agent reads.

Engine errors come back with `isError: true`, the rendered diagnostics and their JSON, including fixes:

```text
error[ARA1610]: agent changes need a `why`: one sentence on the reason, shown to the human who reviews them
  --> why
  = fix: Add a `why`

diagnostics: [{"code":"ARA1610","severity":"error","message":"agent changes need a `why`: one sentence on the reason, shown to the human who reviews them","location":{"path":"why"},"fixes":[{"title":"Add a `why`","action":"set","path":"why","value":"<one sentence: why this change>"}]}]
```

## Global MCP and Ara Hub

The global server works through Ara Hub's user-level service, which keeps the registry of projects and engine versions. Each open project runs in its own process, either in the editor or headless, so several projects can be open at once.

- **Only Hub-registered projects are visible.** Register a folder with `ara hub add <path>` or create one with `ara hub create`.
- **Every tool takes `project`**: the project's ID, unique name or path. Or bind the session once with `ara_session {"action": "open", "project": "MyGame"}`.
- **Sessions never cross projects.** A session bound to one project can't edit another.
- **Closed projects open on demand.** If the agent targets a registered project that isn't open, the Hub starts it headless.

`ara_projects` actions:

| Action | Does |
|---|---|
| `list` | Registered projects. |
| `create` | Create a project from a template (`template`, `name`, `path`). |
| `open`, `close`, `status` | Open a project in the editor or headless (`headless`), close it, or report whether it is open. |
| `engines` | Installed engine versions. |
| `checkReleases`, `available` | Refresh and list published engine versions (`channel`: `stable` or `preview`). |
| `installEngine`, `uninstallEngine` | Install or remove an engine version (`version`). Installs run as background jobs. |
| `downloads`, `cancelDownload` | Watch or cancel engine downloads (`job`). |

You can manage the same things from the command line with `ara hub projects`, `ara hub status`, `ara hub open`, `ara hub close` and `ara hub activity`. `ara hub shutdown` stops the Hub service; open projects keep running. See the [hub CLI reference](/docs/reference/cli/hub).

## Per-project MCP

`ara mcp --root <project>` serves one project with the original per-project server. It's what the `.mcp.json` from `ara init` runs. It doesn't need the Hub, and it doesn't have `ara_projects`.

## The Engine Protocol underneath

The MCP tools are a thin layer over the **Engine Protocol**: JSON-RPC 2.0 over WebSocket (and optionally stdio) on `127.0.0.1`, authenticated with a token stored in `.ara`. The editor and the `ara` CLI use the same protocol. `ara serve --stdio` also serves it on standard input and output. [rpc.discover](/docs/reference/methods/rpc.discover) returns the protocol version, the scopes and every method with its parameter schema, and the [method reference](/docs/reference/methods/session.begin) documents each one.
