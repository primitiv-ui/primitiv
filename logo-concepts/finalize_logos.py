import re
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import ControlBoundsPen
from fontTools.varLib.instancer import instantiateVariableFont

ROOT="/Users/revillsimon/Documents/Learning/personal-projects/primitiv/logo-concepts"
EM=100.0; TRACK=0.16
f=TTFont("/tmp/wmfonts/Jost.ttf"); instantiateVariableFont(f,{"wght":500},inplace=True)
upm=f["head"].unitsPerEm; s=EM/upm
cmap=f.getBestCmap(); gs=f.getGlyphSet(); hmtx=f["hmtx"]

def num(v):
    t=f"{v:.2f}".rstrip("0").rstrip(".")
    return "0" if t in ("","-0") else t

# ---- wordmark raw layout: glyph cursors + raw bbox (EM=100, y-up flipped) ----
def raw_layout(text):
    tx=TRACK*EM; x=0.0; gl=[]; mnx=mny=1e9; mxx=mxy=-1e9
    for ch in text:
        g=cmap[ord(ch)]; gl.append((g,x))
        bp=ControlBoundsPen(gs); gs[g].draw(TransformPen(bp,(s,0,0,-s,x,0)))
        if bp.bounds:
            x0,y0,x1,y1=bp.bounds; mnx=min(mnx,x0);mny=min(mny,y0);mxx=max(mxx,x1);mxy=max(mxy,y1)
        x+=hmtx[g][0]*s+tx
    return gl,(mnx,mny,mxx,mxy)

def word_path(text, sc, EX, EY):
    """bake scale sc + placement: per-glyph matrix (sc*s,0,0,-sc*s, EX+sc*(xcur-mnx), EY-sc*mny)."""
    gl,(mnx,mny,mxx,mxy)=raw_layout(text)
    sp=SVGPathPen(gs)
    for g,xc in gl:
        M=(sc*s,0,0,-sc*s, EX+sc*(xc-mnx), EY-sc*mny)
        gs[g].draw(TransformPen(sp,M))
    d=sp.getCommands()
    # round every number in d
    d=re.sub(r'-?\d+\.?\d*', lambda m:num(float(m.group())), d)
    return d,(mxx-mnx,mxy-mny)   # ink w,h at scale 1

# ---- mark path: transform simple absolute M/L/Z by x'=sm*x+e, y'=sm*y+g ----
def mark_path(d, sm, e, gfy):
    toks=d.replace("Z"," Z ").split()
    out=[]; i=0
    while i<len(toks):
        t=toks[i]
        if t in ("M","L"):
            x=float(toks[i+1]); y=float(toks[i+2])
            out.append(f"{t}{num(sm*x+e)} {num(sm*y+gfy)}"); i+=3
        elif t=="Z": out.append("Z"); i+=1
        else: i+=1
    return "".join(out)

MARKS={
 "primitiv":dict(file="primitiv-logo.svg", fr=""),
 "harmoni": dict(file="harmoni-logo.svg",  fr=' fill-rule="evenodd"'),
}
WORD={"primitiv":"PRIMITIV","harmoni":"HARMONI"}
MINK=(11,10,78,67.5)   # mark ink bbox (x,y,w,h) shared by both marks

def read_markd(fn):
    s2=open(f"{ROOT}/{fn}").read()
    return re.search(r'd="([^"]+)"',s2).group(1)

def save(name, body, vb, header):
    svg=(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">\n'
         f'  <!--\n{header}\n  -->\n{body}\n</svg>\n')
    open(f"{ROOT}/{name}","w").write(svg)
    print("wrote", name)

for prod in ("primitiv","harmoni"):
    mx,my,mw,mh=MINK
    md=read_markd(MARKS[prod]["file"]); fr=MARKS[prod]["fr"]
    W=WORD[prod]

    # 1) wordmark only ----------------------------------------------------
    P=6.0
    d,(iw,ih)=word_path(W, 1.0, P, P)
    save(f"{prod}-wordmark.svg",
         f'  <path fill="#000" d="{d}"/>',
         f'0 0 {num(iw+2*P)} {num(ih+2*P)}',
         f"    {prod.capitalize()} wordmark — Jost Medium, all-caps, tracking {TRACK}em.\n"
         f"    Outlined paths (no live font needed). Single colour black on transparent.")

    # 2) horizontal lockup ------------------------------------------------
    P=8.0; Hm=100.0; sm=Hm/mh; Wm=mw*sm; Hw=0.60*Hm; G=0.32*Hm
    mp=mark_path(md, sm, P-sm*mx, P-sm*my)
    sw=Hw/ih
    wd,_=word_path(W, sw, P+Wm+G, P+(Hm-Hw)/2)
    Wt=Wm+G+iw*sw
    save(f"{prod}-lockup.svg",
         f'  <path fill="#000"{fr} d="{mp}"/>\n  <path fill="#000" d="{wd}"/>',
         f'0 0 {num(Wt+2*P)} {num(Hm+2*P)}',
         f"    {prod.capitalize()} horizontal lockup — mark + Jost wordmark (tracking {TRACK}em).\n"
         f"    Wordmark cap-height = 0.60x mark height; gap = 0.32x mark height.")

    # 3) stacked lockup ---------------------------------------------------
    P=8.0; Gv=0.24*Hm
    mp=mark_path(md, sm, P-sm*mx, P-sm*my)
    sw=Wm/iw; Hwv=ih*sw
    wd,_=word_path(W, sw, P, P+Hm+Gv)
    save(f"{prod}-lockup-stacked.svg",
         f'  <path fill="#000"{fr} d="{mp}"/>\n  <path fill="#000" d="{wd}"/>',
         f'0 0 {num(Wm+2*P)} {num(Hm+Gv+Hwv+2*P)}',
         f"    {prod.capitalize()} stacked lockup — mark above Jost wordmark (tracking {TRACK}em).\n"
         f"    Wordmark width = mark width; vertical gap = 0.24x mark height.")
