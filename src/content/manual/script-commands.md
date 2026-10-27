---
title: Script commands
description: Define named gameplay actions with [Command], validate and reject calls through CommandContext, and run them in Play from agents and tools.
section: Scripting
order: 8
---

A script command is a named gameplay action, such as `game.UseMedkit`, that code outside your scripts can call with JSON parameters. Agents use commands to drive a running game, and the engine records each call so replays repeat it.

A command runs synchronously, with exclusive access to the world. It either succeeds, and everything it wrote is kept as one step, or it is rejected and the world is left unchanged.

Script commands act on the running game. To edit scenes and other documents, the engine has its own commands; see [Commands and transactions](/docs/manual/commands-and-transactions).

## A first command

This command, adapted from the Outpost sample, uses a medkit:

```csharp
namespace MyGame;

/// <summary>Health and healing supplies of a survivor.</summary>
[Component]
public partial struct Vitality
{
    /// <summary>Hit points; 0 is downed.</summary>
    [Range(0, 100), Replicate(Audience.Relevant)] public ushort Hp;

    /// <summary>Medkits carried.</summary>
    [Range(0, 9), Replicate(Audience.Owner)] public byte Medkits;
}

/// <summary>Played when a survivor uses a medkit.</summary>
[Cue]
public partial struct MedkitUsed
{
    /// <summary>Who healed.</summary>
    public Entity Actor;
}

/// <summary>Uses one medkit: +25 hit points, up to 100.</summary>
[Command("game.UseMedkit"), Expose(ExecuteOn.Authority, Caller.Owner, RatePerSecond = 2)]
[Example("{\"actor\": \"0v0\"}")]
public static partial class UseMedkit
{
    /// <summary>Heals <paramref name="actor"/> if it is hurt and has a medkit.</summary>
    /// <param name="ctx">The command context.</param>
    /// <param name="actor">The survivor using the medkit.</param>
    /// <param name="v">The survivor's vitality.</param>
    public static CommandResult Execute(ref CommandContext ctx, Entity actor, ref Vitality v)
    {
        if (v.Hp == 100 || v.Medkits == 0) return ctx.Reject("cannot_heal");
        v.Medkits--;
        v.Hp = (ushort)Math.Min(100, v.Hp + 25);
        ctx.Cue(new MedkitUsed { Actor = actor });
        return CommandResult.Ok;
    }
}
```

## The shape of a command

Mark a `static partial class` with [`[Command("game.Name")]`](/docs/scripting/CommandAttribute) and give it one method:

```text
public static CommandResult Execute(ref CommandContext ctx, Entity target, ref C component, ...)
```

Anything else is an error ([ARA0705](/docs/reference/errors/ARA0705)). The name is how callers find the command; it defaults to the class name. Use a stable, namespaced name such as `game.UseMedkit`.

After `ctx`, the parameters are of three kinds:

| Parameter | Meaning |
|---|---|
| `Entity` | An entity the caller passes. The first `Entity` parameter is the command's target. |
| `ref C` or `in C` | A component of the target, bound by the engine, for writing or reading. It must come after the target ([ARA0705](/docs/reference/errors/ARA0705)). |
| Any other parameter | A value the caller passes: a number, `bool`, vector, `Entity`, enum or struct, as for component fields. A C# default value makes it optional. |

The caller passes every `Entity` and plain parameter as a JSON field with the camelCase parameter name: `{"actor": ...}`. The engine registers these fields as a params type named after the class, such as `UseMedkitParams`, so tools can validate calls.

If the target lacks a component parameter, the engine rejects the call with the reason `missing_<Component>`, such as `missing_Vitality`.

Document the class (or `Execute`) with a `/// <summary>` and every parameter with `/// <param>` ([ARA0703](/docs/reference/errors/ARA0703)). Agents read these descriptions to decide how to call the command.

## The command context

[`CommandContext`](/docs/scripting/CommandContext) is what a command sees:

