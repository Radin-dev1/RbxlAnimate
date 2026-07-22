import bpy
from mathutils import Vector, Matrix

# Inspect original parenting / bone rest positions
arm = bpy.data.objects.get("InternalArmature")
print("ARM", arm)
if arm:
    print("arm matrix", arm.matrix_world)
    for b in arm.data.bones:
        print(f"BONE {b.name!r} head={tuple(b.head_local)} tail={tuple(b.tail_local)} parent={b.parent.name if b.parent else None}")
        print(f"  matrix_local={b.matrix_local}")

for name in ["Head_MBlocky","Torso_MBlocky","Left Arm_MBlocky","Right Arm_MBlocky","Left Leg_MBlocky","Right Leg_MBlocky"]:
    obj = bpy.data.objects.get(name)
    if not obj:
        print("missing", name); continue
    print(f"MESH {name} parent={obj.parent} parent_type={obj.parent_type} parent_bone={getattr(obj,'parent_bone',None)}")
    print(f"  loc={tuple(obj.location)} matrix_world=\n{obj.matrix_world}")
    print(f"  mods={[m.type for m in obj.modifiers]} vgroups={[g.name for g in obj.vertex_groups]}")
    # bbox
    bb = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    xs=[v.x for v in bb]; ys=[v.y for v in bb]; zs=[v.z for v in bb]
    print(f"  world_bbox x={min(xs):.3f}..{max(xs):.3f} y={min(ys):.3f}..{max(ys):.3f} z={min(zs):.3f}..{max(zs):.3f}")
