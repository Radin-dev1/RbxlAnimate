# rbxlAnimate Studio Plugin

Import `.rbxlAnimate.json` (or pasted JSON) onto a selected **R15** character as a real `KeyframeSequence` under `AnimSaves`.

## Install (local plugin)

1. In Roblox Studio: **Plugins → Plugins Folder** (opens your local plugins directory).
2. Copy `RbxlAnimate.plugin.luau` into that folder.
3. Restart Studio (or reload plugins).
4. Toolbar → **rbxlAnimate → Importer**.

## Use

1. On the website, generate an animation → **Copy for Studio** (or Download JSON).
2. In Studio, select an R15 model (must have a Humanoid).
3. Paste JSON into the importer (or **Import .json file…**).
4. Click **Apply to selected R15**.
5. Open the **Animation Editor**, select the character, and load the sequence from **AnimSaves**.

## Format

`rbxlAnimate.keyframesequence.v1` — joint orientations in degrees + optional Root position for hops/flips. Poses are written as a full R15 hierarchy (`HumanoidRootPart` → `LowerTorso` → …) so the Animation Editor can edit them.

## Notes

- Website export is the source of truth; this plugin does not call a cloud API yet.
- R6 is not supported on the live site (R15 only).
- OAuth / cloud library / generate-from-Studio are still future work.
