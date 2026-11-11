import { screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { defineRadioCard } from "../elements";
import { radioCardHtml } from "./radio-card.fixtures";

afterEach(() => {
  document.body.replaceChildren();
});

/** Let mutation-observer callbacks and the reconcile they schedule run. */
async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function mount(html: string) {
  defineRadioCard();
  document.body.innerHTML = html;
  await settle();
}

const root = () => document.querySelector("primitiv-radio-card") as HTMLElement;
const radio = (name: string) => screen.getByRole("radio", { name });
const item = (value: string) => document.querySelector(`primitiv-radio-card-item[value="${value}"]`) as HTMLElement;
const indicator = (name: string) => radio(name).querySelector("primitiv-radio-card-indicator") as HTMLElement;

describe("<primitiv-radio-card> lifecycle", () => {
  it("picks up a card added after it rendered", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(radioCardHtml({ value: "team" }));
    root().insertAdjacentHTML(
      "beforeend",
      '<primitiv-radio-card-item value="enterprise"><button type="button">Enterprise</button></primitiv-radio-card-item>',
    );
    await settle();
    radio("Team").focus();

    // Act
    await user.keyboard("{ArrowRight}");
    await settle();

    // Assert
    expect(radio("Enterprise")).toBe(document.activeElement);
    expect(radio("Enterprise").getAttribute("aria-checked")).toBe("true");
  });

  it("follows a card becoming disabled, moving the tab stop off it", async () => {
    // Arrange
    await mount(radioCardHtml());

    // Act
    item("basic").setAttribute("disabled", "");
    await settle();

    // Assert
    expect(radio("Basic").getAttribute("aria-disabled")).toBe("true");
    expect(radio("Pro").getAttribute("tabindex")).toBe("0");
  });

  it("follows the orientation changing later", async () => {
    // Arrange
    await mount(radioCardHtml());

    // Act
    root().setAttribute("orientation", "vertical");
    await settle();

    // Assert
    expect(root().getAttribute("aria-orientation")).toBe("vertical");
  });

  it("follows an indicator gaining force-mount", async () => {
    // Arrange
    await mount(radioCardHtml({ value: "pro" }));

    // Act
    indicator("Basic").setAttribute("force-mount", "");
    await settle();

    // Assert
    expect(indicator("Basic").hasAttribute("hidden")).toBe(false);
  });

  it("decorates an indicator arriving later", async () => {
    // Arrange
    await mount(radioCardHtml({ value: "pro" }));

    // Act
    radio("Team").insertAdjacentHTML("afterbegin", "<primitiv-radio-card-indicator force-mount></primitiv-radio-card-indicator>");
    await settle();

    // Assert
    expect(radio("Team").querySelectorAll("primitiv-radio-card-indicator:not([hidden])")).toHaveLength(1);
  });

  it("leaves a nested group's indicators to that group", async () => {
    // Arrange
    await mount(radioCardHtml({ value: "basic" }));

    // Act
    radio("Basic").insertAdjacentHTML(
      "beforeend",
      '<primitiv-radio-card aria-label="Inner"><primitiv-radio-card-item value="inner">' +
        '<button type="button"><primitiv-radio-card-indicator></primitiv-radio-card-indicator>Inner</button>' +
        "</primitiv-radio-card-item></primitiv-radio-card>",
    );
    await settle();

    // Assert
    expect(radio("Inner").querySelector("primitiv-radio-card-indicator")?.getAttribute("data-state")).toBe("unchecked");
  });

  it("stops responding once removed from the document", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(radioCardHtml());
    const group = root();
    const holder = document.createElement("div");
    group.remove();
    holder.append(group);

    // Act
    await user.click(within(holder).getByRole("radio", { name: "Pro", hidden: true }));

    // Assert
    expect(group.hasAttribute("value")).toBe(false);
  });

  it("handles each event exactly once after being moved", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(`<section id="a">${radioCardHtml()}</section><section id="b"></section>`);
    const changes: string[] = [];
    document.addEventListener("primitiv-radio-card-change", (event) => {
      changes.push((event as CustomEvent<{ value: string }>).detail.value);
    });

    // Act
    document.getElementById("b")?.append(root());
    await settle();
    await user.click(radio("Pro"));

    // Assert
    expect(changes).toEqual(["pro"]);
  });
});
