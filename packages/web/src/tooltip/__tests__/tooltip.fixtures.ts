/**
 * Shared Tooltip markup for the element tests: one function, pure string
 * output, mirroring how `popover.fixtures.ts` keeps its suites' data in one place.
 */
export type TooltipFixture = {
  open?: boolean;
  id?: string;
  contentId?: string;
  /** Root attributes, verbatim (` delay-duration="0"`). */
  attrs?: string;
};

export const LABEL = "Save";
export const TIP = "Saves your work";

export function tooltipHtml({ open, id, contentId, attrs = "" }: TooltipFixture = {}): string {
  return (
    `<primitiv-tooltip${id ? ` id="${id}"` : ""}${open ? " open" : ""}${attrs}>` +
    `<primitiv-tooltip-trigger><button type="button">${LABEL}</button></primitiv-tooltip-trigger>` +
    `<primitiv-tooltip-content${contentId ? ` id="${contentId}"` : ""} popover="manual">${TIP}` +
    `<primitiv-tooltip-arrow></primitiv-tooltip-arrow></primitiv-tooltip-content></primitiv-tooltip>`
  );
}
