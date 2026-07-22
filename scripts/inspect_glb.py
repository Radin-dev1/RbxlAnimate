import bpy, sys
path = sys.argv[sys.argv.index("--")+1]
# clear scene
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=path)
print("FILE", path)
for obj in bpy.data.objects:
    print("OBJ", obj.name, obj.type)
    if obj.type == "ARMATURE":
        for b in obj.data.bones:
            print(" BONE", b.name, "parent", b.parent.name if b.parent else None)
    if obj.type == "MESH":
        print("  vgroups", [g.name for g in obj.vertex_groups])
        print("  verts", len(obj.data.vertices))
