/**
 * Shared Collapsible markup for the element tests: one function, pure string
 * output, mirroring how `accordion.fixtures.ts` keeps its suites' data in one
 * place.
 */
export type CollapsibleFixture = {
  open?: boolean;
  disabled?: boolean;
  forceMount?: boolean;
  /** The panel's `collapsed-height` attribute, verbatim. */
  collapsedHeight?: string;
  /** Ids to pre-render on the trigger's button and the panel. */
  triggerId?: string;
  panelId?: string;
  /** An id for the root. */
  id?: string;
  /** Leave the trigger icon out. */
  noIcon?: boolean;
};

export const LABEL = "Toggle";
export const PANEL = "Hidden content";

export function collapsibleHtml({
  open,
  disabled,
  forceMount,
  collapsedHeight,
  triggerId,
  panelId,
  id,
  noIcon,
}: CollapsibleFixture = {}): string {
  const attrs = [id ? ` id="${id}"` : "", open ? " open" : "", disabled ? " disabled" : ""].join("");
  const panelAttrs = [
    panelId ? ` id="${panelId}"` : "",
    forceMount ? " force-mount" : "",
    collapsedHeight === undefined ? "" : ` collapsed-height="${collapsedHeight}"`,
  ].join("");
  return (
    `<primitiv-collapsible${attrs}><primitiv-collapsible-trigger>` +
    `<button type="button"${triggerId ? ` id="${triggerId}"` : ""}>${LABEL}` +
    (noIcon ? "" : "<primitiv-collapsible-trigger-icon></primitiv-collapsible-trigger-icon>") +
    `</button></primitiv-collapsible-trigger>` +
    `<primitiv-collapsible-content${panelAttrs}>${PANEL}</primitiv-collapsible-content></primitiv-collapsible>`
  );
}
