"""Export lightweight R6/R15 preview GLBs for the web maker.

R6: InternalArmature + MBlocky parts, bone-parented (no 100+ control bones).
R15: only the 16 Roblox deform bones + body meshes, bone-parented (strip IK/FK/MCH).
"""
from __future__ import annotations

import os
import sys

import bpy
from mathutils import Vector

R6_BLEND = r"C:\Users\kazem\Downloads\Blender R6.blend"
R15_BLEND = r"C:\Users\kazem\Downloads\MrXen0_R15RIG_v1.2.blend"
OUT_DIR = r"C:\Users\kazem\Projects\RbxlAnimate\public\rigs"

R6_PART_TO_BONE = {
    "Head_MBlocky": "Head",
    "Torso_MBlocky": "Torso",
    "Left Arm_MBlocky": "Left Arm",
    "Right Arm_MBlocky": "Right Arm",
    "Left Leg_MBlocky": "Left Leg",
    "Right Leg_MBlocky": "Right Leg",
}

R15_BONES = {
    "HumanoidRootPart",
    "LowerTorso",
    "UpperTorso",
    "Head",
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
}

R15_MESHES = [
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
]

R6_COLORS = {
    "Head_MBlocky": (0.95, 0.88, 0.75, 1),
    "Torso_MBlocky": (0.88, 0.05, 0.05, 1),
    "Left Arm_MBlocky": (0.92, 0.85, 0.72, 1),
    "Right Arm_MBlocky": (0.92, 0.85, 0.72, 1),
    "Left Leg_MBlocky": (0.12, 0.12, 0.14, 1),
    "Right Leg_MBlocky": (0.12, 0.12, 0.14, 1),
}

R15_COLORS = {
    "Head": (0.95, 0.88, 0.75, 1),
    "UpperTorso": (0.88, 0.05, 0.05, 1),
    "LowerTorso": (0.55, 0.05, 0.05, 1),
    "LeftUpperArm": (0.92, 0.85, 0.72, 1),
    "LeftLowerArm": (0.92, 0.85, 0.72, 1),
    "LeftHand": (0.95, 0.88, 0.75, 1),
    "RightUpperArm": (0.92, 0.85, 0.72, 1),
    "RightLowerArm": (0.92, 0.85, 0.72, 1),
    "RightHand": (0.95, 0.88, 0.75, 1),
    "LeftUpperLeg": (0.12, 0.12, 0.14, 1),
    "LeftLowerLeg": (0.12, 0.12, 0.14, 1),
    "LeftFoot": (0.08, 0.08, 0.1, 1),
    "RightUpperLeg": (0.12, 0.12, 0.14, 1),
    "RightLowerLeg": (0.12, 0.12, 0.14, 1),
    "RightFoot": (0.08, 0.08, 0.1, 1),
}


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def assign_color(obj, rgba):
    mat = bpy.data.materials.new(f"M_{obj.name}")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = rgba
    bsdf.inputs["Roughness"].default_value = 0.55
    bsdf.inputs["Metallic"].default_value = 0.08
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    obj.data.materials.clear()
    obj.data.materials.append(mat)


def parent_to_bone(obj, arm, bone_name):
    for mod in list(obj.modifiers):
        obj.modifiers.remove(mod)
    obj.vertex_groups.clear()
    if obj.data.shape_keys:
        obj.shape_key_clear()
    mw = obj.matrix_world.copy()
    obj.parent = arm
    obj.parent_type = "BONE"
    obj.parent_bone = bone_name
    obj.matrix_world = mw


def export_glb(path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=False,
        export_apply=False,
        export_texcoords=False,
        export_normals=True,
        export_materials="EXPORT",
        export_animations=False,
        export_skins=True,
        export_morph=False,
        export_yup=True,
    )
    print("WROTE", path, os.path.getsize(path))


def export_r6():
    clear_scene()
    keep_names = set(R6_PART_TO_BONE) | {"InternalArmature"}
    with bpy.data.libraries.load(R6_BLEND, link=False) as (data_from, data_to):
        data_to.objects = [n for n in keep_names if n in set(data_from.objects)]

    sc = bpy.context.scene.collection
    for obj in data_to.objects:
        if obj is not None:
            sc.objects.link(obj)

    arm = bpy.data.objects.get("InternalArmature")
    if arm is None:
        raise RuntimeError("InternalArmature missing")
    arm.hide_set(False)
    arm.hide_viewport = False
    arm.hide_render = False
    arm.name = "R6"

    for mesh_name, bone_name in R6_PART_TO_BONE.items():
        obj = bpy.data.objects.get(mesh_name)
        if obj is None:
            raise RuntimeError(f"Missing {mesh_name}")
        if bone_name not in arm.data.bones:
            raise RuntimeError(f"Missing bone {bone_name}")
        assign_color(obj, R6_COLORS[mesh_name])
        parent_to_bone(obj, arm, bone_name)
        print("R6 parented", mesh_name, "->", bone_name)

    # Drop anything else that snuck in
    keep = {"R6", *R6_PART_TO_BONE.keys()}
    for o in list(bpy.data.objects):
        if o.name not in keep:
            bpy.data.objects.remove(o, do_unlink=True)

    print("R6 bones", [b.name for b in arm.data.bones])
    export_glb(os.path.join(OUT_DIR, "r6.glb"))


def export_r15():
    clear_scene()
    bpy.ops.wm.open_mainfile(filepath=R15_BLEND)

    arm = bpy.data.objects.get("Roblox_R15")
    if arm is None:
        raise RuntimeError("Roblox_R15 missing")

    keep = {"Roblox_R15", *R15_MESHES}
    for o in list(bpy.data.objects):
        if o.name not in keep:
            bpy.data.objects.remove(o, do_unlink=True)

    # Drop pose constraints that reference control bones we're about to delete
    for pb in arm.pose.bones:
        for c in list(pb.constraints):
            pb.constraints.remove(c)

    # Strip control bones; keep only deform hierarchy
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="EDIT")
    eb = arm.data.edit_bones
    for _ in range(200):
        removed = False
        for b in list(eb):
            if b.name not in R15_BONES:
                eb.remove(b)
                removed = True
        if not removed:
            break
    bpy.ops.object.mode_set(mode="OBJECT")

    missing = [n for n in R15_BONES if n not in arm.data.bones]
    if missing:
        raise RuntimeError(f"R15 bones missing after trim: {missing}")

    for name in R15_MESHES:
        obj = bpy.data.objects.get(name)
        if obj is None:
            raise RuntimeError(f"Missing mesh {name}")
        obj.hide_set(False)
        assign_color(obj, R15_COLORS[name])
        # Bone name matches mesh name for body parts; Root has no mesh
        bone = name if name in arm.data.bones else None
        if bone is None:
            raise RuntimeError(f"No bone for mesh {name}")
        parent_to_bone(obj, arm, bone)
        print("R15 parented", name, "->", bone)

    arm.name = "R15"
    # Remove leftover images / heavy datablocks
    for img in list(bpy.data.images):
        bpy.data.images.remove(img)

    print("R15 bones", [b.name for b in arm.data.bones])
    print("R15 objs", [o.name for o in bpy.data.objects])
    export_glb(os.path.join(OUT_DIR, "r15.glb"))


def main():
    mode = "both"
    if "--" in sys.argv:
        args = sys.argv[sys.argv.index("--") + 1 :]
        if args:
            mode = args[0]
    if mode in ("r6", "both"):
        export_r6()
    if mode in ("r15", "both"):
        export_r15()


if __name__ == "__main__":
    main()
