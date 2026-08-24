/**
 * refresh-view-flow-board.js
 *
 * Re-exports every view on "Harmoni Plugin — Views (v3 design)" and re-fills the
 * matching card on "Harmoni Plugin — View flow (v3)", so the flow board stops
 * showing stale screenshots after a view changes.
 *
 * ─── Why the board is rasters and not live instances ─────────────────────────
 * A Figma instance REFLOWS, it does not SCALE. The board's cards are 170px wide;
 * a raster at that width is a true 0.5x visual reduction, whereas a live instance
 * would be a 170px-wide panel whose text rewraps at full size. A live board would
 * need full-size 360px cards, making it ~7,650px wide — at which point you read it
 * zoomed out and it renders like the rasters anyway. Compact and readable at a
 * glance is the whole point of a flow chart, so the board keeps rasters and this
 * script is the price of that choice. Re-run it after any change to the views.
 *
 * Matching is BY NAME: a board card is a FRAME whose name equals a view's name and
 * which contains a RECTANGLE (named "shot"). Cards with no matching view, and views
 * with no card, are both reported rather than guessed at — the light twins have no
 * cards, which is correct: the board shows the dark set only.
 *
 * The aspect ratios already agree (a 360x900 view into a 170x425 rect, and the
 * hugging 360x865 Canvas swatches into 170x408), so `scaleMode: "FILL"` fits
 * exactly with no cropping. If a view's height changes, resize its card's rect to
 * match the new ratio or FILL will crop.
 *
 * Gotcha carried from building the board: never `exportAsync` a node that sits
 * inside a clipping parent — it captures only the visible region, not the node's
 * full height. These views are top-level on their page, so a plain export is safe.
 *
 * ─── Usage ───────────────────────────────────────────────────────────────────
 *  1. Open the developer console: Plugins → Development → Open console (⌘⌥I).
 *  2. Click in the console input, type  allow pasting  and press Enter.
 *  3. Paste this script and press Enter.
 *  (Or run via figma_execute as-is — it looks pages up by name and needs no
 *   selection. Exporting ~15 views takes a few seconds; raise the tool timeout.)
 * ─────────────────────────────────────────────────────────────────────────────
 */
(async function () {

  const VIEWS_PAGE = "Views (v3 design)";
  const BOARD_PAGE = "View flow";

  const views = figma.root.children.find((p) => p.name.includes(VIEWS_PAGE));
  const board = figma.root.children.find((p) => p.name.includes(BOARD_PAGE));
  if (!views || !board) {
    console.error("Could not find both pages", { views: !!views, board: !!board });
    return;
  }
  await views.loadAsync();
  await board.loadAsync();

  const byName = Object.create(null);
  for (const node of views.children) byName[node.name] = node;

  const refreshed = [];
  const skipped = [];

  for (const card of board.children) {
    if (card.type !== "FRAME") continue;
    const source = byName[card.name];
    if (!source) { skipped.push(`${card.name}: no view of that name`); continue; }

    const rect = card.children.find((k) => k.type === "RECTANGLE");
    if (!rect) { skipped.push(`${card.name}: card has no RECTANGLE to fill`); continue; }

    const bytes = await source.exportAsync({
      format: "PNG",
      constraint: { type: "SCALE", value: 1 },
    });
    const image = figma.createImage(bytes);
    rect.fills = [{ type: "IMAGE", imageHash: image.hash, scaleMode: "FILL" }];

    // Warn when the card's rect no longer matches the view's aspect, since FILL
    // silently crops rather than letterboxing.
    const viewRatio = source.width / source.height;
    const rectRatio = rect.width / rect.height;
    if (Math.abs(viewRatio - rectRatio) > 0.005) {
      skipped.push(
        `${card.name}: filled, but aspect drifted — view ${Math.round(source.width)}x${Math.round(source.height)} ` +
        `vs rect ${Math.round(rect.width)}x${Math.round(rect.height)}; FILL will crop`,
      );
    }
    refreshed.push(card.name);
  }

  const carded = new Set(refreshed);
  const uncarded = views.children
    .filter((n) => !carded.has(n.name) && !n.name.includes("light"))
    .map((n) => n.name);

  console.log(`Refreshed ${refreshed.length} cards:`, refreshed);
  if (skipped.length) console.warn("Needs attention:", skipped);
  if (uncarded.length) console.log("Views with no card on the board:", uncarded);

  return { refreshed, skipped, uncarded };
})();
