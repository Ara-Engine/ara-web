"""Renders the 3D logo studies with Cycles.

Run headless (does not touch an open Blender session):
    blender -b --factory-startup -P design/3d/render_logos.py -- <out_dir> [variant ...]

Geometry is the same 64-unit grid as design/logo-concepts.html (y down), so the
2D and 3D marks stay identical. Each variant clears the scene, builds, renders.
"""

import math
import sys

import bmesh
import bpy
from mathutils import Vector

ARGS = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
OUT = ARGS[0] if ARGS else "//"
ONLY = set(ARGS[1:])

BLUE = (0.033, 0.147, 0.871)  # #346bf1 in linear
BLUE_DEEP = (0.012, 0.074, 0.686)  # #1b4ed8
BLUE_LIGHT = (0.07, 0.2, 0.92)  # #4a7cf5

ALIF = [(6, 60), (32, 22), (58, 60), (45, 60), (28.5, 35.9), (12, 60)]
NUQTA = (32, 10, 6.0)  # centre x, y and half-diagonal
MONUMENT = [(4, 62), (32, 20), (60, 62), (39, 62), (32, 47), (25, 62)]


def X(x):
    return (x - 32) / 32


def Z(y, base=60):
    return (base - y) / 32


# ---------- scene plumbing ----------


def reset():
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for block in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.lights, bpy.data.cameras):
        for item in list(block):
            if item.users == 0:
                block.remove(item)
    world = bpy.context.scene.world or bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputWorld")
    # The camera sees near-black; reflections see a soft studio sweep, brighter overhead.
    dark = nt.nodes.new("ShaderNodeBackground")
    dark.inputs["Color"].default_value = (0.0025, 0.003, 0.0045, 1)
    coord = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.45
    ramp.color_ramp.elements[0].color = (0.004, 0.005, 0.008, 1)
    ramp.color_ramp.elements[1].color = (0.55, 0.6, 0.7, 1)
    studio = nt.nodes.new("ShaderNodeBackground")
    studio.inputs["Strength"].default_value = 0.6
    path = nt.nodes.new("ShaderNodeLightPath")
    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(coord.outputs["Generated"], sep.inputs[0])
    nt.links.new(sep.outputs["Z"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], studio.inputs["Color"])
    nt.links.new(path.outputs["Is Camera Ray"], mix.inputs["Fac"])
    nt.links.new(studio.outputs[0], mix.inputs[1])
    nt.links.new(dark.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs["Surface"])
    return nt, out


def setup_render(samples=256, size=(1200, 1200)):
    scene = bpy.context.scene
    try:
        scene.render.engine = "CYCLES"
    except TypeError as e:
        print("engine:", e)
    prefs = bpy.context.preferences.addons["cycles"].preferences
    for kind in ("OPTIX", "CUDA"):
        try:
            prefs.compute_device_type = kind
            prefs.get_devices()
            if any(d.type == kind for d in prefs.devices):
                for d in prefs.devices:
                    d.use = d.type == kind
                scene.cycles.device = "GPU"
                break
        except TypeError:
            continue
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.render.resolution_x, scene.render.resolution_y = size
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = False
    scene.view_settings.view_transform = "AgX"
    looks = [i.identifier for i in scene.view_settings.bl_rna.properties["look"].enum_items]
    punchy = next((l for l in looks if "Punchy" in l), None)
    if punchy:
        scene.view_settings.look = punchy


def principled(name, base, roughness=0.3, metallic=0.0, coat=0.0, transmission=0.0, emission=None, strength=0.0, ior=1.45):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    sets = {
        "Base Color": (*base, 1),
        "Roughness": roughness,
        "Metallic": metallic,
        "Coat Weight": coat,
        "Transmission Weight": transmission,
        "IOR": ior,
    }
    if emission:
        sets["Emission Color"] = (*emission, 1)
        sets["Emission Strength"] = strength
    for key, value in sets.items():
        if key in bsdf.inputs:
            bsdf.inputs[key].default_value = value
    return mat


