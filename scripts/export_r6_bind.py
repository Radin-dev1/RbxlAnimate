import bpy
import os
import sys

out_path = sys.argv[sys.argv.index("--") + 1]

def remove_obj(obj):
    bpy.data.objects.remove(obj, do_unlink=True)

arm = bpy.data.objects["InternalArmature"]
mesh_map = {
    "Head_MBlocky": "Head",
    "Torso_MBlocky": "Torso",
    "Left Arm_MBlocky": "LeftArm",
    "Right Arm_MBlocky": "RightArm",
    "Left Leg_MBlocky": "LeftLeg",
    "Right Leg_MBlocky": "RightLeg",
}

# Keep only what we need
keep = {arm.name, *mesh_map}
for o in list(bpy.data.objects):
    if o.name not in keep:
        try: remove_obj(o)
        except: pass
for img in list(bpy.data.images):
    try: bpy.data.images.remove(img)
    except: pass

# Ensure in scene collection / view layer
sc = bpy.context.scene.collection
for o in list(bpy.data.objects):
    for c in list(o.users_collection):
        c.objects.unlink(o)
    sc.objects.link(o)
    o.hide_set(False); o.hide_viewport=False; o.hide_render=False

# Rename bones (edit mode)
bpy.context.view_layer.objects.active = arm
arm.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
for old,new in [("Left Arm","LeftArm"),("Right Arm","RightArm"),("Left Leg","LeftLeg"),("Right Leg","RightLeg")]:
    if old in arm.data.edit_bones:
        arm.data.edit_bones[old].name = new
bpy.ops.object.mode_set(mode='OBJECT')
for b in arm.data.bones:
    b.use_deform = True

def mat(obj, color):
    m = bpy.data.materials.new("M_"+obj.name)
    m.use_nodes = True
    nodes=m.node_tree.nodes; links=m.node_tree.links
    nodes.clear()
    out=nodes.new("ShaderNodeOutputMaterial"); bsdf=nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value=(*color,1)
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    obj.data.materials.clear(); obj.data.materials.append(m)

colors = {
    "Head":(0.95,0.88,0.75),
    "Torso":(0.88,0.05,0.05),
    "LeftArm":(0.92,0.85,0.72),
    "RightArm":(0.92,0.85,0.72),
    "LeftLeg":(0.12,0.12,0.14),
    "RightLeg":(0.12,0.12,0.14),
}

meshes=[]
for src, dst in mesh_map.items():
    obj = bpy.data.objects[src]
    obj.name = dst
    mat(obj, colors[dst])
    # Apply visual transform so verts sit in world space
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    obj.vertex_groups.clear()
    for m in list(obj.modifiers):
        obj.modifiers.remove(m)
    vg = obj.vertex_groups.new(name=dst)
    vg.add([v.index for v in obj.data.vertices], 1.0, 'REPLACE')
    meshes.append(obj)
    print(dst, "bbox after apply", [tuple(round(x,3) for x in obj.bound_box[i]) for i in (0,6)])

# Parent with armature (names) — sets up bind correctly
bpy.ops.object.select_all(action='DESELECT')
for obj in meshes:
    obj.select_set(True)
arm.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.parent_set(type='ARMATURE_NAME')

arm.name = "R6Armature"
print("children", [c.name for c in arm.children])
for obj in meshes:
    print(obj.name, "parent", obj.parent, "mods", [(m.type, getattr(m,'object',None)) for m in obj.modifiers], "vg", [g.name for g in obj.vertex_groups])

# Delete non deform leftovers if any
for o in list(bpy.data.objects):
    if o != arm and o not in meshes:
        remove_obj(o)

os.makedirs(os.path.dirname(out_path), exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(
    filepath=out_path,
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
print("SIZE", os.path.getsize(out_path))
