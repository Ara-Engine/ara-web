---
title: Introduction
description: What Ara is, what the 0.0.1-alpha release includes, and how this manual is organized.
section: Start
order: 1
---

Ara is a game engine written in Rust, with a native editor, C# 14 / .NET 10 gameplay scripting and built-in tools for AI agents. This manual shows you how to install it, how a project is put together, and how you and your agents can work on the same project without stepping on each other.

## What makes Ara different

**Every edit is a typed command.** The editor, the `ara` command-line tool and agents connected over MCP all change a project through one shared command registry. Each change becomes a transaction that records who made it and why, and you can undo it. See [Commands and transactions](/docs/manual/commands-and-transactions).

**Projects are plain text.** Scenes and prefabs are canonical JSON: a flat map of records keyed by short IDs, with `@path#id` references between files. Because the format is stable, `ara merge` can merge two versions record by record, and git can use it as a merge driver. See [Documents and IDs](/docs/manual/documents-and-ids) and [Merging](/docs/manual/merging).

**Agents are first-class users.** A built-in MCP server gives Claude Code, Codex and other MCP clients the same commands the editor uses. Agent edits apply immediately, like a teammate's, and you can undo any agent turn. See [Connect an agent](/docs/manual/connect-an-agent).

**The engine explains itself.** Diagnostics carry stable codes such as [ARA1302](/docs/reference/errors/ARA1302). Ask `ara why name:Crate not visible` and the engine answers with ranked causes, the evidence for each and fixes you can run as they are. See [Diagnostics](/docs/manual/diagnostics).

## What's in 0.0.1-alpha

This is the first public alpha, for testers and agents. It includes:

- **Ara Hub**, which installs engine versions side by side, creates projects from templates, opens them in the editor or headless, and gives you the setup for your agents.
- **The editor**, with hierarchy, inspector, assets and console panels, tool panels for agents, materials, VFX, animation and profiling, detachable windows, and Play in a separate, crash-isolated player process.
- **The `ara` CLI and daemon**: `init`, `do`, `query`, `inspect`, `check`, `fmt`, `merge`, `why`, `logs` and more. Run `ara --help` for the full list, or see the [CLI reference](/docs/reference/cli/do).
- **MCP for agents**, either one global server through the Hub or one server per project.
- **C# gameplay** with live code reload, and standalone Windows exports with NativeAOT. See the [Scripting overview](/docs/manual/scripting-overview).
- **Engine systems**: Jolt physics, spatial audio, navigation and crowds, animation with IK and motion matching, GPU VFX, terrain and foliage, world streaming, 2D, localization and saves.

> **Gap:** Ara 0.0.1-alpha runs on Windows 10/11 x64 only. macOS is not shipped in this release, and other platforms and GPU vendors have not been validated by the installed-build QA.

> **Gap:** This is an early alpha, not a production engine. Known problems in this build include editor drag latency above the 16.7 ms target, slow first imports (about 2.3 minutes for the Outpost sample's 115 imports in the team's test run), a slow first Build, and installers without Authenticode signing. [Install](/docs/manual/install) covers the signing warning.

## How this manual is organized

- **Start** gets you running: [Install](/docs/manual/install), [Your first project](/docs/manual/first-project) and [Connect an agent](/docs/manual/connect-an-agent).
- **Concepts** explains the model underneath: [Projects](/docs/manual/projects), [Documents and IDs](/docs/manual/documents-and-ids), [Entities and components](/docs/manual/entities-and-components), [Commands and transactions](/docs/manual/commands-and-transactions), [Review and undo](/docs/manual/review-and-undo), [Diagnostics](/docs/manual/diagnostics) and [Merging](/docs/manual/merging).
- **Agents** covers the [MCP server](/docs/manual/mcp-server) and [Sessions and scopes](/docs/manual/sessions-and-scopes).
- **Scripting** covers C# gameplay, starting at the [Scripting overview](/docs/manual/scripting-overview).
- **Reference** is generated from the engine itself: every [component and type](/docs/reference/types/Transform), [command](/docs/reference/commands/entity.create), [Engine Protocol method](/docs/reference/methods/cmd.apply) and [diagnostic code](/docs/reference/errors/ARA1610). Your installed engine can generate the same pages for your project with `ara docs --llms`.

## Conventions in this manual

- Commands are shown as you would type them in PowerShell. `ara` accepts JSON arguments with or without quotes, so they work in other shells too.
- Output blocks come from a real 0.0.1-alpha install. IDs such as `e_qg8h` and `tx_n4r61zfz` are minted per project, so yours will differ.
- Units follow the engine: meters, seconds, kilograms and degrees, with Y up.
