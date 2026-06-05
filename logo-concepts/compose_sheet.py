import re
fonts=["poppins","jost","outfit","montserrat"]
def read(name):
    s=open(name).read()
    vb=re.search(r'viewBox="([^"]+)"',s).group(1)
    d=re.search(r'<path[^>]*d="([^"]+)"',s).group(1)
    x,y,w,h=[float(v) for v in vb.split()]
    return x,y,w,h,d
ROW_H=70; GAP_Y=46; LABEL_W=120; COL_GAP=70; PAD=30
# scale each wordmark to ROW_H tall; place PRIMITIV then HARMONI per row
rows=[]
maxw=0
for fn in fonts:
    px,py,pw,ph,pd=read(f"wm-primitiv-{fn}.svg")
    hx,hy,hw,hh,hd=read(f"wm-harmoni-{fn}.svg")
    sp=ROW_H/ph; sh=ROW_H/hh
    rows.append((fn,(px,py,pw,ph,pd,sp),(hx,hy,hw,hh,hd,sh)))
    maxw=max(maxw, pw*sp)
col2_x=PAD+LABEL_W+maxw+COL_GAP
total_w=col2_x+ max(r[2][2]*r[2][5] for r in rows)+PAD
total_h=PAD*2+len(fonts)*ROW_H+(len(fonts)-1)*GAP_Y
out=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {total_w:.0f} {total_h:.0f}">']
out.append(f'<rect width="{total_w:.0f}" height="{total_h:.0f}" fill="white"/>')
y=PAD
for fn,(px,py,pw,ph,pd,sp),(hx,hy,hw,hh,hd,sh) in rows:
    out.append(f'<text x="{PAD}" y="{y+ROW_H*0.7:.1f}" font-family="Menlo,monospace" font-size="13" fill="#999">{fn}</text>')
    # PRIMITIV
    out.append(f'<g transform="translate({PAD+LABEL_W:.1f},{y:.1f}) scale({sp:.4f}) translate({-px:.2f},{-py:.2f})"><path fill="#000" d="{pd}"/></g>')
    # HARMONI
    out.append(f'<g transform="translate({col2_x:.1f},{y:.1f}) scale({sh:.4f}) translate({-hx:.2f},{-hy:.2f})"><path fill="#000" d="{hd}"/></g>')
    y+=ROW_H+GAP_Y
out.append('</svg>')
open("_sheet.svg","w").write("\n".join(out))
print("sheet w,h=",int(total_w),int(total_h))
