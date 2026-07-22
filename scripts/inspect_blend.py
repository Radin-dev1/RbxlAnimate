import bpy
import sys

# Usage: blender file.blend --background --python this.py --
print("=== BLEND INSPECT ===")
print("filepath:", bpy.data.filepath)
print("objects:", len(bpy.data.objects))
for obj in bpy.data.objects:
    print(f"OBJ name={obj.name!r} type={obj.type} visible={obj.visible_get()}")
    if obj.type == 'ARMATURE':
        print(f"  bones={len(obj.data.bones)}")
        for b in obj.data.bones:
            parent = b.parent.name if b.parent else None
            print(f"  BONE {b.name!r} parent={parent!r}")
    if obj.type == 'MESH':
        me = obj.data
        print(f"  verts={len(me.vertices)} polys={len(me.polygons)} materials={len(me.materials)}")
        for m in obj.modifiers:
            print(f"  MOD {m.type} name={m.name}")
print("armatures:", [a.name for a in bpy.data.armatures])
print("images:", [(i.name, getattr(i, 'size', None), i.filepath) for i in bpy.data.images])
print("materials:", [m.name for m in bpy.data.materials])
