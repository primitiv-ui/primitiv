/**
 * Shared Modal markup for the element tests: one function, pure string output,
 * mirroring how `collapsible.fixtures.ts` keeps its suites' data in one place.
 */
export type ModalFixture = {
  open?: boolean;
  /** An id for the root. */
  id?: string;
  /** Ids to pre-render on the trigger's button, the dialog, the heading and the paragraph. */
  triggerId?: string;
  dialogId?: string;
  titleId?: string;
  descriptionId?: string;
  /** Leave the title or description out. */
  noTitle?: boolean;
  noDescription?: boolean;
};

export const OPEN = "Open";
export const TITLE = "Payment";
export const DESCRIPTION = "Enter your card details.";
export const CLOSE = "Cancel";

const id = (value: string | undefined) => (value ? ` id="${value}"` : "");

export function modalHtml({
  open,
  id: rootId,
  triggerId,
  dialogId,
  titleId,
  descriptionId,
  noTitle,
  noDescription,
}: ModalFixture = {}): string {
  return (
    `<primitiv-modal${id(rootId)}${open ? " open" : ""}>` +
    `<primitiv-modal-trigger><button type="button"${id(triggerId)}>${OPEN}</button></primitiv-modal-trigger>` +
    `<primitiv-modal-content><dialog${id(dialogId)}>` +
    (noTitle ? "" : `<primitiv-modal-title><h2${id(titleId)}>${TITLE}</h2></primitiv-modal-title>`) +
    (noDescription
      ? ""
      : `<primitiv-modal-description><p${id(descriptionId)}>${DESCRIPTION}</p></primitiv-modal-description>`) +
    `<input aria-label="Card number">` +
    `<primitiv-modal-close><button type="button">${CLOSE}</button></primitiv-modal-close>` +
    `</dialog></primitiv-modal-content></primitiv-modal>`
  );
}
