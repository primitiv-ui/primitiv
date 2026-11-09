import { screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { defineCollapsible } from "../elements";
import { collapsibleHtml, LABEL, PANEL } from "./collapsible.fixtures";

afterEach(() => {
  document.body.replaceChildren();
});

/**
 * Let mutation-observer callbacks and the reconcile they schedule run. Each is
 * a microtask; a macrotask boundary drains both.
 */
async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function mount(html: string) {
  defineCollapsible();
  document.body.innerHTML = html;
  await settle();
}

const root = () => document.querySelector("primitiv-collapsible") as HTMLElement;
const button = () => screen.getByRole("button", { name: LABEL });
const content = () => document.querySelector("primitiv-collapsible-content") as HTMLElement;

describe("<primitiv-collapsible> lifecycle", () => {
  it("picks up a panel added after it rendered", async () => {
    // Arrange
    await mount('<primitiv-collapsible open><primitiv-collapsible-trigger><button type="button">Toggle</button></primitiv-collapsible-trigger></primitiv-collapsible>');

    // Act
    root().insertAdjacentHTML("beforeend", `<primitiv-collapsible-content>${PANEL}</primitiv-collapsible-content>`);
    await settle();

    // Assert
    expect(button().getAttribute("aria-controls")).toBe(content().id);
    expect(content().getAttribute("data-state")).toBe("open");
  });

  it("follows becoming disabled later, and stops toggling", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(collapsibleHtml());

    // Act
    root().setAttribute("disabled", "");
    await settle();
    await user.click(button());

    // Assert
    expect(button().getAttribute("aria-disabled")).toBe("true");
    expect(root().hasAttribute("open")).toBe(false);
  });

  it("follows force-mount set later on a closed panel", async () => {
    // Arrange
    await mount(collapsibleHtml());

    // Act
    content().setAttribute("force-mount", "");
    await settle();

    // Assert
    expect(content().hidden).toBe(false);
    expect(content().getAttribute("aria-hidden")).toBe("true");
  });

  it("follows collapsed-height changing later, and drops the height once it is removed", async () => {
    // Arrange
    await mount(collapsibleHtml({ collapsedHeight: "72" }));

    // Act
    content().setAttribute("collapsed-height", "5rem");
    await settle();
    const changed = content().style.getPropertyValue("--primitiv-collapsible-collapsed-height");
    content().removeAttribute("collapsed-height");
    await settle();

    // Assert
    expect(changed).toBe("5rem");
    expect(content().style.getPropertyValue("--primitiv-collapsible-collapsed-height")).toBe("");
    expect(content().hasAttribute("data-clamped")).toBe(false);
    expect(content().hasAttribute("style")).toBe(false);
    expect(content().hidden).toBe(true);
  });

  it("decorates the trigger's child again when it is replaced", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(collapsibleHtml());
    const trigger = document.querySelector("primitiv-collapsible-trigger") as HTMLElement;

    // Act
    trigger.innerHTML = '<button type="button">Toggle</button>';
    await settle();
    await user.click(button());
    await settle();

    // Assert
    expect(button().getAttribute("aria-expanded")).toBe("true");
  });

  it("forgets its button once the trigger stops decorating one", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(collapsibleHtml());
    const errors: unknown[] = [];
    const onError = (event: ErrorEvent) => errors.push(event.error);
    window.addEventListener("error", onError);
    const trigger = document.querySelector("primitiv-collapsible-trigger") as HTMLElement;
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    trigger.insertAdjacentHTML("beforeend", '<button type="button">Second</button>');
    await settle();
    await user.click(button());
    window.removeEventListener("error", onError);
    vi.restoreAllMocks();

    // Assert
    expect(errors).toEqual([]);
    expect(root().hasAttribute("open")).toBe(false);
  });

  it("stops responding once removed from the document", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(collapsibleHtml());
    const element = root();
    const trigger = button();
    element.remove();

    // Act
    document.body.append(document.createElement("div"));
    document.body.lastElementChild?.append(trigger);
    await user.click(trigger);

    // Assert
    expect(element.hasAttribute("open")).toBe(false);
  });

  it("handles each event exactly once after being moved", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(`${collapsibleHtml()}<section></section>`);
    const changes: unknown[] = [];
    root().addEventListener("primitiv-collapsible-change", (event) => changes.push((event as CustomEvent).detail));

    // Act
    document.querySelector("section")?.append(root());
    await settle();
    await user.click(button());

    // Assert
    expect(changes).toEqual([{ open: true }]);
  });

  it("keeps a collapsible nested in a panel independent of its parent", async () => {
    // Arrange
    const user = userEvent.setup();
    const inner =
      '<primitiv-collapsible><primitiv-collapsible-trigger><button type="button">Inner</button>' +
      "</primitiv-collapsible-trigger><primitiv-collapsible-content>Inner panel</primitiv-collapsible-content></primitiv-collapsible>";
    await mount(collapsibleHtml({ open: true }).replace(PANEL, inner));
    const outerPanel = content();

    // Act
    await user.click(within(outerPanel).getByRole("button", { name: "Inner" }));
    await settle();

    // Assert
    const [outer, nested] = document.querySelectorAll("primitiv-collapsible");
    expect(outer.hasAttribute("open")).toBe(true);
    expect(nested.hasAttribute("open")).toBe(true);
    expect(button().getAttribute("aria-controls")).toBe(outerPanel.id);
  });
});
