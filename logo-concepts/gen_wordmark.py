import os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import ControlBoundsPen
from fontTools.varLib.instancer import instantiateVariableFont

FONTS = {
    "poppins":   "/tmp/wmfonts/Poppins.ttf",
    "jost":      "/tmp/wmfonts/Jost.ttf",
    "outfit":    "/tmp/wmfonts/Outfit.ttf",
    "montserrat":"/tmp/wmfonts/Montserrat.ttf",
}
EM = 100.0          # render em = 100 user units
TRACK = 0.12        # letter-spacing as fraction of em
PAD = 4.0

def load(path):
    f = TTFont(path)
    if "fvar" in f:                       # variable -> Medium
        instantiateVariableFont(f, {"wght": 500}, inplace=True)
    return f

def cap_height(f):
    try:
        ch = f["OS/2"].sCapHeight
        if ch: return ch
    except Exception: pass
    return f["hhea"].ascent

def layout(f, text):
    upm = f["head"].unitsPerEm
    s = EM / upm
    cmap = f.getBestCmap()
    gs = f.getGlyphSet()
    hmtx = f["hmtx"]
    track_px = TRACK * EM
    x = 0.0
    dpaths, bpens = [], []
    minx=miny=1e9; maxx=maxy=-1e9
    for ch in text:
        gname = cmap[ord(ch)]
        adv = hmtx[gname][0] * s
        # build outline path in SVG space (flip y, scale, translate)
        spen = SVGPathPen(gs)
        tpen = TransformPen(spen, (s, 0, 0, -s, x, 0))
        gs[gname].draw(tpen)
        d = spen.getCommands()
        if d: dpaths.append(d)
        # bounds
        bp = ControlBoundsPen(gs)
        tbp = TransformPen(bp, (s, 0, 0, -s, x, 0))
        gs[gname].draw(tbp)
        if bp.bounds:
            x0,y0,x1,y1 = bp.bounds
            minx=min(minx,x0); maxx=max(maxx,x1)
            miny=min(miny,y0); maxy=max(maxy,y1)
        x += adv + track_px
    return " ".join(dpaths), (minx,miny,maxx,maxy)

def write(name, d, bb):
    minx,miny,maxx,maxy = bb
    w = (maxx-minx)+2*PAD; h=(maxy-miny)+2*PAD
    vx = minx-PAD; vy=miny-PAD
    svg=(f'<svg xmlns="http://www.w3.org/2000/svg" '
         f'viewBox="{vx:.2f} {vy:.2f} {w:.2f} {h:.2f}">\n'
         f'  <path fill="#000" d="{d}"/>\n</svg>\n')
    open(name,"w").write(svg)

for key,path in FONTS.items():
    f = load(path)
    for word in ("PRIMITIV","HARMONI"):
        d,bb = layout(f, word)
        write(f"wm-{word.lower()}-{key}.svg", d, bb)
    print(f"{key}: capH={cap_height(f)} done")
