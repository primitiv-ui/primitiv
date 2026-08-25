/**
 * expose-toggle-group-instances.js
 *
 * Exposes the Toggle slot instances inside every Toggle Group variant so
 * their component properties (Leading Icon, Label, State, etc.) appear in
 * the Properties panel without double-clicking into the component.
 *
 * ─── Usage ───────────────────────────────────────────────────────────────────
 *  1. Navigate to the Toggle Group page in Figma.
 *  2. Open the developer console: Plugins → Development → Open console (⌘⌥I).
 *  3. Click in the console input, type  allow pasting  and press Enter.
 *  4. Paste this script and press Enter.
 * ─────────────────────────────────────────────────────────────────────────────
 */
(async function () {

  const componentSet = figma.currentPage.findOne(
    n => n.type === 'COMPONENT_SET' && n.name === 'Toggle Group'
  );

  if (!componentSet) {
    console.error('Toggle Group component set not found. Make sure you are on the Toggle Group page.');
    return;
  }

  let variantsUpdated = 0, totalExposed = 0;

  for (const comp of componentSet.children) {
    if (comp.type !== 'COMPONENT') continue;

    const instances = comp.children.filter(c => c.type === 'INSTANCE');
    comp.exposedInstances = instances;

    variantsUpdated++;
    totalExposed += instances.length;
  }

  console.log(`Done. ${variantsUpdated} variants updated, ${totalExposed} Toggle instances exposed.`);
  console.log('Toggle properties (Leading Icon, Label, State, Interaction) are now accessible from the Properties panel.');

})();
