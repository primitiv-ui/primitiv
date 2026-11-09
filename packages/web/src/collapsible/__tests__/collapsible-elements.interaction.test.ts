import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { defineCollapsible, type PrimitivCollapsibleElement } from "../elements";
import { collapsibleHtml, LABEL } from "./collapsible.fixtures";

afterEach(() => {
  document.body.replaceChildren();
});

async function mount(html: string) {
  defineCollapsible();
  document.body.innerHTML = html;
  await Promise.resolve();
}

const root = () => document.querySelector("primitiv-collapsible") as PrimitivCollapsibleElement;
const button = () => screen.getByRole("button", { name: LABEL });
const content = () => document.querySelector("primitiv-collapsible-content") as HTMLElement;

describe("<primitiv-collapsible> interaction", () => {
  it("reflects a click into the open attribute, and removes it on a second click", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(collapsibleHtml());

    // Act
    await user.click(button());
    const afterOpen = root().hasAttribute("open");
    await user.click(button());

    // Assert
    expect(afterOpen).toBe(true);
    expect(root().hasAttribute("open")).toBe(false);
  });

  it("reports the change with a bubbling, cancelable primitiv-collapsible-change event", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(collapsibleHtml());
    const events: CustomEvent[] = [];
    document.body.addEventListener("primitiv-collapsible-change", (event) => events.push(event as CustomEvent));

    // Act
    await user.click(button());

    // Assert
    expect(events).toHaveLength(1);
    expect(events[0].detail).toEqual({ open: true });
    expect(events[0].bubbles).toBe(true);
    expect(events[0].cancelable).toBe(true);
  });

  it("stays closed when the change event is cancelled", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(collapsibleHtml());
    root().addEventListener("primitiv-collapsible-change", (event) => event.preventDefault());

    // Act
    await user.click(button());

    // Assert
    expect(root().hasAttribute("open")).toBe(false);
    expect(button().getAttribute("aria-expanded")).toBe("false");
  });

  it("toggles with Enter and Space", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(collapsibleHtml());
    button().focus();

    // Act
    await user.keyboard("{Enter}");
    await Promise.resolve();
    const afterEnter = button().getAttribute("aria-expanded");
    await user.keyboard(" ");
    await Promise.resolve();

    // Assert
    expect(afterEnter).toBe("true");
    expect(button().getAttribute("aria-expanded")).toBe("false");
  });

  it("never toggles while disabled", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(collapsibleHtml({ disabled: true }));

    // Act
    await user.click(button());

    // Assert
    expect(root().hasAttribute("open")).toBe(false);
  });

  it("follows open set from outside, as an attribute or a property", async () => {
    // Arrange
    await mount(collapsibleHtml());

    // Act
    root().setAttribute("open", "");
    await Promise.resolve();
    const afterAttribute = button().getAttribute("aria-expanded");
    root().open = false;
    await Promise.resolve();

    // Assert
    expect(afterAttribute).toBe("true");
    expect(root().open).toBe(false);
    expect(root().hasAttribute("open")).toBe(false);
    expect(content().hidden).toBe(true);
  });

  it("reflects the open property as the open attribute", async () => {
    // Arrange
    await mount(collapsibleHtml());

    // Act
    root().open = true;

    // Assert
    expect(root().getAttribute("open")).toBe("");
    expect(root().open).toBe(true);
  });

  it("fires primitiv-collapsible-show on the panel as it opens, not on first render", async () => {
    // Arrange
    const user = userEvent.setup();
    const shown: EventTarget[] = [];
    document.addEventListener("primitiv-collapsible-show", (event) => shown.push(event.target as EventTarget));
    await mount(collapsibleHtml({ open: true }) + collapsibleHtml({ id: "second" }));
    const [, second] = screen.getAllByRole("button");
    const secondPanel = document.querySelectorAll("primitiv-collapsible-content")[1];

    // Act
    const atFirstRender = shown.length;
    await user.click(second);
    await Promise.resolve();
    await user.click(second);
    await Promise.resolve();

    // Assert
    expect(atFirstRender).toBe(0);
    expect(shown).toEqual([secondPanel]);
  });
});
