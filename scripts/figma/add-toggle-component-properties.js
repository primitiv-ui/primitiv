/**
 * add-toggle-component-properties.js
 *
 * Adds TEXT "Label" and BOOLEAN "Leading Icon" component properties to the
 * Toggle component set, then binds them to the matching layers inside every
 * Toggle variant.
 *
 * This is a prerequisite for property forwarding in Toggle Group: once Toggle
 * has these component properties, selecting a Toggle instance inside ToggleGroup
 * shows a link/chain icon (◇) next to each property in the right panel,
 * enabling manual forwarding to the ToggleGroup level.
 *
 * Bindings:
 *   Label        TEXT    → "Label" (TEXT) node inside each variant
 *   Leading Icon BOOLEAN → "Icon"  (INSTANCE) node's visibility inside each variant
 *
 * Re-run safe: skips properties that already exist.
 *
 * ─── Usage ───────────────────────────────────────────────────────────────────
 *  1. Navigate to the Toggle page in Figma.
 *  2. Open the developer console (⌘⌥I), type  allow pasting  and press Enter.
 *  3. Paste this script and press Enter.
 * ─────────────────────────────────────────────────────────────────────────────
 */
(async function () {

  // ── Find the Toggle component set ────────────────────────────────────────────
  const componentSet = figma.currentPage.findOne(
    n => n.type === 'COMPONENT_SET' && n.name === 'Toggle'
  );
  if (!componentSet) {
    console.error('Toggle component set not found. Make sure you are on the Toggle page.');
    return;
  }
  console.log(`Found: "${componentSet.name}" (${componentSet.children.length} variants)`);

  // ── Inspect one variant to confirm layer names ────────────────────────────────
  const refVariant = componentSet.children.find(
    v => v.type === 'COMPONENT' && v.name.includes('Size=md') && v.name.includes('State=off')
  ) || componentSet.children.find(v => v.type === 'COMPONENT');

  if (refVariant) {
    const all = refVariant.findAll(() => true);
    console.log('Layers in reference variant:', all.map(n => `"${n.name}" (${n.type})`).join(', '));
  }

  // ── Add or reuse Label (TEXT) property ───────────────────────────────────────
  const defs = componentSet.componentPropertyDefinitions;

  const existingLabelKey   = Object.keys(defs).find(k => k === 'Label' || k.startsWith('Label#'));
  const existingIconKey    = Object.keys(defs).find(k => k === 'Leading Icon' || k.startsWith('Leading Icon#'));

  let labelPropId, iconPropId;

  if (existingLabelKey) {
    labelPropId = existingLabelKey;
    console.log('Reusing TEXT property:', labelPropId);
  } else {
    labelPropId = componentSet.addComponentProperty('Label', 'TEXT', 'Label');
    console.log('Added TEXT property:', labelPropId);
  }

  if (existingIconKey) {
    iconPropId = existingIconKey;
    console.log('Reusing BOOLEAN property:', iconPropId);
  } else {
    iconPropId = componentSet.addComponentProperty('Leading Icon', 'BOOLEAN', false);
    console.log('Added BOOLEAN property:', iconPropId);
  }

  // ── Bind properties in every Toggle variant ──────────────────────────────────
  // Toggle variants are ComponentNodes — their children are direct layers, NOT
  // instance sublayers, so componentPropertyReferences CAN be set here.
  let boundLabel = 0, boundIcon = 0, missingLabel = 0, missingIcon = 0;

  for (const variant of componentSet.children) {
    if (variant.type !== 'COMPONENT') continue;

    // Label text node
    const textNode = variant.findOne(n => n.type === 'TEXT' && n.name === 'Label')
      ?? variant.findOne(n => n.type === 'TEXT');

    if (textNode) {
      textNode.componentPropertyReferences = {
        ...textNode.componentPropertyReferences,
        characters: labelPropId,
      };
      boundLabel++;
    } else {
      missingLabel++;
      console.warn('No TEXT node in variant:', variant.name);
    }

    // Icon layer visibility
    const iconLayer = variant.findOne(n => n.name === 'Icon' && n.type === 'INSTANCE')
      ?? variant.findOne(n => n.type !== 'TEXT' && n.name.toLowerCase().includes('icon'));

    if (iconLayer) {
      iconLayer.componentPropertyReferences = {
        ...iconLayer.componentPropertyReferences,
        visible: iconPropId,
      };
      boundIcon++;
    } else {
      missingIcon++;
      if (variant === refVariant) {
        const all = variant.findAll(() => true);
        console.warn(
          'No icon layer in reference variant. All layers:',
          all.map(n => `"${n.name}" (${n.type})`).join(', ')
        );
      }
    }
  }

  console.log(
    `Done.  label bindings: ${boundLabel}  icon bindings: ${boundIcon}` +
    (missingLabel ? `  missing label: ${missingLabel}` : '') +
    (missingIcon  ? `  missing icon: ${missingIcon}`  : '')
  );
  console.log('Next: on the Toggle Group page, double-click a variant, select Item 1 — Label and Leading Icon should now show link icons (◇) for forwarding.');

})().catch(err => console.error('Script error:', err.message));
