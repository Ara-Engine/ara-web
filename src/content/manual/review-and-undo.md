---
title: Review and undo
description: How Ara records every change in history, and how to undo and redo your own edits, revert an agent's transaction or a single entity, and roll back a whole agent turn.
section: Concepts
order: 5
---

Agent edits in Ara apply immediately, like a teammate's. There is no approval queue to manage. Instead, every change lands in a shared history with its author and reason, and you can reverse any of it: your own last edit, one agent transaction, one entity's part of a transaction, or everything an agent did since a checkpoint.

## History

`ara history` lists transactions, newest first:

```powershell
ara history --limit 6
```

```text
tx_jw7dd14j r21 agent:codex accepted · Match the lamp post · 1 entities
tx_gfdntxea r20 human · Warmer · 1 entities
tx_96qqzm4w r19 human · undo entity.create · 1 entities
tx_nrbv0se9 r18 human · undo entity.create · 2 entities
tx_qt8nfzrg r17 human · Add a lamp post next to the crate · 2 entities
tx_1kzckrp3 r16 agent:manual-test reverted · Add a barrel · 1 entities
```

Each line shows the transaction ID, the revision it produced, the author, the review status for agent transactions, the `why` (or the command name when there is none) and how many entities it touched. Filter with `--doc <doc>`, `--by <author>` (for example `--by agent:codex`) and `--limit <n>`. Agents read the same list with `ara_session {"action": "history"}`.

History is kept in the project's `.ara/journal`, so it survives restarts. It's local to your machine; see [Projects](/docs/manual/projects).

## Undo and redo

`ara undo` reverses the latest transaction **by the current author**. Each author has their own undo stack, so your undo never reverses an agent's edit by accident, and an agent's undo never reverses yours:

```powershell
ara undo
```

```text
tx_nrbv0se9 reverting tx_qt8nfzrg (revision 18)
```

Undo doesn't delete the original transaction. It applies the inverse operations as a new transaction, so the undo is visible in history and can itself be undone. `ara redo` re-applies your most recently undone transaction. Making a new edit clears your redo stack.

To reverse a specific transaction, including another author's, pass its ID:

```powershell
ara undo tx_1kzckrp3
```

```text
tx_96qqzm4w reverting tx_1kzckrp3 (revision 19)
```

### When undo conflicts

Undo refuses to overwrite a field that a later transaction changed. Here, a human set a light's intensity and then Codex changed it again:

```text
error[ARA1502]: undo would overwrite `Light.intensity`, changed by `tx_jw7dd14j` (agent:codex) at revision 21
  --> sc_akzn9ftc · e_4chy · Light.intensity
```

Undo the later transaction first, or set the value you want directly. A transaction that was itself undone doesn't block: an edit and its undo cancel out. With nothing left to undo or redo, you get [ARA1505](/docs/reference/errors/ARA1505).

> **Gap:** `ara redo` from the command line only works while the editor or `ara serve` has the project open. Without a running owner, each `ara` call starts fresh and the redo stack isn't restored from the journal, so `ara redo` after an offline `ara undo` reports ARA1505.

## Undo an agent's turn

Each `ara_apply` call an agent makes is one **turn**, and the engine sets a **checkpoint** just before it. The result tells the agent how to roll it back:

```text
applied tx_nftqy71a to levels/main.scene (revision 26)
  created: e_e60e Barrel1, e_ra60 Barrel2
undo this turn: ara_session {"action": "rollback", "to": "cp_fqa7ag1s"}
```

Rolling back to a checkpoint undoes every transaction the session made after it, all or nothing:

```json
{"action": "rollback", "to": "cp_fqa7ag1s"}
```

```json
{
  "to": "cp_fqa7ag1s",
  "reverted": [
    "tx_wzvz7xfw",
    "tx_nftqy71a"
  ],
  "revision": 29
}
```

An agent can check what it changed before deciding. `ara_session {"action": "diff"}` lists each entity it touched since the session started (or since a given checkpoint), with the old and new value of each field:

```text
~ sc_akzn9ftc/e_4chy Light.intensity: 300 → 450; Transform.position.y: 3 → 4
```

Agents can also set their own checkpoints with `{"action": "checkpoint"}`. See [Sessions and scopes](/docs/manual/sessions-and-scopes).

In the editor, the **Agents** panel is an activity feed of agent turns. Use **Undo turn** on a turn to reverse it.

## Revert agent changes

`ara revert` reverses an agent's transaction, or only one entity's part of it, as a new, conflict-checked transaction. It works on any agent's changes, not just your own:

```powershell
ara revert tx_n4r61zfz                    # the whole transaction
ara revert tx_y6dskhef --entity e_yqk4    # only this entity's changes in it
```

```text
reverted tx_n4r61zfz: sc_s71pyyxe/e_8nz4
reverted tx_y6dskhef: sc_s71pyyxe/e_yqk4
```

The reverted transaction's status changes to `reverted` in history. Agents use `ara_session {"action": "revert", "txn": "tx_…"}`, with an optional `entity`.

> **Gap:** `ara revert --entity <entity>` without a transaction ID looks only at unreviewed transactions. Agent transactions are accepted as soon as they apply, so it finds nothing and reports [ARA1813](/docs/reference/errors/ARA1813). Pass the transaction ID as well.

## Review status

Agent transactions carry a review status: `accepted` when they apply, `reverted` after you revert them. Because agent changes apply immediately, the review list is normally empty:

```powershell
ara review     # agent transactions still awaiting review
ara accept --all
```

`ara accept` is kept for compatibility with older workflows. Accepting changes that are already accepted is harmless.

## When people and agents edit the same thing

Two safeguards work without blocking anyone:

- **Overwrite notices.** When an edit overwrites a field another participant changed recently (within ten minutes by default), the later edit wins and both participants get a notice ([ARA2503](/docs/reference/errors/ARA2503)). The earlier value is kept in a conflict log with both values. In the editor the notice offers to view the change.
- **Gesture safety.** If an agent's command touches a field you're dragging or typing in, only that field waits until your gesture ends, for at most two seconds. Everything else in the command applies at once.

To see who is working in a project, agents call `ara_session {"action": "who"}`, and you can run `ara hub activity`.
