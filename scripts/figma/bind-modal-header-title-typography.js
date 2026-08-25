// Bind Modal/Header title text typography inline to Context label/* variables.
//
// Rule: component text nodes must bind typography inline to Context collection
// variables, never via text styles. Text styles have no mode-override support
// and always resolve at the default density (Compact), so a title inside a
// Dense-mode frame would still render at Compact values. Inline bindings
// resolve correctly at whichever density the containing frame is set to.
//
// No new variables are needed. label/{size}/* already exists in Context:
//   Khand SemiBold, density-responsive, five size slots xs–xl.
//
// Mapping: Modal/Header Size=sm → label/sm, md → label/md, lg → label/lg, xl → label/xl
//
// Fields bound per text node:
//   fontSize    → label/{size}/font-size    (FLOAT)
//   fontStyle   → label/{size}/font-style   (STRING, "SemiBold")
//   fontFamily  → label/{size}/font-family  (STRING, "Khand")
//   lineHeight  → label/{size}/line-height  (FLOAT)
//
// The title text node is identified via its componentPropertyReferences.characters
// binding to the "Title" TEXT property — safer than matching by layer name.
//
// Modal/Header set: 435:9450
// Context collection: VariableCollectionId:369:31958

(async function () {
  const HEADER_SET_ID         = '435:9450';
  const CONTEXT_COLLECTION_ID = 'VariableCollectionId:369:31958';

  const LABEL_FIELDS = ['font-size', 'font-style', 'font-family', 'line-height'];
  // Maps Context variable name suffix to the Figma text node field name
  const FIELD_MAP = {
    'font-size':   'fontSize',
    'font-style':  'fontStyle',
    'font-family': 'fontFamily',
    'line-height': 'lineHeight',
  };
  const SIZE_ORDER = ['sm', 'md', 'lg', 'xl'];

  // ── 1. Build label/{size}/{field} → Variable map from Context collection ─
  const contextCollection = await figma.variables.getVariableCollectionByIdAsync(CONTEXT_COLLECTION_ID);
  if (!contextCollection) throw new Error('Context collection not found');

  // labelVars['md']['font-size'] = Variable
  const labelVars = {};
  for (const varId of contextCollection.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(varId);
    if (!v) continue;
    const m = v.name.match(/^label\/(\w+)\/(font-size|font-style|font-family|line-height)$/);
    if (!m) continue;
    const [, size, field] = m;
    if (!labelVars[size]) labelVars[size] = {};
    labelVars[size][field] = v;
  }

  for (const size of SIZE_ORDER) {
    const fields = labelVars[size] ? Object.keys(labelVars[size]) : [];
    console.log(`label/${size}/: found ${fields.length} fields — ${fields.join(', ')}`);
  }

  // ── 2. Find title text node in each Modal/Header variant and bind ────────
  const headerSet = await figma.getNodeByIdAsync(HEADER_SET_ID);
  if (!headerSet || headerSet.type !== 'COMPONENT_SET') throw new Error('Modal/Header set not found');

  for (const variant of headerSet.children) {
    if (variant.type !== 'COMPONENT') continue;

    const sizeMatch = variant.name.match(/Size=(\w+)/);
    if (!sizeMatch) { console.warn(`Skipping: ${variant.name}`); continue; }
    const sz = sizeMatch[1];

    const vars = labelVars[sz];
    if (!vars) { console.warn(`No label/${sz}/* variables found — skipping ${variant.name}`); continue; }

    // Locate the title text node via its TEXT property reference
    const titleNode = variant.findOne(n =>
      n.type === 'TEXT' &&
      n.componentPropertyReferences?.characters?.startsWith('Title')
    );

    if (!titleNode) {
      console.warn(`No title text node found in ${variant.name} — check layer name or property key`);
      continue;
    }

    let bound = 0;
    for (const field of LABEL_FIELDS) {
      const variable = vars[field];
      const nodeField = FIELD_MAP[field];
      if (!variable) { console.warn(`  label/${sz}/${field} missing`); continue; }
      titleNode.setBoundVariable(nodeField, variable);
      bound++;
    }

    console.log(`✓ Modal/Header ${variant.name} — title bound to label/${sz}/* (${bound} fields)`);
  }

  figma.viewport.scrollAndZoomIntoView([headerSet]);
  console.log('Done — Modal/Header title typography bound inline to Context label/* variables.');
})().catch(err => console.error(err.message, err.stack));
