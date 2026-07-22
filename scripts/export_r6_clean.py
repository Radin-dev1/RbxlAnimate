import bpy
import os
import sys
from mathutils import Vector

out_path = sys.argv[sys.argv.index("--") + 1]
src = r"C:\Users\kazem\Downloads\Blender R6.blend"

bpy.ops.wm.read_factory_settings(use_empty=True)

names = ["Head_MBlocky","Torso_MBlocky","Left Arm_MBlocky","Right Arm_MBlocky","Left Leg_MBlocky","Right Leg_MBlocky"]
with bpy.data.libraries.load(src, link=False) as (df, dt):
    dt.objects = [n for n in names if n in df.objects]

for obj in dt.objects:
    if obj is not None:
        bpy.context.scene.collection.objects.link(obj)
        print("linked", obj.name)

rename = {
    "Head_MBlocky":"Head",
    "Torso_MBlocky":"Torso",
    "Left Arm_MBlocky":"LeftArm",
    "Right Arm_MBlocky":"RightArm",
    "Left Leg_MBlocky":"LeftLeg",
    "Right Leg_MBlocky":"RightLeg",
}
colors = {
    "Head":(0.95,0.88,0.75),
    "Torso":(0.88,0.05,0.05),
    "LeftArm":(0.92,0.85,0.72),
    "RightArm":(0.92,0.85,0.72),
    "LeftLeg":(0.12,0.12,0.14),
    "RightLeg":(0.12,0.12,0.14),
}

def make_mat(obj, color):
    m = bpy.data.materials.new("M_"+obj.name)
    m.use_nodes = True
    n=m.node_tree.nodes; l=m.node_tree.links
    n.clear()
    out=n.new("ShaderNodeOutputMaterial"); b=n.new("ShaderNodeBsdfPrincipled")
    b.inputs["Base Color"].default_value=(*color,1.0)
    l.new(b.outputs["BSDF"], out.inputs["Surface"])
    obj.data.materials.clear(); obj.data.materials.append(m)

# Apply + rename first, keep references
mesh_objs = {}
for src_name, dst in rename.items():
    obj = bpy.data.objects.get(src_name)
    if not obj:
        print("MISSING", src_name); continue
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    obj.name = dst
    make_mat(obj, colors[dst])
    bb = [Vector(c) for c in obj.bound_box]
    center = sum(bb, Vector()) / 8.0
    mesh_objs[dst] = obj
    print(dst, "center", tuple(round(x,4) for x in center))

# Create armature (Z-up Blender)
bpy.ops.object.armature_add(enter_editmode=True, location=(0,0,0))
arm = bpy.context.object
arm.name = "R6Armature"
eb = arm.data.edit_bones
for b in list(eb):
    eb.remove(b)

def add_bone(name, head, parent=None, length=0.4):
    b = eb.new(name)
    h = Vector(head)
    b.head = h
    b.tail = h + Vector((0, 0, length))
    if parent:
        b.parent = eb[parent]
    return b

# centers from printed values (Z-up)
add_bone("HumanoidRootPart", (0, 0, 2.0), None, 0.25)
add_bone("Torso", (0, 0, 3.0), "HumanoidRootPart", 0.4)
add_bone("Head", (0, 0, 4.5), "Torso", 0.35)
add_bone("LeftArm", (-1.5, 0, 3.0), "Torso", 0.4)
add_bone("RightArm", (1.5, 0, 3.0), "Torso", 0.4)
add_bone("LeftLeg", (-0.5, 0, 1.0), "Torso", 0.4)
add_bone("RightLeg", (0.5, 0, 1.0), "Torso", 0.4)
bpy.ops.object.mode_set(mode='OBJECT')
for b in arm.data.bones:
    b.use_deform = True

for dst, obj in mesh_objs.items():
    obj.vertex_groups.clear()
    for m in list(obj.modifiers):
        obj.modifiers.remove(m)
    vg = obj.vertex_groups.new(name=dst)
    vg.add([v.index for v in obj.data.vertices], 1.0, 'REPLACE')
    mod = obj.modifiers.new("Armature", 'ARMATURE')
    mod.object = arm
    obj.parent = arm
    obj.matrix_parent_inverse = arm.matrix_world.inverted()
    print("skinned", dst, "verts", len(obj.data.vertices), "parent", obj.parent.name)

# Remove leftovers that aren't our arm/meshes
keep = {"R6Armature", *mesh_objs.keys()}
for o in list(bpy.data.objects):
    if o.name not in keep:
        bpy.data.objects.remove(o, do_unlink=True)

print("final", [o.name for o in bpy.data.objects])
bpy.ops.object.select_all(action='SELECT')
bpy.context.view_layer.objects.active = arm
os.makedirs(os.path.dirname(out_path), exist_ok=True)
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
