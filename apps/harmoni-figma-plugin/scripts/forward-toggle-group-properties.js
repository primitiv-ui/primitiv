/**
 * forward-toggle-group-properties.js
 *
 * Adds flat component properties to the Toggle Group component set and binds
 * them to the corresponding layers inside each nested Toggle instance.
 *
 * Properties added (for each item slot N = 1 … maxCount):
 *   Item N · Label        TEXT     — bound to the first TEXT node inside slot N
 *   Item N · Leading Icon BOOLEAN  — bound to the icon layer's visibility inside slot N
 *
 * This is a flat forwarding approach: no sub-sections appear in the Properties
 * panel, but all item labels and leading-icon toggles surface as named properties
 * on the ToggleGroup without double-clicking into a variant.
 *
 * Re-run safe: skips properties that already exist.
 *
 * ─── Usage ───────────────────────────────────────────────────────────────────
 *  1. Navigate to the Toggle Group page in Figma.
 *  2. Open the developer console: Plugins → Development → Open console (⌘⌥I).
 *  3. Click in the console input, type  allow pasting  and press Enter.
 *  4. Paste this script and press Enter.
 * ─────────────────────────────────────────────────────────────────────────────
 */
(async function () {

  // ── Find the Toggle Group component set ──────────────────────────────────────
  const componentSet = figma.currentPage.findOne(
    n => n.type === 'COMPONENT_SET' && n.name === 'Toggle Group'
  );
  if (!componentSet) {
    console.error('Toggle Group component set not found. Make sure you are on the Toggle Group page.');
    return;
  }
  console.log(`Found: "${componentSet.name}" (${componentSet.children.length} variants)`);

  // ── Determine max item count across all variants ──────────────────────────────
  let maxCount = 0;
  for (const v of componentSet.children) {
    if (v.type !== 'COMPONENT') continue;
    const m = v.name.match(/Count=(\d+)/);
    if (m) maxCount = Math.max(maxCount, parseInt(m[1], 10));
  }
  console.log('Max count:', maxCount);

  // ── Inspect reference variant to discover layer names ────────────────────────
  // Use Count=2/Size=md. Log what we find so the output is human-verifiable.
  const refVariant = componentSet.children.find(
    v => v.type === 'COMPONENT' && v.name.includes('Count=2') && v.name.includes('Size=md')
  );
  if (refVariant) {
    const items = refVariant.children.filter(c => c.type === 'INSTANCE');
    console.log('Item names in Count=2/md:', items.map(i => `"${i.name}"`).join(', '));
    if (items[0]) {
      const flat = items[0].findAll(() => true);
      console.log('Layers inside Item 1:', flat.map(n => `"${n.name}" (${n.type})`).join(', '));
    }
  }

  // ── Add or reuse component properties on the parent set ──────────────────────
  const existingDefs = componentSet.componentPropertyDefinitions;
  const propIds = {};

  for (let i = 1; i <= maxCount; i++) {
    const labelName = `Item ${i} · Label`;
    const iconName  = `Item ${i} · Leading Icon`;

    const existingLabelKey = Object.keys(existingDefs).find(k => k.startsWith(labelName + '#') || k === labelName);
    const existingIconKey  = Object.keys(existingDefs).find(k => k.startsWith(iconName + '#')  || k === iconName);

    if (existingLabelKey) {
      propIds[`label_${i}`] = existingLabelKey;
      console.log(`  reuse TEXT: ${existingLabelKey}`);
    } else {
      const id = componentSet.addComponentProperty(labelName, 'TEXT', `Item ${i}`);
      propIds[`label_${i}`] = id;
      console.log(`  add  TEXT: ${id}`);
    }

    if (existingIconKey) {
      propIds[`icon_${i}`] = existingIconKey;
      console.log(`  reuse BOOLEAN: ${existingIconKey}`);
    } else {
      const id = componentSet.addComponentProperty(iconName, 'BOOLEAN', false);
      propIds[`icon_${i}`] = id;
      console.log(`  add  BOOLEAN: ${id}`);
    }
  }

  // ── Bind properties in every variant ─────────────────────────────────────────
  let boundLabel = 0, boundIcon = 0, missingText = 0, missingIcon = 0;

  for (const variant of componentSet.children) {
    if (variant.type !== 'COMPONENT') continue;
    const countMatch = variant.name.match(/Count=(\d+)/);
    if (!countMatch) continue;
    const count = parseInt(countMatch[1], 10);

    // Items are direct INSTANCE children, in order
    const items = variant.children.filter(c => c.type === 'INSTANCE');

    for (let i = 0; i < Math.min(items.length, maxCount); i++) {
      const slot     = i + 1;
      const instance = items[i];

      // ── Label text binding ──────────────────────────────────────────────────
      const labelId = propIds[`label_${slot}`];
      if (labelId) {
        const textNode = instance.findOne(n => n.type === 'TEXT');
        if (textNode) {
          textNode.componentPropertyReferences = {
            ...textNode.componentPropertyReferences,
            characters: labelId,
          };
          boundLabel++;
        } else {
          missingText++;
          console.warn(`  no TEXT node in ${variant.name} / item ${slot}`);
        }
      }

      // ── Leading icon visibility binding ────────────────────────────────────
      // Icon layer is usually named "icon", "Icon", or contains "icon"/"leading"
      const iconId = propIds[`icon_${slot}`];
      if (iconId) {
        const iconLayer = instance.findOne(n =>
          n.type !== 'TEXT' &&
          (n.name === 'icon' || n.name === 'Icon' ||
           n.name.toLowerCase().includes('icon') ||
           n.name.toLowerCase().includes('leading'))
        );
        if (iconLayer) {
          iconLayer.componentPropertyReferences = {
            ...iconLayer.componentPropertyReferences,
            visible: iconId,
          };
          boundIcon++;
        } else {
          missingIcon++;
          if (variant.name.includes('Size=md') && variant.name.includes('Count=2')) {
            // Log layer names once to help diagnose
            const all = instance.findAll(() => true);
            console.warn(
              `  no icon layer found in ${variant.name} / item ${slot}. ` +
              `Layers: ${all.map(n => `"${n.name}"`).slice(0, 10).join(', ')}`
            );
          }
        }
      }
    }
  }

  console.log(
    `Done.  label bindings: ${boundLabel}  icon bindings: ${boundIcon}` +
    (missingText ? `  missing text: ${missingText}` : '') +
    (missingIcon ? `  missing icon: ${missingIcon}` : '')
  );

})().catch(err => console.error('Script error:', err.message));