def gradient_material(name, a, b):
    """Glossy plastic whose colour runs diagonally from `a` to `b` (the app tile)."""
    mat = principled(name, a, roughness=0.18, coat=1.0)
    nt = mat.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    coord = nt.nodes.new("ShaderNodeTexCoord")
    mapping = nt.nodes.new("ShaderNodeMapping")
    mapping.inputs["Rotation"].default_value = (0, 0, math.radians(-45))
    grad = nt.nodes.new("ShaderNodeTexGradient")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (*a, 1)
    ramp.color_ramp.elements[1].color = (*b, 1)
    nt.links.new(coord.outputs["Generated"], mapping.inputs["Vector"])
    nt.links.new(mapping.outputs[0], grad.inputs["Vector"])
    nt.links.new(grad.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    return mat


def area_light(name, loc, target, size, energy, color=(1, 1, 1)):
    data = bpy.data.lights.new(name, "AREA")
    data.size = size
    data.energy = energy
    data.color = color
    ob = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    return ob


def camera(loc, target, lens=70):
    data = bpy.data.cameras.new("Camera")
    data.lens = lens
    ob = bpy.data.objects.new("Camera", data)
    bpy.context.collection.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = ob
    return ob


def floor(mat):
    bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, 0))
    ob = bpy.context.active_object
    ob.data.materials.append(mat)
    return ob


def extruded(name, polys, depth, bevel, mat, base=60, y_offset=0.0):
    """Polygons on the 64 grid (first is the outline, the rest are holes), stood upright."""
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "2D"
    cu.fill_mode = "BOTH"
    cu.extrude = depth
    cu.bevel_depth = bevel
    cu.bevel_resolution = 4
    for poly in polys:
        sp = cu.splines.new("POLY")
        sp.points.add(len(poly) - 1)
        for i, (x, y) in enumerate(poly):
            sp.points[i].co = (X(x), Z(y, base), 0, 1)
        sp.use_cyclic_u = True
    ob = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(ob)
    ob.rotation_euler = (math.radians(90), 0, 0)
    ob.location = (0, y_offset, 0)
    ob.data.materials.append(mat)
    return ob


