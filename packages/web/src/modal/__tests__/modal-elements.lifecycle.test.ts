import userEvent from "@testing-library/user-event";

import { defineModal } from "../elements";
import { modalHtml } from "./modal.fixtures";
import { dialog, mount, root, settle, trigger } from "./mount";

afterEach(() => {
  document.body.replaceChildren();
});

describe("<primitiv-modal> lifecycle", () => {
  it("picks up a title added after it rendered", async () => {
    // Arrange
    await mount(modalHtml({ id: "pay", noTitle: true }));

    // Act
    dialog().insertAdjacentHTML("afterbegin", "<primitiv-modal-title><h2>Late</h2></primitiv-modal-title>");
    await settle();

    // Assert
    expect(dialog().getAttribute("aria-labelledby")).toBe("pay-title");
  });

  it("drops the name once the title leaves", async () => {
    // Arrange
    await mount(modalHtml());

    // Act
    document.querySelector("primitiv-modal-title")!.remove();
    await settle();

    // Assert
    expect(dialog().hasAttribute("aria-labelledby")).toBe(false);
  });

  it("adopts a dialog that arrives after the root, and opens it", async () => {
    // Arrange
    await mount(
      `<primitiv-modal open><primitiv-modal-trigger><button type="button">Open</button></primitiv-modal-trigger></primitiv-modal>`,
    );

    // Act
    root().insertAdjacentHTML("beforeend", "<primitiv-modal-content><dialog>Late</dialog></primitiv-modal-content>");
    await settle();

    // Assert
    expect(dialog().open).toBe(true);
    expect(trigger().getAttribute("aria-controls")).toBe(dialog().id);
  });

  it("listens to a replacement dialog, and no longer to the old one", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(modalHtml({ open: true }));
    const old = dialog();

    // Act
    old.parentElement!.replaceChildren(Object.assign(document.createElement("dialog"), { textContent: "New" }));
    await settle();
    old.dispatchEvent(new Event("cancel", { cancelable: true }));
    await settle();
    const afterOld = root().hasAttribute("open");
    dialog().dispatchEvent(new Event("cancel", { cancelable: true }));
    await settle();

    // Assert
    expect(afterOld).toBe(true);
    expect(root().hasAttribute("open")).toBe(false);
    await user.click(trigger());
    expect(dialog().open).toBe(true);
  });

  it("forgets its dialog once the content holds none", async () => {
    // Arrange
    await mount(modalHtml({ open: true }));
    const old = dialog();

    // Act
    document.querySelector("primitiv-modal-content")!.replaceChildren();
    await settle();
    old.dispatchEvent(new Event("cancel", { cancelable: true }));
    await settle();

    // Assert
    expect(root().hasAttribute("open")).toBe(true);
    expect(trigger().hasAttribute("aria-controls")).toBe(false);
  });

  it("stops opening from its trigger once removed from the document", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(modalHtml());
    const element = root();
    const button = trigger();

    // Act
    element.remove();
    await user.click(button);

    // Assert
    expect(element.hasAttribute("open")).toBe(false);
  });

  it("stops responding once removed from the document, closing its dialog", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(modalHtml({ open: true }));
    const element = root();
    const button = trigger();
    const box = dialog();

    // Act
    element.remove();
    box.dispatchEvent(new Event("cancel", { cancelable: true }));
    await user.click(button);
    await settle();

    // Assert
    expect(box.open).toBe(false);
    expect(element.hasAttribute("open")).toBe(true);
  });

  it("reopens its dialog modally when moved while open", async () => {
    // Arrange
    await mount(modalHtml({ open: true }) + "<div id='elsewhere'></div>");
    const showModal = vi.spyOn(dialog(), "showModal");

    // Act
    document.getElementById("elsewhere")!.append(root());
    await settle();

    // Assert
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(dialog().open).toBe(true);
  });

  it("reopens modally a dialog restored with open on it, as a history snapshot has it", async () => {
    // Arrange
    const snapshot = modalHtml({ open: true }).replace("<dialog>", "<dialog open>");
    defineModal();
    const showModal = vi.spyOn(HTMLDialogElement.prototype, "showModal");

    // Act
    document.body.innerHTML = snapshot;
    await settle();

    // Assert
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(dialog().open).toBe(true);
    showModal.mockRestore();
  });

  it("announces nothing and stays open when moved while open", async () => {
    // Arrange
    const seen: boolean[] = [];
    const listening = new AbortController();
    document.addEventListener(
      "primitiv-modal-change",
      (event) => seen.push((event as CustomEvent<{ open: boolean }>).detail.open),
      { signal: listening.signal },
    );
    await mount(modalHtml({ open: true }) + "<div id='elsewhere'></div>");

    // Act
    document.getElementById("elsewhere")!.append(root());
    await settle();
    listening.abort();

    // Assert
    expect(seen).toEqual([]);
    expect(root().hasAttribute("open")).toBe(true);
    expect(dialog().open).toBe(true);
  });

  it("handles each event exactly once after being moved", async () => {
    // Arrange
    const user = userEvent.setup();
    const seen: boolean[] = [];
    const listening = new AbortController();
    document.addEventListener(
      "primitiv-modal-change",
      (event) => seen.push((event as CustomEvent<{ open: boolean }>).detail.open),
      { signal: listening.signal },
    );
    await mount(modalHtml() + "<div id='elsewhere'></div>");

    // Act
    document.getElementById("elsewhere")!.append(root());
    await settle();
    await user.click(trigger());

    listening.abort();

    // Assert
    expect(seen).toEqual([true]);
  });

  it("keeps a modal nested in a dialog independent of its parent", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(modalHtml({ id: "outer", open: true }));
    dialog().insertAdjacentHTML("beforeend", modalHtml({ id: "inner" }));
    await settle();
    const inner = document.getElementById("inner")!;
    const innerDialog = inner.querySelector("dialog")!;

    // Act
    await user.click(inner.querySelector("primitiv-modal-trigger > button")!);
    await user.click(inner.querySelector("primitiv-modal-close > button")!);
    await settle();

    // Assert
    expect(document.getElementById("outer")!.hasAttribute("open")).toBe(true);
    expect(dialog().open).toBe(true);
    expect(innerDialog.open).toBe(false);
    expect(dialog().getAttribute("aria-labelledby")).toBe("outer-title");
    expect(innerDialog.getAttribute("aria-labelledby")).toBe("inner-title");
  });
});
