/**
 * cleanup-toggle-group-unbound-properties.js
 *
 * Removes the unbound "Item N · Label" and "Item N · Leading Icon" properties
 * that were added by forward-toggle-group-properties.js but could not be bound
 * (Figma API restriction: cannot set componentPropertyReferences on instance sublayers).
 *
 * ─── Usage ───────────────────────────────────────────────────────────────────
 *  1. Navigate to the Toggle Group page in Figma.
 *  2. Open the developer console and paste this script.
 * ─────────────────────────────────────────────────────────────────────────────
 */
(async function () {

  const componentSet = figma.currentPage.findOne(
    n => n.type === 'COMPONENT_SET' && n.name === 'Toggle Group'
  );
  if (!componentSet) {
    console.error('Toggle Group component set not found.');
    return;
  }

  const defs = componentSet.componentPropertyDefinitions;
  const toDelete = Object.keys(defs).filter(k =>
    /^Item \d+ · (Label|Leading Icon)/.test(k)
  );

  if (toDelete.length === 0) {
    console.log('Nothing to remove.');
    return;
  }

  for (const key of toDelete) {
    componentSet.deleteComponentProperty(key);
    console.log('Removed:', key);
  }

  console.log(`Done. ${toDelete.length} properties removed.`);

})().catch(err => console.error('Script error:', err.message));
