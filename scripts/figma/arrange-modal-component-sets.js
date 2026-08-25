// Arrange + Label: Modal/Header, Modal/Body, Modal/Footer, Modal
//
// All four sets have only a Size axis (sm|md|lg|xl) — no Variant or State axes.
// Convention: Size rows stacked vertically, md first (top = default instance).
// EDGE_PAD = 24 for breathing room; no focus rings on these surface components.
//
// Node IDs (session-stable — re-run figma_search_components if these change):
//   Modal/Header  435:9450
//   Modal/Body    435:10108
//   Modal/Footer  435:10161
//   Modal         435:10250
//
// Run via figma_execute or paste into the Figma developer console.

const EDGE_PAD  = 24;
const GAP_SIZE  = 20;
const LABEL_FONT    = { family: 'Inter', style: 'Regular' };
const LABEL_SIZE_PX = 11;
const LABEL_COLOR   = { r: 0.533, g: 0.533, b: 0.533 };
const LABEL_LEFT_PX = 56;
const SIZE_ORDER    = ['md', 'sm', 'lg', 'xl']; // md first → default instance

await figma.loadFontAsync(LABEL_FONT);

function parseSize(name) { return name.match(/Size=(\w+)/)?.[1] ?? ''; }

async function arrangeModalSet(setId, groupName) {
  const compSet = await figma.getNodeByIdAsync(setId);
  if (!compSet || compSet.type !== 'COMPONENT_SET') {
    console.error(`Not found or wrong type: ${setId}`);
    return;
  }

  // Remove existing label group (re-run safety)
  const existing = figma.currentPage.findOne(n => n.name === groupName);
  if (existing) existing.remove();

  const variants = [...compSet.children]
    .filter(c => c.type === 'COMPONENT')
    .sort((a, b) => {
      const ai = SIZE_ORDER.indexOf(parseSize(a.name));
      const bi = SIZE_ORDER.indexOf(parseSize(b.name));
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

  const maxW = Math.max(...variants.map(v => v.width));
  let y = EDGE_PAD;
  const rowData = [];

  for (const v of variants) {
    v.x = EDGE_PAD;
    v.y = y;
    rowData.push({ sz: parseSize(v.name), midY: y + v.height / 2 });
    y += v.height + GAP_SIZE;
  }

  compSet.resize(maxW + EDGE_PAD * 2, y - GAP_SIZE + EDGE_PAD);

  // Default instance: md at index 0
  const mdVar = variants.find(v => parseSize(v.name) === 'md');
  if (mdVar) compSet.insertChild(0, mdVar);

  // Size labels to the left of the component set
  const labelNodes = [];
  for (const { sz, midY } of rowData) {
    const lbl = figma.createText();
    lbl.fontName = LABEL_FONT;
    lbl.fontSize = LABEL_SIZE_PX;
    lbl.characters = sz;
    lbl.fills = [{ type: 'SOLID', color: LABEL_COLOR }];
    figma.currentPage.appendChild(lbl);
    lbl.x = compSet.x - LABEL_LEFT_PX;
    lbl.y = compSet.y + midY - lbl.height / 2;
    labelNodes.push(lbl);
  }

  if (labelNodes.length > 0) {
    const grp = figma.group(labelNodes, figma.currentPage);
    grp.name = groupName;
  }

  console.log(`✓ ${compSet.name} — ${variants.length} variants, ${compSet.width}×${compSet.height}`);
}

await arrangeModalSet('435:9450',  'Modal/Header Grid Labels');
await arrangeModalSet('435:10108', 'Modal/Body Grid Labels');
await arrangeModalSet('435:10161', 'Modal/Footer Grid Labels');
await arrangeModalSet('435:10250', 'Modal Grid Labels');
