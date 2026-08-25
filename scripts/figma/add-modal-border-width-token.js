// Add modal/border-width to the unified Context collection, then bind it to
// the border strokes on Modal/Header, Modal/Footer, and Modal.
//
// modal/border-width is intentionally size-invariant and density-invariant —
// 1px everywhere — matching the framed-control/border-width pattern. It aliases
// border-width/1 from Primitives in all four density modes. It does NOT nest
// under a size group because the value is uniform across sizes.
//
// After the variable is created:
//   Modal/Header variants  — strokeBottomWeight → modal/border-width
//                            (stroke color already bound to border/subtle; leave it)
//   Modal/Footer variants  — strokeTopWeight    → modal/border-width
//                            (stroke color already bound to border/subtle; leave it)
//   Modal variants         — all four side weights → modal/border-width
//                            new stroke paint color bound to border/default
//                            strokeAlign = INSIDE
//
// Context collection: VariableCollectionId:369:31958
// Mode IDs: Dense=369:8  Compact=369:9  Comfortable=369:10  Spacious=369:11
// Modal/Header  435:9450
// Modal/Footer  435:10161
// Modal         435:10250

(async function () {
  const CONTEXT_COLLECTION_ID = 'VariableCollectionId:369:31958';
  const MODE_IDS              = ['369:8', '369:9', '369:10', '369:11'];
  const HEADER_SET_ID         = '435:9450';
  const FOOTER_SET_ID         = '435:10161';
  const MODAL_SET_ID          = '435:10250';
  const NEW_VAR_NAME          = 'modal/border-width';

  // ── 1. Locate border-width/1 in Primitives ─────────────────────────────
  const allCollections = await figma.variables.getLocalVariableCollectionsAsync();

  const primitivesCollection = allCollections.find(c => c.name === 'Primitives');
  if (!primitivesCollection) throw new Error('Primitives collection not found');

  let borderWidth1Var = null;
  for (const varId of primitivesCollection.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(varId);
    if (v?.name === 'border-width/1') { borderWidth1Var = v; break; }
  }
  if (!borderWidth1Var) throw new Error('border-width/1 not found in Primitives');
  console.log(`border-width/1 → ${borderWidth1Var.id}`);

  // ── 2. Locate border/default in Intent (for Modal outer stroke color) ───
  const intentCollection = allCollections.find(c => c.name === 'Intent');
  if (!intentCollection) throw new Error('Intent collection not found');

  let borderDefaultVar = null;
  for (const varId of intentCollection.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(varId);
    if (v?.name === 'border/default') { borderDefaultVar = v; break; }
  }
  if (!borderDefaultVar) throw new Error('border/default not found in Intent');
  console.log(`border/default → ${borderDefaultVar.id}`);

  // ── 3. Get or create modal/border-width in Context collection ───────────
  const contextCollection = await figma.variables.getVariableCollectionByIdAsync(CONTEXT_COLLECTION_ID);
  if (!contextCollection) throw new Error('Context collection not found');

  let modalBorderWidthVar = null;
  for (const varId of contextCollection.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(varId);
    if (v?.name === NEW_VAR_NAME) { modalBorderWidthVar = v; break; }
  }

  if (modalBorderWidthVar) {
    console.log(`modal/border-width already exists (${modalBorderWidthVar.id}) — updating aliases`);
  } else {
    modalBorderWidthVar = figma.variables.createVariable(NEW_VAR_NAME, contextCollection, 'FLOAT');
    console.log(`Created modal/border-width → ${modalBorderWidthVar.id}`);
  }

  for (const modeId of MODE_IDS) {
    modalBorderWidthVar.setValueForMode(modeId, figma.variables.createVariableAlias(borderWidth1Var));
  }
  console.log('✓ modal/border-width aliased to border-width/1 in Dense / Compact / Comfortable / Spacious');

  // ── 4. Modal/Header — rebind strokeBottomWeight; leave stroke color alone ─
  const headerSet = await figma.getNodeByIdAsync(HEADER_SET_ID);
  if (!headerSet || headerSet.type !== 'COMPONENT_SET') throw new Error('Modal/Header set not found');

  for (const variant of headerSet.children) {
    if (variant.type !== 'COMPONENT') continue;
    variant.setBoundVariable('strokeBottomWeight', modalBorderWidthVar);
    console.log(`✓ Modal/Header ${variant.name} — strokeBottomWeight → modal/border-width`);
  }

  // ── 5. Modal/Footer — rebind strokeTopWeight; leave stroke color alone ───
  const footerSet = await figma.getNodeByIdAsync(FOOTER_SET_ID);
  if (!footerSet || footerSet.type !== 'COMPONENT_SET') throw new Error('Modal/Footer set not found');

  for (const variant of footerSet.children) {
    if (variant.type !== 'COMPONENT') continue;
    variant.setBoundVariable('strokeTopWeight', modalBorderWidthVar);
    console.log(`✓ Modal/Footer ${variant.name} — strokeTopWeight → modal/border-width`);
  }

  // ── 6. Modal — apply full border with border/default color ──────────────
  const modalSet = await figma.getNodeByIdAsync(MODAL_SET_ID);
  if (!modalSet || modalSet.type !== 'COMPONENT_SET') throw new Error('Modal set not found');

  const borderPaint = {
    type: 'SOLID',
    color: { r: 0, g: 0, b: 0 }, // placeholder; variable binding resolves the colour
    boundVariables: {
      color: { type: 'VARIABLE_ALIAS', id: borderDefaultVar.id },
    },
  };

  for (const variant of modalSet.children) {
    if (variant.type !== 'COMPONENT') continue;

    variant.strokes     = [borderPaint];
    variant.strokeAlign = 'INSIDE';

    variant.setBoundVariable('strokeTopWeight',    modalBorderWidthVar);
    variant.setBoundVariable('strokeBottomWeight', modalBorderWidthVar);
    variant.setBoundVariable('strokeLeftWeight',   modalBorderWidthVar);
    variant.setBoundVariable('strokeRightWeight',  modalBorderWidthVar);

    console.log(`✓ Modal ${variant.name} — border/default stroke applied, all weights → modal/border-width`);
  }

  figma.viewport.scrollAndZoomIntoView([modalSet]);
  console.log('Done — modal/border-width created and applied to Header / Footer / Modal.');
})().catch(err => console.error(err.message, err.stack));
