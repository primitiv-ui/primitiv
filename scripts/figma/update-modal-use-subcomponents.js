// Update Modal component set to use Modal/Header, Modal/Body, and Modal/Footer
// subcomponent instances instead of direct frame children.
//
// For each Size variant of the Modal set:
//   1. Captures current width / height so fixed dimensions are restored.
//   2. Removes all existing children.
//   3. Switches to VERTICAL auto-layout (padding 0, gap 0).
//   4. Adds instances: Header (HUG height) → Body (FILL height) → Footer (HUG height).
//   5. All three instances get FILL width so they stretch to the modal width.
//   6. clipsContent = true so sub-instances respect the modal's corner radius.
//
// Node IDs:
//   Modal/Header  435:9450
//   Modal/Body    435:10108
//   Modal/Footer  435:10161
//   Modal         435:10250

(async function () {
  const MODAL_SET_ID  = '435:10250';
  const HEADER_SET_ID = '435:9450';
  const BODY_SET_ID   = '435:10108';
  const FOOTER_SET_ID = '435:10161';

  const [modalSet, headerSet, bodySet, footerSet] = await Promise.all([
    figma.getNodeByIdAsync(MODAL_SET_ID),
    figma.getNodeByIdAsync(HEADER_SET_ID),
    figma.getNodeByIdAsync(BODY_SET_ID),
    figma.getNodeByIdAsync(FOOTER_SET_ID),
  ]);

  function buildSizeMap(compSet) {
    const map = {};
    for (const child of compSet.children) {
      if (child.type !== 'COMPONENT') continue;
      const m = child.name.match(/Size=(\w+)/);
      if (m) map[m[1]] = child;
    }
    return map;
  }

  const headerBySize = buildSizeMap(headerSet);
  const bodyBySize   = buildSizeMap(bodySet);
  const footerBySize = buildSizeMap(footerSet);

  for (const variant of [...modalSet.children]) {
    if (variant.type !== 'COMPONENT') continue;

    const sizeMatch = variant.name.match(/Size=(\w+)/);
    if (!sizeMatch) {
      console.warn(`Skipping variant with unexpected name: ${variant.name}`);
      continue;
    }
    const sz = sizeMatch[1];

    const headerComp = headerBySize[sz];
    const bodyComp   = bodyBySize[sz];
    const footerComp = footerBySize[sz];

    if (!headerComp || !bodyComp || !footerComp) {
      console.warn(`Missing subcomponent for Size=${sz} — skipping`);
      continue;
    }

    // Capture dimensions before mutation
    const w = variant.width;
    const h = variant.height;

    console.log(`Size=${sz}: ${variant.children.length} children, ${w}×${h} — rebuilding...`);

    // Remove all existing children (iterate backwards to avoid index shifts)
    for (let i = variant.children.length - 1; i >= 0; i--) {
      variant.children[i].remove();
    }

    // Switch to vertical auto-layout, zero padding and gap
    variant.layoutMode              = 'VERTICAL';
    variant.paddingTop              = 0;
    variant.paddingBottom           = 0;
    variant.paddingLeft             = 0;
    variant.paddingRight            = 0;
    variant.itemSpacing             = 0;
    variant.primaryAxisAlignItems   = 'MIN';
    variant.counterAxisAlignItems   = 'MIN';
    variant.layoutSizingHorizontal  = 'FIXED';
    variant.layoutSizingVertical    = 'FIXED';
    variant.clipsContent            = true;

    // Restore exact dimensions (layout mode may have reset them)
    variant.resize(w, h);

    // Add subcomponent instances
    const headerInst = headerComp.createInstance();
    const bodyInst   = bodyComp.createInstance();
    const footerInst = footerComp.createInstance();

    variant.appendChild(headerInst);
    variant.appendChild(bodyInst);
    variant.appendChild(footerInst);

    // Width: FILL so all three stretch to the modal's fixed width
    headerInst.layoutSizingHorizontal = 'FILL';
    bodyInst.layoutSizingHorizontal   = 'FILL';
    footerInst.layoutSizingHorizontal = 'FILL';

    // Height: Header and Footer hug their content; Body fills remaining space
    headerInst.layoutSizingVertical = 'HUG';
    bodyInst.layoutSizingVertical   = 'FILL';
    footerInst.layoutSizingVertical = 'HUG';

    console.log(`✓ Size=${sz} — header + body(FILL) + footer composed, ${variant.width}×${variant.height}`);
  }

  figma.viewport.scrollAndZoomIntoView([modalSet]);
  console.log('Done — Modal variants updated to use subcomponents.');
})().catch(err => console.error(err.message, err.stack));
