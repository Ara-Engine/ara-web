---
title: Merging
description: How ara merge combines two versions of a scene or prefab record by record, how to use it as a git merge driver, and how to settle conflicts with ara resolve.
section: Concepts
order: 7
---

Because scenes and prefabs are canonical JSON with one record per entity, Ara can merge them by meaning instead of by line. `ara merge` performs a three-way merge of a document, record by record and field by field. When both sides changed the same value differently, it keeps a valid file and records the conflict for `ara resolve` to settle.

## Set up git

`ara init` writes a `.gitattributes` that sends scenes and prefabs through Ara's merge driver:

```text
# Ara documents merge record by record (`ara merge`).
*.scene merge=ara
*.prefab merge=ara
* text=auto eol=lf
```

Git also needs to know what the `ara` driver runs. If you ran `ara init` inside a git work tree, it configured this for you, adding `--root` when the project lives in a subfolder of the repository. Otherwise, run the command `ara init` printed:

```powershell
git config merge.ara.driver "ara merge %O %A %B"
```

Git passes the common ancestor (`%O`), your version (`%A`) and their version (`%B`). `ara merge` writes the result over your version and exits with code 1 if conflicts remain, which git treats as a conflicted merge.

> **Note:** The driver runs `ara` by name, so `ara` must be on the `PATH` of whatever runs git, including GUI clients.

## How the merge decides

`ara merge` compares the three versions record by record, then key by key inside each record:

- **Only one side changed a value**: that side wins.
- **Both sides made the same change**: fine.
- **Both sides changed it differently**: conflict.
- **Arrays and single values are atomic.** A `vec3` position, a list of IDs or a prefab's `removed` list merges as a whole, not element by element.
- **One side deleted a record the other changed**: the changed record is kept, and the deletion is reported as a conflict. Deleting a record the other side didn't touch just deletes it.
- **After merging, the hierarchy is checked.** A parent that no longer exists, a parent loop or a root-count problem becomes a conflict on `parent`.
- Sibling order keys created on both branches may collide. That isn't a conflict; ties are sorted by ID.

Two people moving different entities, adding different children, or tuning different fields of the same component merge cleanly:

```text
merged into levels/main.scene: 0 conflicts
```

## Run a merge by hand

```powershell
ara merge base.scene levels/main.scene theirs.scene            # result over levels/main.scene
ara merge base.scene ours.scene theirs.scene -o merged.scene   # result into a new file
```

All three files must be versions of the same document; otherwise you get [ARA1702](/docs/reference/errors/ARA1702).

## Conflicts

Here both sides changed a light's intensity:

```powershell
ara merge base.scene levels/merged.scene theirs.scene
```

```text
error[ARA1701]: both sides changed this differently (kept ours)
  --> levels/merged.scene · e_lamp · Light.intensity

merged into levels/merged.scene: 1 conflicts
```

The output keeps your value and lists each conflict in a `$conflicts` array, so the file stays strict JSON:

```json
{
  "$schema": "ara://schema/scene/1",
  "id": "sc_s71pyyxe",
  "$conflicts": [
    {
      "record": "e_lamp",
      "path": "Light.intensity",
      "base": 800,
      "ours": 500,
      "theirs": 1200,
      "reason": "both sides changed this differently (kept ours)"
    }
  ],
  "records": {
    "e_crt1": {
      "name": "Crate",
      "order": "a1",
      "Transform": {
        "position": [4, 0, 3]
      }
    },
    "e_lamp": {
      "name": "Lamp",
      "order": "a0",
      "Light": {
        "intensity": 500
      }
    }
  }
}
```

The non-conflicting change from the other side, the crate's new position, merged normally. Until the conflicts are settled, reading the file reports [ARA1209](/docs/reference/errors/ARA1209) with one fix per side, and `ara fmt` won't erase the `$conflicts` entries:

```text
error[ARA1209]: unresolved merge conflict; pick a side with `ara resolve` (or set the value and delete the `$conflicts` entry)
  --> levels/merged.scene · e_lamp · Light.intensity
  = fix: Keep ours (500)
  = fix: Keep theirs (1200)
```

`ara inspect` also flags unresolved conflicts in a scene, with the `ara resolve` hint.

## Resolve conflicts

`ara resolve` settles the conflicts in one file. Pick a side per conflict with `--pick <record>:<path>=ours|theirs|base`, or per record with `--pick <record>=…`:

```powershell
ara resolve levels/merged.scene --pick e_lamp:Light.intensity=theirs
```

```text
e_lamp:Light.intensity: kept theirs
levels/merged.scene: 1 resolved, 0 left
```

To take one side for every conflict you didn't pick, add `--ours` or `--theirs`. When the other side deleted a record you changed, `--theirs` removes the record:

```text
e_lamp: kept theirs
out.scene: 1 resolved, 0 left
```

You can also edit the file directly: set the value you want and delete its entry from `$conflicts`. `ara resolve` exits with code 1 while conflicts are left.

## After resolving

```powershell
ara check levels/merged.scene
ara fmt levels/merged.scene
```

`ara merge` works on the three files git hands it, without the project's asset index, so it never rewrites references. Run `ara check` to validate the result and `ara fmt` to canonicalize it and repair any stale `@path#id` references. Then mark the file resolved in git as usual.

> **Note:** The `.gitattributes` that `ara init` writes routes only `.scene` and `.prefab` files through the Ara driver. Other document kinds, such as materials, terrain or UI, use git's normal text merge.
