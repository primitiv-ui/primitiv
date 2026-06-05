import re
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import ControlBoundsPen
from fontTools.varLib.instancer import instantiateVariableFont

EM=100.0; PAD=4.0
f=TTFont("/tmp/wmfonts/Jost.ttf"); instantiateVariableFont(f,{"wght":500},inplace=True)
upm=f["head"].unitsPerEm; s=EM/upm
cmap=f.getBestCmap(); gs=f.getGlyphSet(); hmtx=f["hmtx"]

def layout(text, track):
    tx=track*EM; x=0.0; dz=[]; mnx=mny=1e9; mxx=mxy=-1e9
    for ch in text:
        g=cmap[ord(ch)]; adv=hmtx[g][0]*s
        sp=SVGPathPen(gs); gs[g].draw(TransformPen(sp,(s,0,0,-s,x,0)))
        if sp.getCommands(): dz.append(sp.getCommands())
        bp=ControlBoundsPen(gs); gs[g].draw(TransformPen(bp,(s,0,0,-s,x,0)))
        if bp.bounds:
            x0,y0,x1,y1=bp.bounds; mnx=min(mnx,x0);mny=min(mny,y0);mxx=max(mxx,x1);mxy=max(mxy,y1)
        x+=adv+tx
    return " ".join(dz),(mnx,mny,mxx,mxy)

def wm_svg(d,bb):
    mnx,mny,mxx,mxy=bb; w=(mxx-mnx)+2*PAD; h=(mxy-mny)+2*PAD
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{mnx-PAD:.2f} {mny-PAD:.2f} {w:.2f} {h:.2f}">'
            f'<path fill="#000" d="{d}"/></svg>\n'), (mnx,mny,mxx,mxy)

# --- tracking variants ---
for tr in (0.08,0.12,0.16,0.20):
    tag=f"t{int(tr*100):02d}"
    for word in ("PRIMITIV","HARMONI"):
        d,bb=layout(word,tr); svg,_=wm_svg(d,bb)
        open(f"wm-{word.lower()}-jost-{tag}.svg","w").write(svg)

# --- lockups (use t12) ---
MARK_INK={"primitiv":(11,10,78,67.5,"c1-golden3-flip-gap3.svg"),
          "harmoni" :(11,10,78,67.5,"harmoni-ring-bold.svg")}
def read_mark(fn):
    s2=open(fn).read()
    d=re.search(r'd="([^"]+)"',s2).group(1)
    fr=' fill-rule="evenodd"' if "evenodd" in s2 else ''
    return d,fr

def lockup(prod, track, orient):
    mx,my,mw,mh,mfile=MARK_INK[prod]
    md,mfr=read_mark(mfile)
    word=("PRIMITIV" if prod=="primitiv" else "HARMONI")
    wd,(wmnx,wmny,wmxx,wmxy)=(lambda r:(r[0],r[1]))(layout(word,track))
    wiw=wmxx-wmnx; wih=wmxy-wmny
    Hm=100.0; sm=Hm/mh; Wm=mw*sm
    P=8.0
    if orient=="h":
        Hw=0.60*Hm; sw=Hw/wih; G=0.32*Hm
        Wt=Wm+G+wiw*sw; Ht=Hm
        # mark: ink (mx,my)->(0,0) scaled sm; vertical full
        gmark=f'<g transform="translate({P},{P}) scale({sm:.4f}) translate({-mx},{-my})"><path fill="#000"{mfr} d="{md}"/></g>'
        wy=P+(Hm-Hw)/2
        gword=f'<g transform="translate({P+Wm+G:.2f},{wy:.2f}) scale({sw:.4f}) translate({-wmnx:.2f},{-wmny:.2f})"><path fill="#000" d="{wd}"/></g>'
        VB=f'0 0 {Wt+2*P:.2f} {Ht+2*P:.2f}'
    else: # stacked
        Gv=0.24*Hm; sw=Wm/wiw; Hw=wih*sw  # wordmark width == mark width
        Wt=Wm; Ht=Hm+Gv+Hw
        gmark=f'<g transform="translate({P},{P}) scale({sm:.4f}) translate({-mx},{-my})"><path fill="#000"{mfr} d="{md}"/></g>'
        gword=f'<g transform="translate({P},{P+Hm+Gv:.2f}) scale({sw:.4f}) translate({-wmnx:.2f},{-wmny:.2f})"><path fill="#000" d="{wd}"/></g>'
        VB=f'0 0 {Wt+2*P:.2f} {Ht+2*P:.2f}'
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{VB}">\n  {gmark}\n  {gword}\n</svg>\n'

for prod in ("primitiv","harmoni"):
    open(f"lockup-{prod}-h.svg","w").write(lockup(prod,0.16,"h"))
    open(f"lockup-{prod}-v.svg","w").write(lockup(prod,0.16,"v"))
print("generated tracking variants + lockups")
