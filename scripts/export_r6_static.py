"""Export R6 blocky meshes as a static positioned GLB (no skins)."""
import bpy
import os
import sys
from mathutils import Vector

out = sys.argv[sys.argv.index("--") + 1]
src = r"C:\Users\kazem\Downloads\Blender R6.blend"
bpy.ops.wm.read_factory_settings(use_empty=True)

names = [
    "Head_MBlocky",
    "Torso_MBlocky",
    "Left Arm_MBlocky",
    "Right Arm_MBlocky",
    "Left Leg_MBlocky",
    "Right Leg_MBlocky",
]
with bpy.data.libraries.load(src, link=False) as (df, dt):
    dt.objects = [n for n in names if n in df.objects]

for obj in dt.objects:
    if obj:
        bpy.context.scene.collection.objects.link(obj)

rename = {
    "Head_MBlocky": "Head",
    "Torso_MBlocky": "Torso",
    "Left Arm_MBlocky": "LeftArm",
    "Right Arm_MBlocky": "RightArm",
    "Left Leg_MBlocky": "LeftLeg",
    "Right Leg_MBlocky": "RightLeg",
}
colors = {
    "Head": (0.95, 0.88, 0.75),
    "Torso": (0.88, 0.05, 0.05),
    "LeftArm": (0.92, 0.85, 0.72),
    "RightArm": (0.92, 0.85, 0.72),
    "LeftLeg": (0.12, 0.12, 0.14),
    "RightLeg": (0.12, 0.12, 0.14),
}

keep = []
for src_name, dst in rename.items():
    obj = bpy.data.objects.get(src_name)
    if not obj:
        print("MISSING", src_name)
        continue
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    obj.name = dst
    m = bpy.data.materials.new("M_" + dst)
    m.use_nodes = True
    n = m.node_tree.nodes
    l = m.node_tree.links
    n.clear()
    o = n.new("ShaderNodeOutputMaterial")
    b = n.new("ShaderNodeBsdfPrincipled")
    b.inputs["Base Color"].default_value = (*colors[dst], 1)
    l.new(b.outputs["BSDF"], o.inputs["Surface"])
    obj.data.materials.clear()
    obj.data.materials.append(m)
    keep.append(obj)
    print(dst, "verts", len(obj.data.vertices), "dim", tuple(round(x, 3) for x in obj.dimensions))

for o in list(bpy.data.objects):
    if o not in keep:
        bpy.data.objects.remove(o, do_unlink=True)

bpy.ops.object.select_all(action="SELECT")
print("export objs", [o.name for o in bpy.data.objects])
os.makedirs(os.path.dirname(out), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=out,
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_texcoords=False,
    export_normals=True,
    export_materials="EXPORT",
    export_animations=False,
    export_skins=False,
    export_yup=True,
)
print("SIZE", os.path.getsize(out))
