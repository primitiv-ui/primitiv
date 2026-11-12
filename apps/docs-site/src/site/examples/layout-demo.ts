/**
 * Demo chrome for the layout pages' Elements previews.
 *
 * A layout primitive paints nothing, so its preview needs children with a
 * visible boundary. The snippets show plain `<div>`s (the boxes' styling is not
 * what the component does), and the preview swaps each bare `<div>` for one
 * carrying this style — the same treatment the React previews give their
 * `Cell`s.
 */
export const CELL_STYLE = [
  "padding: var(--primitiv-space-8) var(--primitiv-space-12)",
  "background: var(--primitiv-surface-raised)",
  "border: var(--primitiv-border-width-1) solid var(--primitiv-border-subtle)",
  "border-radius: var(--primitiv-radii-8)",
  "color: var(--primitiv-content-secondary)",
  "white-space: nowrap",
].join("; ");

/** Styles every attribute-less `<div>` in `code` as a demo cell. */
export const withDemoCells = (code: string, style: string = CELL_STYLE) =>
  code.replaceAll("<div>", `<div style="${style}">`);

/** Adds an inline style to the first element carrying `rootClass`. */
export const withRootStyle = (code: string, rootClass: string, style: string) =>
  code.replace(`class="${rootClass}`, `style="${style}" class="${rootClass}`);
