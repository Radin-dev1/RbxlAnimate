import bpy, sys, os
out_path = sys.argv[sys.argv.index("--")+1]

def kill(obj):
    try: bpy.data.objects.remove(obj, do_unlink=True)
    except: pass

arm = bpy.data.objects.get("InternalArmature")
mesh_src = {
    "Head_MBlocky": ("Head", (0.95, 0.88, 0.75)),
    "Torso_MBlocky": ("Torso", (0.88, 0.05, 0.05)),
    "Left Arm_MBlocky": ("LeftArm", (0.92, 0.85, 0.72)),
    "Right Arm_MBlocky": ("RightArm", (0.92, 0.85, 0.72)),
    "Left Leg_MBlocky": ("LeftLeg", (0.12, 0.12, 0.14)),
    "Right Leg_MBlocky": ("RightLeg", (0.12, 0.12, 0.14)),
}
keep = {arm.name, *mesh_src}
for o in list(bpy.data.objects):
    if o.name not in keep: kill(o)
for img in list(bpy.data.images):
    bpy.data.images.remove(img)

# Link everything to scene collection
scene_col = bpy.context.scene.collection
for o in list(bpy.data.objects):
    for c in list(o.users_collection):
        c.objects.unlink(o)
    scene_col.objects.link(o)
    o.hide_set(False)
    o.hide_viewport = False
    o.hide_render = False

# Rename bones
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
for old, new in [("Left Arm","LeftArm"),("Right Arm","RightArm"),("Left Leg","LeftLeg"),("Right Leg","RightLeg")]:
    if old in arm.data.edit_bones:
        arm.data.edit_bones[old].name = new
bpy.ops.object.mode_set(mode='OBJECT')
for b in arm.data.bones:
    b.use_deform = True
print("bones", [b.name for b in arm.data.bones])
print("arm scale", tuple(arm.scale), "loc", tuple(arm.location))

# Make materials + skin
def mat(obj, color):
    m = bpy.data.materials.new("M_"+obj.name)
    m.use_nodes = True
    n = m.node_tree.nodes; l = m.node_tree.links
    n.clear()
    o = n.new("ShaderNodeOutputMaterial"); b = n.new("ShaderNodeBsdfPrincipled")
    b.inputs["Base Color"].default_value = (*color, 1)
    l.new(b.outputs["BSDF"], o.inputs["Surface"])
    obj.data.materials.clear(); obj.data.materials.append(m)

meshes = []
for src, (dst, color) in mesh_src.items():
    obj = bpy.data.objects[src]
    obj.name = dst
    mat(obj, color)
    obj.parent = None
    for m in list(obj.modifiers): obj.modifiers.remove(m)
    obj.vertex_groups.clear()
    vg = obj.vertex_groups.new(name=dst)
    vg.add(list(range(len(obj.data.vertices))), 1.0, 'REPLACE')
    mod = obj.modifiers.new("Armature", 'ARMATURE')
    mod.object = arm
    mod.use_vertex_groups = True
    # Keep world transform; parent without inverse so skin works
    obj.parent = arm
    obj.matrix_parent_inverse = arm.matrix_world.inverted()
    meshes.append(obj)
    print(dst, "groups", [g.name for g in obj.vertex_groups], "mod", mod.object)

arm.name = "R6Armature"
# Select all and export whole scene selection
bpy.ops.object.select_all(action='SELECT')
bpy.context.view_layer.objects.active = arm
print("selected", [o.name for o in bpy.context.selected_objects])

os.makedirs(os.path.dirname(out_path), exist_ok=True)
# Try exporting without selection filter - entire scene
bpy.ops.export_scene.gltf(
    filepath=out_path,
    export_format='GLB',
    use_selection=False,
    use_visible=True,
    export_apply=False,
    export_texcoords=False,
    export_normals=True,
    export_materials='EXPORT',
    export_animations=False,
    export_skins=True,
    export_yup=True,
)
print("size", os.path.getsize(out_path))
