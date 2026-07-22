"""Re-export R6 with bone parenting (rigid parts) + clean R15."""
import bpy
import sys
import os

argv = sys.argv
args = argv[argv.index("--") + 1:] if "--" in argv else []
mode = args[0].lower()
out_path = args[1]

def ensure_object_mode():
    if bpy.ops.object.mode_set.poll():
        try:
            bpy.ops.object.mode_set(mode='OBJECT')
        except Exception:
            pass

def unlink_and_remove(obj):
    try:
        bpy.data.objects.remove(obj, do_unlink=True)
    except Exception as e:
        print("remove fail", obj.name, e)

def flat_mat(obj, color):
    mat = bpy.data.materials.new(f"Mat_{obj.name}")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    if "Roughness" in bsdf.inputs:
        bsdf.inputs["Roughness"].default_value = 0.55
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    obj.data.materials.clear()
    obj.data.materials.append(mat)

def strip_bones(arm, keep):
    ensure_object_mode()
    bpy.context.view_layer.objects.active = arm
    arm.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm.data.edit_bones
    for _ in range(100):
        removed = False
        for b in list(eb):
            if b.name not in keep:
                eb.remove(b)
                removed = True
        if not removed:
            break
    bpy.ops.object.mode_set(mode='OBJECT')
    print("bones:", [b.name for b in arm.data.bones])

def export_selected(filepath, objs):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.hide_set(False)
        o.hide_viewport = False
        o.hide_render = False
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        use_selection=True,
        export_apply=False,
        export_texcoords=False,
        export_normals=True,
        export_materials='EXPORT',
        export_animations=False,
        export_skins=True,
        export_yup=True,
    )
    print("Exported", filepath, os.path.getsize(filepath), "bytes")

def do_r6():
    arm = bpy.data.objects.get("InternalArmature")
    if not arm:
        raise RuntimeError("no InternalArmature")
    mesh_map = {
        "Head_MBlocky": "Head",
        "Torso_MBlocky": "Torso",
        "Left Arm_MBlocky": "Left Arm",
        "Right Arm_MBlocky": "Right Arm",
        "Left Leg_MBlocky": "Left Leg",
        "Right Leg_MBlocky": "Right Leg",
    }
    keep = {arm.name, *mesh_map}
    for obj in list(bpy.data.objects):
        if obj.name not in keep:
            unlink_and_remove(obj)
    for img in list(bpy.data.images):
        bpy.data.images.remove(img)

    arm.hide_set(False)
    arm.hide_viewport = False
    # Rename bones to web-friendly (no spaces) BEFORE parenting
    ensure_object_mode()
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT')
    rename = {
        "HumanoidRootPart": "HumanoidRootPart",
        "Torso": "Torso",
        "Head": "Head",
        "Left Arm": "LeftArm",
        "Right Arm": "RightArm",
        "Left Leg": "LeftLeg",
        "Right Leg": "RightLeg",
    }
    for old, new in rename.items():
        if old in arm.data.edit_bones:
            arm.data.edit_bones[old].name = new
    bpy.ops.object.mode_set(mode='OBJECT')

    keep_bones = set(rename.values())
    strip_bones(arm, keep_bones)

    colors = {
        "Head": (0.95, 0.88, 0.75),
        "Torso": (0.88, 0.05, 0.05),
        "LeftArm": (0.92, 0.85, 0.72),
        "RightArm": (0.92, 0.85, 0.72),
        "LeftLeg": (0.12, 0.12, 0.14),
        "RightLeg": (0.12, 0.12, 0.14),
    }
    bone_for = {
        "Head_MBlocky": "Head",
        "Torso_MBlocky": "Torso",
        "Left Arm_MBlocky": "LeftArm",
        "Right Arm_MBlocky": "RightArm",
        "Left Leg_MBlocky": "LeftLeg",
        "Right Leg_MBlocky": "RightLeg",
    }

    meshes = []
    for mesh_name, bone_name in bone_for.items():
        obj = bpy.data.objects.get(mesh_name)
        if not obj:
            print("missing", mesh_name)
            continue
        obj.hide_set(False)
        obj.name = bone_name
        flat_mat(obj, colors[bone_name])
        # Clear old parenting/mods
        obj.parent = None
        for m in list(obj.modifiers):
            obj.modifiers.remove(m)
        obj.vertex_groups.clear()
        # Skin to single bone
        vg = obj.vertex_groups.new(name=bone_name)
        vg.add([v.index for v in obj.data.vertices], 1.0, 'REPLACE')
        # Also add empty groups for other bones? not needed
        mod = obj.modifiers.new("Armature", 'ARMATURE')
        mod.object = arm
        obj.parent = arm
        obj.parent_type = 'OBJECT'
        meshes.append(obj)

    # Ensure armature is visible/exportable
    arm.name = "R6"
    print("arm bones after:", [b.name for b in arm.data.bones])
    print("arm users_collection", [c.name for c in arm.users_collection])
    export_selected(out_path, [arm] + meshes)

def do_r15():
    arm = bpy.data.objects.get("Roblox_R15")
    mesh_names = [
        "Head","UpperTorso","LowerTorso",
        "LeftUpperArm","LeftLowerArm","LeftHand",
        "RightUpperArm","RightLowerArm","RightHand",
        "LeftUpperLeg","LeftLowerLeg","LeftFoot",
        "RightUpperLeg","RightLowerLeg","RightFoot",
    ]
    keep = {arm.name, *mesh_names}
    for obj in list(bpy.data.objects):
        if obj.name not in keep:
            unlink_and_remove(obj)
    for img in list(bpy.data.images):
        bpy.data.images.remove(img)

    R15 = {
        "HumanoidRootPart","LowerTorso","UpperTorso","Head",
        "LeftUpperArm","LeftLowerArm","LeftHand",
        "RightUpperArm","RightLowerArm","RightHand",
        "LeftUpperLeg","LeftLowerLeg","LeftFoot",
        "RightUpperLeg","RightLowerLeg","RightFoot",
    }
    strip_bones(arm, R15)

    def color_for(n):
        if n == "Head" or "Hand" in n: return (0.95, 0.88, 0.75)
        if "Foot" in n: return (0.08, 0.08, 0.1)
        if "Leg" in n: return (0.12, 0.12, 0.14)
        if "Arm" in n: return (0.92, 0.85, 0.72)
        if n == "UpperTorso": return (0.88, 0.05, 0.05)
        if n == "LowerTorso": return (0.55, 0.05, 0.05)
        return (0.7, 0.7, 0.7)

    meshes = []
    for name in mesh_names:
        obj = bpy.data.objects.get(name)
        if not obj: continue
        obj.hide_set(False)
        flat_mat(obj, color_for(name))
        obj.parent = None
        for m in list(obj.modifiers):
            obj.modifiers.remove(m)
        obj.vertex_groups.clear()
        vg = obj.vertex_groups.new(name=name)
        vg.add([v.index for v in obj.data.vertices], 1.0, 'REPLACE')
        mod = obj.modifiers.new("Armature", 'ARMATURE')
        mod.object = arm
        obj.parent = arm
        obj.parent_type = 'OBJECT'
        meshes.append(obj)

    arm.name = "R15"
    export_selected(out_path, [arm] + meshes)

print("mode", mode)
if mode == "r6":
    do_r6()
else:
    do_r15()
print("DONE")
