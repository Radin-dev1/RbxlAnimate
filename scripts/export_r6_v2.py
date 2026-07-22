import bpy, os
from mathutils import Vector

out_glb = r"C:\Users\kazem\Projects\RbxlAnimate\public\rigs\r6.glb"
src = r"C:\Users\kazem\Downloads\Blender R6.blend"
bpy.ops.wm.read_factory_settings(use_empty=True)

names = ["Head_MBlocky","Torso_MBlocky","Left Arm_MBlocky","Right Arm_MBlocky","Left Leg_MBlocky","Right Leg_MBlocky"]
with bpy.data.libraries.load(src, link=False) as (df, dt):
    dt.objects = [n for n in names if n in set(df.objects)]

sc = bpy.context.scene.collection
# Capture mesh data immediately then purge EVERYTHING else
raw = {}
for obj in list(dt.objects):
    if obj is None: continue
    sc.objects.link(obj)
    deps = bpy.context.evaluated_depsgraph_get()
    eval_obj = obj.evaluated_get(deps)
    mesh = bpy.data.meshes.new_from_object(eval_obj, preserve_all_data_layers=False, depsgraph=deps)
    mesh.transform(obj.matrix_world)
    mesh.update()
    raw[obj.name] = mesh

# Nuclear clear of scene objects
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
for a in list(bpy.data.armatures):
    bpy.data.armatures.remove(a)
# keep only our mesh datablocks referenced in raw

rename = {
    "Head_MBlocky":"Head",
    "Torso_MBlocky":"Torso",
    "Left Arm_MBlocky":"LeftArm",
    "Right Arm_MBlocky":"RightArm",
    "Left Leg_MBlocky":"LeftLeg",
    "Right Leg_MBlocky":"RightLeg",
}
colors = {
    "Head":(0.95,0.88,0.75,1),
    "Torso":(0.88,0.05,0.05,1),
    "LeftArm":(0.92,0.85,0.72,1),
    "RightArm":(0.92,0.85,0.72,1),
    "LeftLeg":(0.12,0.12,0.14,1),
    "RightLeg":(0.12,0.12,0.14,1),
}

created=[]
for old,new in rename.items():
    mesh = raw[old]
    mesh.name = new
    obj = bpy.data.objects.new(new, mesh)
    sc.objects.link(obj)
    mat = bpy.data.materials.new("M_"+new)
    mat.use_nodes = True
    nodes=mat.node_tree.nodes; links=mat.node_tree.links
    nodes.clear()
    outn=nodes.new("ShaderNodeOutputMaterial"); bsdf=nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value=colors[new]
    links.new(bsdf.outputs["BSDF"], outn.inputs["Surface"])
    obj.data.materials.append(mat)
    created.append(obj)

bpy.ops.object.armature_add(enter_editmode=True, location=(0,0,0))
arm=bpy.context.object; arm.name="R6"
eb=arm.data.edit_bones
for b in list(eb): eb.remove(b)

def addb(name, head, parent=None):
    b=eb.new(name); b.head=Vector(head); b.tail=Vector(head)+Vector((0,0,0.4))
    if parent: b.parent=eb[parent]
addb("HumanoidRootPart",(0,0,2.0))
addb("Torso",(0,0,3.0),"HumanoidRootPart")
addb("Head",(0,0,4.5),"Torso")
addb("LeftArm",(-1.5,0,3.0),"Torso")
addb("RightArm",(1.5,0,3.0),"Torso")
addb("LeftLeg",(-0.5,0,1.0),"Torso")
addb("RightLeg",(0.5,0,1.0),"Torso")
bpy.ops.object.mode_set(mode='OBJECT')
for b in arm.data.bones: b.use_deform=True

for obj in created:
    obj.vertex_groups.clear()
    vg=obj.vertex_groups.new(name=obj.name)
    vg.add([v.index for v in obj.data.vertices],1.0,'REPLACE')
    mod=obj.modifiers.new("Armature",'ARMATURE'); mod.object=arm
    obj.parent=arm

# Delete any leftover non-keep
keep={"R6",*[o.name for o in created]}
for o in list(bpy.data.objects):
    if o.name not in keep:
        bpy.data.objects.remove(o, do_unlink=True)

print("FINAL", [(o.name,o.type) for o in bpy.data.objects])
bpy.ops.object.select_all(action='SELECT')
bpy.context.view_layer.objects.active=arm
os.makedirs(os.path.dirname(out_glb), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=out_glb, export_format='GLB', use_selection=False,
    export_apply=True, export_texcoords=False, export_normals=True,
    export_materials='EXPORT', export_animations=False, export_skins=True, export_yup=True,
)
print("GLB", os.path.getsize(out_glb))
