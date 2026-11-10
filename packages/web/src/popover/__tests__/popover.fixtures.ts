/**
 * Shared Popover markup for the element tests: one function, pure string
 * output, mirroring how `modal.fixtures.ts` keeps its suites' data in one place.
 */
export type PopoverFixture = {
  open?: boolean;
  id?: string;
  /** Ids to pre-render on the trigger's button, the panel, the heading and the paragraph. */
  triggerId?: string;
  contentId?: string;
  titleId?: string;
  descriptionId?: string;
  /** Leave the title or description out. */
  noTitle?: boolean;
  noDescription?: boolean;
  /** Render an anchor around this element. */
  anchor?: boolean;
  /** Pre-render the content's own attributes, as a server that knows the contract would. */
  prerendered?: boolean;
};

export const OPEN = "Edit";
export const TITLE = "Profile";
export const DESCRIPTION = "Update your display name.";
export const CLOSE = "Done";

const id = (value: string | undefined) => (value ? ` id="${value}"` : "");

export function popoverHtml({
  open,
  id: rootId,
  triggerId,
  contentId,
  titleId,
  descriptionId,
  noTitle,
  noDescription,
  anchor,
}: PopoverFixture = {}): string {
  return (
    `<primitiv-popover${id(rootId)}${open ? " open" : ""}>` +
    (anchor ? `<primitiv-popover-anchor><span>Field</span></primitiv-popover-anchor>` : "") +
    `<primitiv-popover-trigger><button type="button"${id(triggerId)}>${OPEN}</button></primitiv-popover-trigger>` +
    `<primitiv-popover-content${id(contentId)} popover="auto">` +
    (noTitle ? "" : `<primitiv-popover-title><h2${id(titleId)}>${TITLE}</h2></primitiv-popover-title>`) +
    (noDescription
      ? ""
      : `<primitiv-popover-description><p${id(descriptionId)}>${DESCRIPTION}</p></primitiv-popover-description>`) +
    `<input aria-label="Display name">` +
    `<primitiv-popover-close><button type="button">${CLOSE}</button></primitiv-popover-close>` +
    `</primitiv-popover-content></primitiv-popover>`
  );
}