def gem(name, cx, cy, half, depth, mat, base=60, tall=1.0):
    """A nuqta as a crystal: rhombus from the front, pointed front and back."""
    bm = bmesh.new()
    h = half / 32
    v = [
        bm.verts.new((0, 0, h * tall)),
        bm.verts.new((h, 0, 0)),
        bm.verts.new((0, 0, -h * tall)),
        bm.verts.new((-h, 0, 0)),
        bm.verts.new((0, -depth, 0)),
        bm.verts.new((0, depth, 0)),
    ]
    ring = [v[0], v[1], v[2], v[3]]
    for i in range(4):
        a, b = ring[i], ring[(i + 1) % 4]
        bm.faces.new((a, b, v[4]))
        bm.faces.new((b, a, v[5]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    ob.location = (X(cx), 0, Z(cy, base))
    ob.data.materials.append(mat)
    return ob


def glow(name, cx, cy, energy, base=60, color=BLUE):
    """A point light inside a nuqta: blue spill on the body and floor."""
    data = bpy.data.lights.new(name, "POINT")
    data.energy = energy
    data.color = color
    data.shadow_soft_size = 0.05
    ob = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(ob)
    ob.location = (X(cx), -0.25, Z(cy, base))
    return ob


def render(name):
    bpy.context.scene.render.filepath = f"{OUT}/{name}.png"
    bpy.ops.render.render(write_still=True)
    print("rendered", name)


# ---------- lattice holes ----------


def inside(poly, x, y):
    hit = False
    for i in range(len(poly)):
        (x1, y1), (x2, y2) = poly[i], poly[(i + 1) % len(poly)]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            hit = not hit
    return hit


def edge_distance(poly, x, y):
    best = 1e9
    for i in range(len(poly)):
        (x1, y1), (x2, y2) = poly[i], poly[(i + 1) % len(poly)]
        dx, dy = x2 - x1, y2 - y1
        t = max(0, min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
        best = min(best, math.hypot(x - (x1 + t * dx), y - (y1 + t * dy)))
    return best


def lattice_holes(poly, sx=4.0, sy=6.8, bar=0.75, margin=2.1):
    """Rhombus openings on a diamond lattice, kept only where they sit fully inside `poly`."""
    hx, hy = sx / 2 - bar, sy / 2 - bar * sy / sx
    holes = []
    for j in range(-2, 40):
        for i in range(-2, 40):
            cx = i * sx + (sx / 2 if j % 2 else 0)
            cy = j * sy / 2
            pts = [(cx, cy - hy), (cx + hx, cy), (cx, cy + hy), (cx - hx, cy)]
            if all(inside(poly, px, py) and edge_distance(poly, px, py) >= margin for px, py in pts):
                holes.append(pts)
    return holes


# ---------- variants ----------


def shot(loc, target, lens, wide):
    """Square framing centres the mark; wide (16:9 hero) framing sets it right of centre,
    leaving the left third dark for a headline."""
    if wide:
        loc = (loc[0] - 1.8, loc[1] - 1.9, loc[2] + 0.1)
        target = (target[0] - 1.2, target[1], target[2] + 0.05)
        lens *= 0.7
    setup_size = (1920, 1080) if wide else (1200, 1200)
    bpy.context.scene.render.resolution_x, bpy.context.scene.render.resolution_y = setup_size
    camera(loc, target, lens)


def hidden(ob):
    """Light the scene and show in reflections, but never appear to the camera."""
    ob.visible_camera = False
    return ob


def studio(rim=BLUE, rim_energy=650, key_energy=380, wide=False):
    area_light("Key", (-3.2, -3.4, 4.2), (0, 0, 0.8), 3.0, key_energy, (1.0, 0.97, 0.93))
    area_light("Rim", (3.0, 2.8, 2.6), (0, 0, 0.8), 1.6, rim_energy, rim)
    area_light("Fill", (3.4, -4.0, 0.7), (0, 0, 0.8), 4.0, 55, (0.85, 0.9, 1.0))
    floor(principled("Floor", (0.006, 0.006, 0.008), roughness=0.12, coat=0.6))
    shot((1.35, -5.4, 1.05), (0, 0, 0.82), 72, wide)


def alif_obsidian(wide=False):
    reset()
    setup_render()
    body = principled("Obsidian", (0.012, 0.012, 0.016), roughness=0.08, coat=1.0)
    crystal = principled("Nuqta", BLUE, roughness=0.05, emission=BLUE, strength=3.2)
    extruded("Alif", [ALIF], 0.16, 0.012, body)
    gem("Nuqta", *NUQTA, 0.13, crystal)
    glow("Glow", NUQTA[0], NUQTA[1], 60)
    # A long strip softbox that only shows as a highlight sweeping across the black face.
    streak = hidden(area_light("Streak", (-1.7, -5.0, 1.45), (0, 0, 0.85), 2.4, 140, (0.85, 0.9, 1.0)))
    streak.data.shape = "RECTANGLE"
    streak.data.size_y = 0.22
    studio(wide=wide)
    render("hero-obsidian" if wide else "alif-obsidian")


def alif_blue():
    reset()
    setup_render()
    body = principled("Ceramic", BLUE, roughness=0.28, coat=0.8)
    crystal = principled("Nuqta", (0.93, 0.94, 0.97), roughness=0.15, coat=1.0)
    extruded("Alif", [ALIF], 0.16, 0.014, body)
    gem("Nuqta", *NUQTA, 0.13, crystal)
    studio(rim=(0.85, 0.9, 1.0), rim_energy=500, key_energy=420)
    render("alif-blue")


def alif_monument(wide=False):
    nt, out = reset()
    setup_render(samples=384)
    fog = nt.nodes.new("ShaderNodeVolumeScatter")
    fog.inputs["Density"].default_value = 0.0035
    fog.inputs["Color"].default_value = (0.75, 0.82, 1.0, 1)
    nt.links.new(fog.outputs[0], out.inputs["Volume"])
    stone = principled("Basalt", (0.016, 0.017, 0.02), roughness=0.42, metallic=0.25, coat=0.3)
    crystal = principled("Nuqta", BLUE, roughness=0.05, emission=BLUE, strength=3.5)
    extruded("Monument", [MONUMENT, *lattice_holes(MONUMENT)], 0.12, 0.006, stone, base=62)
    gem("Nuqta", 32, 9, 6.0, 0.12, crystal, base=62)
    glow("Glow", 32, 9, 80, base=62)
    # Light pours through the lattice from behind, towards the camera and the floor.
    back = hidden(area_light("Back", (0.2, 3.0, 1.5), (0, -2.0, 0.35), 0.6, 2600, (0.72, 0.82, 1.0)))
    back.data.shape = "DISK"  # a round source glows round in the fog
    area_light("Key", (-3.0, -3.6, 3.6), (0, 0, 0.8), 3.0, 120, (1.0, 0.97, 0.93))
    floor(principled("Floor", (0.012, 0.012, 0.014), roughness=0.3))
    shot((1.1, -5.6, 0.75), (0, 0, 0.9), 60, wide)
    render("hero-monument" if wide else "alif-monument")


def app_icon():
    reset()
    setup_render(size=(1200, 1200))
    r, n = 0.36, 10

    def rounded(cx, cy, w, h, rad):
        pts = []
        for k, (ox, oy) in enumerate(((w - rad, h - rad), (-(w - rad), h - rad), (-(w - rad), -(h - rad)), (w - rad, -(h - rad)))):
            for s in range(n + 1):
                a = math.radians(90 * k + 90 * s / n)
                pts.append((cx + ox + rad * math.cos(a), cy + oy + rad * math.sin(a)))
        return pts

    # The tile, lying back slightly like a desk icon, with the mark raised on it.
    tile_pts = [(32 + x * 32, 32 - y * 32) for x, y in rounded(0, 0, 1.0, 1.0, r)]
    tile = extruded("Tile", [tile_pts], 0.1, 0.05, gradient_material("Tile", BLUE_LIGHT, BLUE_DEEP), base=64)
    white = principled("Mark", (0.94, 0.95, 0.98), roughness=0.22, coat=0.6)
    scale = 0.56
    alif = [(32 + (x - 32) * scale, 34 + (y - 34) * scale) for x, y in ALIF]
    mark = extruded("Alif", [alif], 0.04, 0.012, white, base=64, y_offset=-0.15)
    nuqta = gem("Nuqta", 32, 34 + (10 - 34) * scale, 6 * scale, 0.05, white, base=64)
    nuqta.location.y = -0.15
    for ob in (tile, mark, nuqta):
        ob.location.z += 0.08
    floor(principled("Floor", (0.006, 0.006, 0.008), roughness=0.35))
    area_light("Key", (-2.2, -3.0, 4.6), (0, 0, 1.0), 4.0, 520, (1.0, 0.98, 0.95))
    area_light("Rim", (2.6, 2.4, 3.0), (0, 0, 1.0), 2.0, 320, (0.75, 0.85, 1.0))
    camera((0.0, -6.2, 1.55), (0, 0, 1.08), lens=62)
    render("app-icon")


def lattice_gems(wide=False):
    reset()
    setup_render()
    silver = principled("Silver", (0.9, 0.92, 0.96), roughness=0.12, metallic=1.0)
    crystal = principled("Nuqta", BLUE, roughness=0.05, emission=BLUE, strength=3.2)
    centres = [(32, 12.5), (27, 21), (37, 21), (22, 29.5), (42, 29.5), (17, 38), (47, 38), (12, 46.5), (52, 46.5), (7, 55), (57, 55)]
    for i, (cx, cy) in enumerate(centres):
        gem(f"Gem{i}", cx, cy, 3.9, 0.09, silver, base=63.5, tall=1.5)
    gem("Nuqta", 32, 46.5, 3.9, 0.09, crystal, base=63.5, tall=1.5)
    glow("Glow", 32, 46.5, 50, base=63.5)
    studio(rim_energy=700, wide=wide)
    render("hero-crystal" if wide else "lattice-gems")


VARIANTS = {
    "alif-obsidian": alif_obsidian,
    "alif-blue": alif_blue,
    "alif-monument": alif_monument,
    "app-icon": app_icon,
    "lattice-gems": lattice_gems,
    "hero-obsidian": lambda: alif_obsidian(wide=True),
    "hero-monument": lambda: alif_monument(wide=True),
    "hero-crystal": lambda: lattice_gems(wide=True),
}

for key, build in VARIANTS.items():
    if not ONLY or key in ONLY:
        build()
