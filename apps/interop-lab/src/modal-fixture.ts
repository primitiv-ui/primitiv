/** The modal the Modal pages render, read from the URL so one spec drives each page. */
export const MODAL = { open: "Edit profile", title: "Edit profile", close: "Cancel" } as const;

export type ModalFixture = { open: boolean };

export function modalFixtureFromUrl(search: string = location.search): ModalFixture {
  return { open: new URLSearchParams(search).has("open") };
}

/**
 * The plain-HTML rendering, as a server would send it — the `<dialog>` never
 * carries `open` itself, the root does — shared by the html page and the HTMX
 * fragments. `inner` is extra markup placed in the dialog, before the close.
 */
export function modalHtml(
  fixture: Partial<ModalFixture> = {},
  id = "modal",
  { label = MODAL.open, title = MODAL.title, inner = "" }: { label?: string; title?: string; inner?: string } = {},
): string {
  return (
    `<primitiv-modal id="${id}"${fixture.open ? " open" : ""}>` +
    `<primitiv-modal-trigger><button type="button">${label}</button></primitiv-modal-trigger>` +
    `<primitiv-modal-content><dialog>` +
    `<primitiv-modal-title><h2>${title}</h2></primitiv-modal-title>` +
    `<primitiv-modal-description><p>Changes are saved when you close this dialog.</p></primitiv-modal-description>` +
    `<label>Name <input name="name"></label>` +
    inner +
    `<primitiv-modal-close><button type="button">${MODAL.close}</button></primitiv-modal-close>` +
    `</dialog></primitiv-modal-content></primitiv-modal>`
  );
}
