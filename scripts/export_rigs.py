"""Export clean R15/R6 character GLBs for rbxlAnimate web preview."""
import bpy
import sys
from pathlib import Path


def set_visible(obj, visible: bool):
    obj.hide_viewport = not visible
    obj.hide_render = not visible
    try:
        if obj.name in bpy.context.view_layer.objects:
            obj.hide_set(not visible)
    except Exception:
        pass


def export_visible(path: str):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    kwargs = dict(
        filepath=str(path),
        export_format="GLB",
        export_animations=False,
        export_skins=True,
        export_morph=False,
        export_apply=False,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_yup=True,
        use_selection=False,
    )
    try:
        bpy.ops.export_scene.gltf(use_visible=True, **kwargs)
    except TypeError:
        bpy.ops.export_scene.gltf(**kwargs)


def export_r15(out_path: str):
    body = {
        "Head",
        "UpperTorso",
        "LowerTorso",
        "LeftUpperArm",
        "LeftLowerArm",
        "LeftHand",
        "RightUpperArm",
        "RightLowerArm",
        "RightHand",
        "LeftUpperLeg",
        "LeftLowerLeg",
        "LeftFoot",
        "RightUpperLeg",
        "RightLowerLeg",
        "RightFoot",
        "Roblox_R15",
    }

    for obj in list(bpy.data.objects):
        if obj.name.startswith("WGT"):
            bpy.data.objects.remove(obj, do_unlink=True)

    for obj in bpy.data.objects:
        set_visible(obj, obj.name in body)

    missing = [n for n in body if n != "Roblox_R15" and bpy.data.objects.get(n) is None]
    if missing:
        raise RuntimeError(f"Missing R15 meshes: {missing}")
    if bpy.data.objects.get("Roblox_R15") is None:
        raise RuntimeError("Missing Roblox_R15")

    export_visible(out_path)
    print("EXPORTED r15 ok")


def export_r6(out_path: str):
    """Classic male blocky R6 — parent each part to InternalArmature bones."""
    part_to_bone = {
        "Head_MBlocky": "Head",
        "Torso_MBlocky": "Torso",
        "Left Arm_MBlocky": "Left Arm",
        "Right Arm_MBlocky": "Right Arm",
        "Left Leg_MBlocky": "Left Leg",
        "Right Leg_MBlocky": "Right Leg",
    }
    arm = bpy.data.objects.get("InternalArmature")
    if arm is None:
        raise RuntimeError("Missing InternalArmature")

    keep = set(part_to_bone.keys()) | {"InternalArmature"}

    for obj in bpy.data.objects:
        set_visible(obj, obj.name in keep)

    for mesh_name, bone_name in part_to_bone.items():
        obj = bpy.data.objects.get(mesh_name)
        if obj is None:
            raise RuntimeError(f"Missing R6 mesh {mesh_name}")
        if bone_name not in arm.data.bones:
            raise RuntimeError(f"Missing bone {bone_name}")

        # Clear old armature mods
        for mod in list(obj.modifiers):
            if mod.type == "ARMATURE":
                obj.modifiers.remove(mod)

        # Parent to bone so glTF exports a skinned/hierarchical rig
        mw = obj.matrix_world.copy()
        obj.parent = arm
        obj.parent_type = "BONE"
        obj.parent_bone = bone_name
        obj.matrix_world = mw

        set_visible(obj, True)

    set_visible(arm, True)
    export_visible(out_path)
    print("EXPORTED r6 ok bones=", list(part_to_bone.values()))


def main():
    args = sys.argv[sys.argv.index("--") + 1 :]
    blend_path, out_path, mode = args[0], args[1], args[2]
    bpy.ops.wm.open_mainfile(filepath=blend_path)
    if mode == "r15":
        export_r15(out_path)
    elif mode == "r6":
        export_r6(out_path)
    else:
        raise RuntimeError("mode must be r15 or r6")


if __name__ == "__main__":
    main()