| Member | Use |
|---|---|
| `ctx.Tick` | The current tick. |
| `ctx.Caller` | The calling entity, or `Entity.Null` when a tool or agent calls the command. |
| `ctx.Rng` | Deterministic random numbers for this call. |
| `ctx.Commands` | Structural changes, applied only if the command succeeds. |
| `ctx.Cue(value)` | Emits a cue, kept only if the command succeeds. |
| `ctx.Reject("reason")` | Returns a rejection. |

`CommandContext` is a `ref struct`, so you can't store it or capture it in a lambda. Commands may also use [`World`](/docs/manual/world-and-entities) to reach other entities and resources.

## Succeeding and rejecting

Return `CommandResult.Ok` to keep everything the command did. Return `ctx.Reject("reason")` to refuse the call: the engine restores every component and resource the command changed and discards its structural changes and cues. Use a short, machine-readable reason, such as `cannot_heal`. The engine keeps at most 64 bytes of it.

This command has an optional parameter and reads a resource:

```csharp
namespace MyGame;

/// <summary>Adds points to the round score.</summary>
[Command("game.AddScore"), Expose(ExecuteOn.Authority, Caller.Authority)]
[Example("{\"scorer\": \"0v0\", \"points\": 5}")]
public static partial class AddScore
{
    /// <summary>Adds <paramref name="points"/> for <paramref name="scorer"/>; refuses non-positive amounts.</summary>
    /// <param name="ctx">The command context.</param>
    /// <param name="scorer">Who scored.</param>
    /// <param name="health">The scorer's health: downed entities can't score.</param>
    /// <param name="points">Points to add.</param>
    public static CommandResult Execute(ref CommandContext ctx, Entity scorer, in Health health, int points = 1)
    {
        if (points <= 0) return ctx.Reject("bad_points");
        if (health.Hp == 0f) return ctx.Reject("downed");
        World.Resource<Round>().Score += points;
        ctx.Cue(new PickedUp { By = scorer });
        return CommandResult.Ok;
    }
}
```

## Examples and exposure

[`[Example("...")]`](/docs/scripting/ExampleAttribute) adds a sample params object, as JSON, to the command's documentation. Agents see it next to the params schema. You can add several.

[`[Expose(executeOn, caller)]`](/docs/scripting/ExposeAttribute) declares how the command behaves in networked play:

| Setting | Values |
|---|---|
| `ExecuteOn` | `Authority`: runs on the server or host after validation. `Predicted`: runs on the owning client first, then is confirmed by the authority. |
| `Caller` | `Any` connected client, only the target's `Owner`, or only the `Authority` itself (tools, scripts, agents). |
| `RatePerSecond` | Per-caller rate limit; `0` means unlimited. |

## Calling a command

Commands run in a running Play world, between ticks. Over MCP, the `ara_play` tool lists them with the action `commands` (each with its params schema, examples, and the components it reads and writes) and runs one with the action `command`:

```json
{ "action": "command", "name": "game.UseMedkit", "params": { "actor": "e_fox" } }
```

Entity parameters accept document IDs such as `e_fox`. By default the call goes to the most recent Play world; pass `world` to pick another. The result lists what the command did: every component it set, with values before and after, every spawn, despawn, insert and remove, and its cues.

The engine records the call with the next tick, so a recording replays it exactly.

When a call fails, you get one of these diagnostics:

| Code | Meaning |
|---|---|
| [ARA0950](/docs/reference/errors/ARA0950) | No command with that name is loaded. |
| [ARA0951](/docs/reference/errors/ARA0951) | The params don't match the params type, or a value is out of range. |
| [ARA0952](/docs/reference/errors/ARA0952) | The command rejected the call; the message includes your reason. |
| [ARA0912](/docs/reference/errors/ARA0912) | The command threw. The call is rolled back and the command is disabled until the next reload. |

## Rules for command code

- Keep commands synchronous and self-contained. They capture no managed state, which makes them safe to re-run for prediction and replays. In `[Simulation]` code, a lambda that captures a variable is an error ([ARA0200](/docs/reference/errors/ARA0200)).
- `Execute` runs on the tick path, so avoid allocations ([ARA0300](/docs/reference/errors/ARA0300)).
- Use `ctx.Rng`, never `System.Random`.
