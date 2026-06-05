import re
ROOT="/Users/revillsimon/Documents/Learning/personal-projects/primitiv/logo-concepts"
src=open(f"{ROOT}/primitiv-logo.svg").read()
d=re.search(r'd="([^"]+)"',src).group(1)
# mark ink bbox
mx,my,mw,mh=11,10,78,67.5
S=100.0; pad=14.0; area=S-2*pad
sc=min(area/mw, area/mh)
ox=(S-mw*sc)/2 - mx*sc
oy=(S-mh*sc)/2 - my*sc
def num(v):
    t=f"{v:.2f}".rstrip("0").rstrip("."); return "0" if t in ("","-0") else t
def xf(d,a,e,f2):
    toks=d.replace("Z"," Z ").split(); out=[]; i=0
    while i<len(toks):
        t=toks[i]
        if t in ("M","L"):
            x=float(toks[i+1]); y=float(toks[i+2])
            out.append(f"{t}{num(a*x+e)} {num(a*y+f2)}"); i+=3
        elif t=="Z": out.append("Z"); i+=1
        else: i+=1
    return "".join(out)
pd=xf(d, sc, ox, oy)
svg=(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n'
     f'  <!-- Primitiv favicon — mark centred in a square, ~14% padding. Black on transparent. -->\n'
     f'  <path fill="#000" d="{pd}"/>\n</svg>\n')
open(f"{ROOT}/favicon.svg","w").write(svg)
print("favicon.svg written; scale=%.4f"%sc)
