---
title: Connect an agent
description: Connect Claude Code, Codex or another MCP client to Ara, either once for every Hub project or per project.
section: Start
order: 4
---

Ara includes an MCP server, so an AI agent can query, edit and play your project through the same commands the editor uses. You can connect an agent once for every project registered in Ara Hub, or connect it to a single project folder.

| | Global (through the Hub) | Per project |
|---|---|---|
| Set up | Once per agent client | Per project folder |
| Command | `ara mcp` | `ara mcp --root <project>` |
| Projects it sees | Every Hub-registered project | That project only |
| Needs `ara` on `PATH` | No, the config uses the full path | Yes, as `ara init` writes it |

## Connect once through the Hub

The Hub's **Agents** page shows the setup for your client and copies it for you. You can print the same thing from the command line:

```powershell
ara hub install-mcp --client claude
```

```json
{
  "mcpServers": {
    "ara": {
      "command": "C:\\Users\\you\\AppData\\Local\\Ara\\Engines\\0.0.2-alpha.3\\ara.exe",
      "args": [
        "mcp"
      ]
    }
  }
}
```

```powershell
ara hub install-mcp --client codex
```

```toml
[mcp_servers.ara]
command = "C:\\Users\\you\\AppData\\Local\\Ara\\Engines\\0.0.2-alpha.3\\ara.exe"
args = ["mcp"]
```

The output contains the absolute path of the `ara.exe` you ran, so the agent doesn't depend on your `PATH`. Add it to your client's user-level MCP configuration once. Neither the Hub nor `ara` edits your agent's config files for you.

For Claude Code, one way is its own command, using the path from the output above:

```powershell
claude mcp add --scope user ara -- "C:\Users\you\AppData\Local\Ara\Engines\0.0.2-alpha.3\ara.exe" mcp
```

For Codex, add the TOML block to its `config.toml`.

The global server starts the Hub's background service if it isn't running. It only shows projects registered with the Hub, so register any folder you created with `ara init`:

```powershell
ara hub add C:\Games\MyGame
```

### What the agent does first

Through the global server the agent gets an extra tool, `ara_projects`, and starts there:

```json
{"action": "list"}
```

It then binds its session to one project with `ara_session`, or passes `project` to any other tool:

```json
{"action": "open", "project": "MyGame"}
```

`project` accepts the project's ID, its unique name or its path. A session never crosses projects. `ara_projects` can also create, open, close and check the status of projects, and install engine versions. See [MCP server](/docs/manual/mcp-server).

## Connect one project

`ara init` writes a `.mcp.json` in the project folder:

```json
{
  "mcpServers": {
    "ara": {
      "command": "ara",
      "args": ["mcp", "--root", "."]
    }
  }
}
```

Claude Code started inside the project folder picks this file up. For Codex, add this to its config, with your project's path:

```toml
[mcp_servers.ara]
command = "ara"
args = ["mcp", "--root", "C:\\Games\\MyGame"]
```

If the editor or `ara serve` already has the project open, `ara mcp --root` connects to it. Otherwise it starts the project's engine itself and serves until the agent disconnects.

> **Note:** This config runs `ara` by name, so `ara` must be on the agent's `PATH`. If it isn't, replace `"ara"` with the full path to `ara.exe`.

## Try it

Open the project in the editor, then ask your agent something like:

```text
List my Ara projects and add a lamp next to the crate in MyGame.
```

The agent's edits apply immediately. The editor's **Agents** panel is an activity feed of each agent turn, with **Undo turn** to reverse one. From the command line, `ara history` shows the agent's transactions with the reason it gave for each:

```text
tx_y6dskhef r2 agent:claude-code accepted · Add a crate with a lamp above it · 2 entities
```

`ara hub activity` lists the agents and editors attached to each project.

## How agents are identified

Every change records its author, so you can always tell agent edits from your own.

- **Over MCP**, the session's author comes from the client's name: Claude Code becomes `agent:claude-code`. An agent can choose its name with `ara_session {"action": "begin", "client": "<name>"}`.
- **On the command line**, `ara` detects when an agent's shell runs it: Claude Code becomes `agent:claude-code` and Codex `agent:codex`. Otherwise it uses the `ARA_AUTHOR` environment variable, or `human`. You can override it per command with `--author human` or `--author agent:<name>`.

Agents must give a reason with every change. An edit without one fails with [ARA1610](/docs/reference/errors/ARA1610):

```text
error[ARA1610]: agent changes need a `why`: one sentence on the reason, shown to the human who reviews them
  --> why
  = fix: Add a `why`
```

## Give the agent the conventions

`ara init` also writes `AGENTS.md` at the project root: a short guide to the engine's conventions (axes and units, IDs, references, using commands instead of editing files by hand, asking `ara why` first). Point your agent at it if it doesn't read `AGENTS.md` on its own.

For a full reference an agent can search, `ara docs --llms` writes `llms.txt`, `llms-full.txt` and a page per type, command, method and diagnostic code into `.ara/docs`. Agents can also search the same pages with the `ara_docs` tool.

## Next steps

- [MCP server](/docs/manual/mcp-server) lists every tool.
- [Sessions and scopes](/docs/manual/sessions-and-scopes) explains what an agent session can do.
- [Review and undo](/docs/manual/review-and-undo) shows how to reverse agent work.
