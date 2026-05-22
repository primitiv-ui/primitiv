/**
 * Harmoni Plugin — Neutral Section Detail Wireframes
 *
 * Appends three screens to the "Wireframes — Harmoni Plugin" page
 * (creates the page if it doesn't exist yet):
 *
 *   Screen 2a — Default palette editor state (baseline reference)
 *               Compact curve visualisation, all controls at rest.
 *
 *   Screen 2b — Lightness curve expanded
 *               "Edit curve ›" tapped: the compact dot visualisation is
 *               replaced inline by a Sliders / Curve tab bar + 10 vertical
 *               sliders. Right column scrolls — Apply is below the fold.
 *
 *   Screen 2c — After curve edit
 *               Compact curve restored with modified lightness values,
 *               left column neutral ramp updated to reflect the new curve.
 *
 * HOW TO RUN
 * ----------
 * 1. Open your Figma file in the desktop app.
 * 2. Plugins → Development → Open console (⌘⌥I on Mac).
 * 3. Type "allow pasting" and press Enter, then paste and press Enter.
 */

(async function createNeutralDetailWireframes() {

  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });

  let page = figma.root.children.find(p => p.name === "Wireframes — Harmoni Plugin");
  if (!page) { page = figma.createPage(); page.name = "Wireframes — Harmoni Plugin"; }
  figma.currentPage = page;

  // ─── Shared layout + helpers (identical across all four scripts) ──────────

  const W = 640, H = 620, PAD = 16, HDR_H = 48, GAP = 48;
  const CW    = W - PAD * 2;
  const LCW   = 364, CGAP = 12;
  const RCW   = CW - LCW - CGAP;
  const RCX   = PAD + LCW + CGAP;
  const PITCH = W + GAP;
  const SW = 32, SH = 60, SGAP = 4;
  const RAMP_W = SW * 10 + SGAP * 9;
  const RAMP_X = PAD + Math.round((LCW - RAMP_W) / 2);

  const LIGHTNESS = [248,232,212,188,161,132,104,78,53,26];
  const STEPS = ["50","100","200","300","400","500","600","700","800","900"];
  const FG    = ["900","900","900","900","900","50","50","50","50","50"];
  const RATIOS  = ["14.2","9.8","6.5","4.9","3.8","4.6","6.1","9.1","12.8","19.3"];
  const RATINGS = ["AA","AA","AA","AA","AA","AA","AA","AA","AA","AA"];
  const LVALS   = [0.97,0.91,0.83,0.74,0.63,0.52,0.41,0.31,0.21,0.10];

  // Modified curve: steeper descent — shows the result of a user edit
  const LVALS_EDITED = [0.94,0.86,0.75,0.63,0.50,0.37,0.26,0.17,0.10,0.04];

  const BRAND_ROWS = [
    { label:"Primary",   colors:["#DBEAFE","#BFDBFE","#93C5FD","#60A5FA","#3B82F6","#2563EB","#1D4ED8","#1E40AF","#1E3A8A","#172554"] },
    { label:"Secondary", colors:["#EDE9FE","#DDD6FE","#C4B5FD","#A78BFA","#8B5CF6","#7C3AED","#6D28D9","#5B21B6","#4C1D95","#2E1065"] },
    { label:"Accent",    colors:["#FEF3C7","#FDE68A","#FCD34D","#FBBF24","#F59E0B","#D97706","#B45309","#92400E","#78350F","#451A03"] },
  ];

  function rgb(hex) { return { r:parseInt(hex.slice(1,3),16)/255, g:parseInt(hex.slice(3,5),16)/255, b:parseInt(hex.slice(5,7),16)/255 }; }
  function solid(hex) { return [{ type:"SOLID", color:rgb(hex) }]; }
  function solidA(hex,a) { return [{ type:"SOLID", color:rgb(hex), opacity:a }]; }
  function grey(l) { const h=Math.round(l).toString(16).padStart(2,"0"); return `#${h}${h}${h}`; }

  function mkFrame(name,x,y,w,h,bg) {
    const f=figma.createFrame(); f.name=name; f.x=x; f.y=y;
    f.resize(w,h); f.fills=solid(bg||"#F2F2F2"); f.clipsContent=true; return f;
  }
  function mkRect(p,name,x,y,w,h,fill) {
    const r=figma.createRectangle(); r.name=name; r.x=x; r.y=y; r.resize(w,h);
    r.fills=Array.isArray(fill)?fill:solid(fill); p.appendChild(r); return r;
  }
  function mkText(p,s,x,y,sz,style,hex) {
    const t=figma.createText(); t.fontName={family:"Inter",style}; t.fontSize=sz;
    t.fills=solid(hex); t.characters=String(s); t.x=x; t.y=y; p.appendChild(t); return t;
  }
  function mkDiv(p,x,y,w) { return mkRect(p,"Divider",x,y,w,1,"#D8D8D8"); }
  function mkSec(p,s,x,y) { return mkText(p,s,x,y,10,"Medium","#999999"); }

  function mkBreadcrumbHdr(p,project,palette) {
    mkRect(p,"Header bg",0,0,W,HDR_H,"#1E1E1E");
    mkText(p,"‹",14,13,20,"Regular","#FFFFFF"); mkText(p,project,38,15,14,"Medium","#FFFFFF");
    const sepX=38+project.length*7+4;
    mkText(p,"/",sepX,15,14,"Regular","#555555"); mkText(p,palette,sepX+14,15,14,"Regular","#CCCCCC");
    const cb=mkRect(p,"Close",W-PAD-22,13,22,22,solidA("#FFFFFF",0.12)); cb.cornerRadius=4;
    mkText(p,"×",W-PAD-16,15,12,"Regular","#FFFFFF");
  }

  function drawLeftCol(p,cfg) {
    cfg=cfg||{}; const sa=cfg.shapeActive||"Round", lv=cfg.lvals||LVALS, BSH=24;
    let ly=HDR_H+16;
    mkSec(p,"NEUTRAL",PAD,ly); ly+=18; mkDiv(p,PAD,ly,LCW); ly+=12;
    for (let i=0;i<10;i++) {
      const l=Math.round(lv[i]*255), sx=RAMP_X+i*(SW+SGAP);
      const sw=mkRect(p,`Swatch ${STEPS[i]}`,sx,ly,SW,SH,grey(l)); sw.cornerRadius=sa==="Round"?2:0;
      const fg=l>145?"#1E1E1E":"#FFFFFF";
      mkText(p,FG[i],sx+2,ly+10,7,"Bold",fg); mkText(p,RATIOS[i],sx+2,ly+21,7,"Regular",fg); mkText(p,RATINGS[i],sx+2,ly+32,7,"Bold",fg);
    }
    for (let i=0;i<10;i++) mkText(p,STEPS[i],RAMP_X+i*(SW+SGAP)+1,ly+SH+3,7,"Regular","#555555");
    ly+=SH+22;
    mkSec(p,"BRAND",PAD,ly); ly+=18; mkDiv(p,PAD,ly,LCW); ly+=12;
    for (const row of BRAND_ROWS) {
      mkText(p,row.label,PAD,ly,11,"Medium","#444444");
      for (let i=0;i<10;i++) {
        const sw=mkRect(p,`${row.label} ${STEPS[i]}`,RAMP_X+i*(SW+SGAP),ly+14,SW,BSH,row.colors[i]); sw.cornerRadius=sa==="Round"?2:0;
      }
      for (let i=0;i<10;i++) mkText(p,STEPS[i],RAMP_X+i*(SW+SGAP)+1,ly+14+BSH+2,7,"Regular","#555555");
      ly+=14+BSH+14;
    }
    const ab=mkRect(p,"Add brand colour",PAD,ly,LCW,28,"#FFFFFF");
    ab.strokes=solid("#C8C8C8"); ab.strokeWeight=1; ab.dashPattern=[4,3]; ab.cornerRadius=4;
    mkText(p,"+ Add brand colour",PAD+8,ly+8,11,"Regular","#888888");
  }

  function drawRightCol(p,cfg) {
    cfg=cfg||{};
    const lv=cfg.lvals||LVALS, curveX=!!cfg.curveExpanded, sa=cfg.shapeActive||"Round";
    const stepL=cfg.stepLabels!==false, a11y=!!cfg.a11yBadges;
    const styChk=!!cfg.applyStylesChecked, varChk=cfg.applyVarsChecked!==false;
    const coll=cfg.applyCollection!==undefined?cfg.applyCollection:"My Library";
    const appEn=cfg.applyEnabled!==false, colOp=!!cfg.collectionOpen;
    const PW=Math.floor((RCW-8)/2);
    let ry=HDR_H+16;

    mkSec(p,"NEUTRAL COLOURS",RCX,ry); ry+=14; mkDiv(p,RCX,ry,RCW); ry+=10;
    function pickerCard(label,hexDisplay,swatchHex,cx) {
      const card=mkRect(p,label+" picker",cx,ry,PW,40,"#FFFFFF");
      card.strokes=solid("#E0E0E0"); card.strokeWeight=1; card.cornerRadius=6;
      const sw=mkRect(p,label+" swatch",cx+8,ry+8,24,24,swatchHex); sw.cornerRadius=3;
      if (/^#f/i.test(swatchHex)) { sw.strokes=solid("#CCCCCC"); sw.strokeWeight=1; }
      mkText(p,label,cx+36,ry+5,9,"Regular","#999999"); mkText(p,hexDisplay,cx+36,ry+19,10,"Medium","#1E1E1E"); mkText(p,"▾",cx+PW-14,ry+14,10,"Regular","#BBBBBB");
    }
    pickerCard("White","#FAFAFA","#FAFAFA",RCX); pickerCard("Black","#121212","#121212",RCX+PW+8); ry+=48;

    mkSec(p,"LIGHTNESS CURVE",RCX,ry); ry+=14; mkDiv(p,RCX,ry,RCW); ry+=10;
    if (curveX) {
      const tc=mkRect(p,"Tabs",RCX,ry,RCW,28,"#FFFFFF"); tc.strokes=solid("#E0E0E0"); tc.strokeWeight=1; tc.cornerRadius=5;
      const pill=mkRect(p,"Sliders pill",RCX,ry,RCW/2,28,"#1E1E1E");
      pill.topLeftRadius=5; pill.bottomLeftRadius=5; pill.topRightRadius=0; pill.bottomRightRadius=0;
      mkText(p,"Sliders",RCX+Math.round(RCW/4-18),ry+9,11,"Medium","#FFFFFF"); mkText(p,"Curve",RCX+Math.round(RCW*3/4-14),ry+9,11,"Regular","#888888"); ry+=36;
      for (let i=0;i<10;i++) mkText(p,Math.round(lv[i]*100)+"%",RAMP_X+i*(SW+SGAP),ry,7,"Regular","#888888");
      ry+=12;
      const SH2=64,TH=8,TW2=12;
      for (let i=0;i<10;i++) {
        const sx=RAMP_X+i*(SW+SGAP), trX=sx+Math.round((SW-4)/2), tTop=Math.round((1-lv[i])*(SH2-TH));
        const tr=mkRect(p,`Track ${i}`,trX,ry,4,SH2,"#D8D8D8"); tr.cornerRadius=2;
        const fH=tTop+Math.round(TH/2);
        if (fH>1) { const fi=mkRect(p,`Fill ${i}`,trX,ry,4,fH,"#1E1E1E"); fi.topLeftRadius=2; fi.topRightRadius=2; }
        mkRect(p,`Thumb ${i}`,sx+Math.round((SW-TW2)/2),ry+tTop,TW2,TH,"#1E1E1E").cornerRadius=2;
      }
      for (let i=0;i<10;i++) mkText(p,STEPS[i],RAMP_X+i*(SW+SGAP)+1,ry+SH2+2,7,"Regular","#555555");
      ry+=SH2+16; mkText(p,"Done  ↑",RCX+RCW-46,ry,10,"Regular","#2563EB"); ry+=18;
    } else {
      const CH=48; const ca=mkRect(p,"Curve area",RCX,ry,RCW,CH,"#F8F8F8");
      ca.strokes=solid("#E0E0E0"); ca.strokeWeight=1; ca.cornerRadius=4;
      const ins=12, daW=RCW-ins*2, daH=CH-12;
      for (let i=0;i<10;i++) { mkRect(p,`Dot ${i}`,RCX+ins+Math.round(i*daW/9)-3,ry+6+Math.round((1-lv[i])*daH)-3,6,6,"#1E1E1E").cornerRadius=3; }
      ry+=CH+6; mkText(p,"Edit curve  ›",RCX,ry,10,"Regular","#2563EB"); ry+=18;
    }

    mkSec(p,"PADDING",RCX,ry); ry+=14; mkDiv(p,RCX,ry,RCW); ry+=10;
    function hSlider(label,value,maxVal) {
      const LW=60,VW=28,TRW=RCW-LW-VW-4,TX=RCX+LW,FW=Math.round((value/maxVal)*TRW),TD=12;
      mkText(p,label,RCX,ry+8,11,"Regular","#333333");
      mkRect(p,label+" track",TX,ry+11,TRW,4,"#D8D8D8").cornerRadius=2;
      if (FW>0) { const fi=mkRect(p,label+" fill",TX,ry+11,FW,4,"#1E1E1E"); fi.topLeftRadius=2; fi.bottomLeftRadius=2; }
      const th=mkRect(p,label+" thumb",TX+FW-TD/2,ry+11-(TD-4)/2,TD,TD,"#1E1E1E");
      th.cornerRadius=6; th.strokes=solid("#FFFFFF"); th.strokeWeight=2;
      mkText(p,value+"%",TX+TRW+4,ry+6,11,"Medium","#1E1E1E");
    }
    hSlider("Light",12,30); ry+=30; hSlider("Dark",8,30); ry+=34;

    mkDiv(p,RCX,ry,RCW); ry+=8; mkSec(p,"SWATCH STYLE",RCX,ry); ry+=14; mkDiv(p,RCX,ry,RCW); ry+=10;
    mkText(p,"Shape",RCX,ry+5,11,"Regular","#333333");
    const TGW=100,TGX=RCX+RCW-TGW;
    mkRect(p,"Shape toggle bg",TGX,ry,TGW,24,"#E0E0E0").cornerRadius=4;
    if (sa==="Round") {
      const pill=mkRect(p,"Round pill",TGX,ry,TGW/2,24,"#1E1E1E");
      pill.topLeftRadius=4; pill.bottomLeftRadius=4; pill.topRightRadius=0; pill.bottomRightRadius=0;
      mkText(p,"Round",TGX+6,ry+7,9,"Medium","#FFFFFF"); mkText(p,"Square",TGX+TGW/2+6,ry+7,9,"Regular","#666666");
    } else {
      const pill=mkRect(p,"Square pill",TGX+TGW/2,ry,TGW/2,24,"#1E1E1E");
      pill.topRightRadius=4; pill.bottomRightRadius=4; pill.topLeftRadius=0; pill.bottomLeftRadius=0;
      mkText(p,"Round",TGX+6,ry+7,9,"Regular","#666666"); mkText(p,"Square",TGX+TGW/2+6,ry+7,9,"Medium","#FFFFFF");
    }
    ry+=32;
    function toggleRow(label,on) {
      mkText(p,label,RCX,ry+4,11,"Regular","#333333"); const tX=RCX+RCW-32;
      mkRect(p,label+" toggle",tX,ry,32,18,on?"#1E1E1E":"#D0D0D0").cornerRadius=9;
      mkRect(p,label+" knob",on?tX+16:tX+2,ry+2,14,14,"#FFFFFF").cornerRadius=7;
    }
    toggleRow("Step labels",stepL); ry+=26; toggleRow("A11y badges",a11y); ry+=30;

    mkDiv(p,RCX,ry,RCW); ry+=8; mkSec(p,"APPLY TO FIGMA",RCX,ry); ry+=14; mkDiv(p,RCX,ry,RCW); ry+=10;
    function checkRow(label,checked) {
      const cb=mkRect(p,label+" cb",RCX,ry+1,14,14,checked?"#1E1E1E":"#FFFFFF");
      cb.cornerRadius=3; cb.strokes=solid(checked?"#1E1E1E":"#C0C0C0"); cb.strokeWeight=1.5;
      if (checked) mkText(p,"✓",RCX+2,ry,11,"Bold","#FFFFFF");
      mkText(p,label,RCX+20,ry+2,11,"Regular","#333333");
    }
    checkRow("Colour styles",styChk); ry+=22; checkRow("Colour variables",varChk); ry+=26;
    mkText(p,"Collection",RCX,ry,10,"Regular","#999999"); ry+=14;
    const dd=mkRect(p,"Collection dropdown",RCX,ry,RCW,30,"#FFFFFF");
    dd.strokes=solid("#D0D0D0"); dd.strokeWeight=1; dd.cornerRadius=5;
    mkText(p,coll||"Choose collection…",RCX+8,ry+8,11,"Regular",coll?"#1E1E1E":"#AAAAAA");
    mkText(p,"▾",RCX+RCW-16,ry+9,11,"Regular","#888888");
    if (colOp) {
      const dH=88, dY=ry-dH;
      const drop=mkRect(p,"Collection menu",RCX,dY,RCW,dH,"#FFFFFF");
      drop.strokes=solid("#D0D0D0"); drop.strokeWeight=1; drop.cornerRadius=5;
      drop.effects=[{type:"DROP_SHADOW",color:{r:0,g:0,b:0,a:0.12},offset:{x:0,y:-4},radius:8,spread:0,visible:true,blendMode:"NORMAL"}];
      const COLS=["My Library","Typography Tokens","Colour System"];
      for (let i=0;i<COLS.length;i++) {
        if (i===0) mkRect(p,"Menu item bg",RCX,dY+i*28,RCW,28,"#F2F2F2");
        mkText(p,COLS[i],RCX+10,dY+i*28+8,11,i===0?"Medium":"Regular",i===0?"#1E1E1E":"#444444");
      }
    }
    ry+=38;
    mkRect(p,"Apply to Figma",RCX,ry,RCW,36,appEn?"#1E1E1E":"#AAAAAA").cornerRadius=6;
    mkText(p,"Apply to Figma",RCX+Math.round((RCW-76)/2),ry+11,12,"Medium","#FFFFFF");
  }

  function mkPaletteEditor(name,xPos,project,palette,lcCfg,rcCfg) {
    const f=mkFrame(name,xPos,0,W,H,"#F2F2F2");
    mkBreadcrumbHdr(f,project,palette);
    mkRect(f,"Column divider",RCX-7,HDR_H+8,1,H-HDR_H-16,"#D8D8D8");
    drawLeftCol(f,lcCfg); drawRightCol(f,rcCfg); return f;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 2a — Default palette editor (baseline reference)
  // ═══════════════════════════════════════════════════════════════════════════
  const s2a=mkPaletteEditor(
    "Screen 2a — Neutral (default)", PITCH*6, "Acme Corp", "Neutral", {}, {}
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 2b — Curve editor expanded inline
  // Right column shows the Sliders tab + 10 vertical sliders.
  // Content overflows the 620px frame height (Apply is below the fold) —
  // this is intentional: it demonstrates the scrollable right panel.
  // ═══════════════════════════════════════════════════════════════════════════
  const s2b=mkPaletteEditor(
    "Screen 2b — Neutral (curve expanded)", PITCH*7, "Acme Corp", "Neutral",
    {},
    { curveExpanded:true }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 2c — After curve edit
  // Steeper lightness descent applied. Left column neutral ramp updates to
  // show the changed values; compact curve dots reflect the new shape.
  // ═══════════════════════════════════════════════════════════════════════════
  const s2c=mkPaletteEditor(
    "Screen 2c — Neutral (after curve edit)", PITCH*8, "Acme Corp", "Neutral",
    { lvals:LVALS_EDITED },
    { lvals:LVALS_EDITED }
  );

  figma.viewport.scrollAndZoomIntoView([s2a,s2b,s2c]);
  console.log('✓ Added Screens 2a, 2b, 2c (neutral detail states) to "Wireframes — Harmoni Plugin".');

})().catch(err => console.error("Wireframe error:", err.message));
