import bpy, os
out = r"C:\Users\kazem\Projects\RbxlAnimate\public\rigs\r15.glb"
arm = bpy.data.objects.get("Roblox_R15")
mesh_names = ["Head","UpperTorso","LowerTorso","LeftUpperArm","LeftLowerArm","LeftHand","RightUpperArm","RightLowerArm","RightHand","LeftUpperLeg","LeftLowerLeg","LeftFoot","RightUpperLeg","RightLowerLeg","RightFoot"]
keep = {arm.name, *mesh_names}
for o in list(bpy.data.objects):
    if o.name not in keep:
        try: bpy.data.objects.remove(o, do_unlink=True)
        except: pass
for img in list(bpy.data.images):
    try: bpy.data.images.remove(img)
    except: pass

R15 = {"HumanoidRootPart","LowerTorso","UpperTorso","Head","LeftUpperArm","LeftLowerArm","LeftHand","RightUpperArm","RightLowerArm","RightHand","LeftUpperLeg","LeftLowerLeg","LeftFoot","RightUpperLeg","RightLowerLeg","RightFoot"}
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
eb = arm.data.edit_bones
for _ in range(80):
    removed=False
    for b in list(eb):
        if b.name not in R15:
            eb.remove(b); removed=True
    if not removed: break
bpy.ops.object.mode_set(mode='OBJECT')

def color_for(n):
    if n=="Head" or "Hand" in n: return (0.95,0.88,0.75,1)
    if "Foot" in n: return (0.08,0.08,0.1,1)
    if "Leg" in n: return (0.12,0.12,0.14,1)
    if "Arm" in n: return (0.92,0.85,0.72,1)
    if n=="UpperTorso": return (0.88,0.05,0.05,1)
    if n=="LowerTorso": return (0.55,0.05,0.05,1)
    return (0.7,0.7,0.7,1)

for name in mesh_names:
    obj = bpy.data.objects.get(name)
    if not obj: continue
    obj.hide_set(False)
    mat=bpy.data.materials.new("M_"+name); mat.use_nodes=True
    nodes=mat.node_tree.nodes; links=mat.node_tree.links; nodes.clear()
    outn=nodes.new("ShaderNodeOutputMaterial"); bsdf=nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value=color_for(name)
    links.new(bsdf.outputs["BSDF"], outn.inputs["Surface"])
    obj.data.materials.clear(); obj.data.materials.append(mat)
    obj.parent=None
    for m in list(obj.modifiers): obj.modifiers.remove(m)
    obj.vertex_groups.clear()
    vg=obj.vertex_groups.new(name=name)
    vg.add([v.index for v in obj.data.vertices],1.0,'REPLACE')
    mod=obj.modifiers.new("Armature",'ARMATURE'); mod.object=arm
    obj.parent=arm

arm.name="R15"
print("bones", [b.name for b in arm.data.bones])
print("objs", [o.name for o in bpy.data.objects])
bpy.ops.object.select_all(action='SELECT')
os.makedirs(os.path.dirname(out), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=False, export_apply=True, export_texcoords=False, export_normals=True, export_materials='EXPORT', export_animations=False, export_skins=True, export_yup=True)
print("R15 GLB", os.path.getsize(out))
