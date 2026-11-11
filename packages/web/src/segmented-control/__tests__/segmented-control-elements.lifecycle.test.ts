import { screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { defineSegmentedControl } from "../elements";
import { segmentedControlHtml } from "./segmented-control.fixtures";

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
  defineSegmentedControl();
  document.body.innerHTML = html;
  await settle();
}

const root = () => document.querySelector("primitiv-segmented-control") as HTMLElement;
const radio = (name: string) => screen.getByRole("radio", { name });
const item = (value: string) =>
  document.querySelector(`primitiv-segmented-control-item[value="${value}"]`) as HTMLElement;

const YEAR =
  '<primitiv-segmented-control-item value="year"><button type="button">Year</button></primitiv-segmented-control-item>';

describe("<primitiv-segmented-control> lifecycle", () => {
  it("picks up a segment added after it rendered", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(segmentedControlHtml({ value: "month" }));
    root().insertAdjacentHTML("beforeend", YEAR);
    await settle();
    radio("Month").focus();

    // Act
    await user.keyboard("{ArrowRight}");
    await settle();

    // Assert
    expect(radio("Year")).toBe(document.activeElement);
    expect(radio("Year").getAttribute("aria-checked")).toBe("true");
  });

  it("forgets a segment once it is removed, so the arrows skip it", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(segmentedControlHtml({ value: "day" }));
    item("week").remove();
    await settle();
    radio("Day").focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(radio("Month")).toBe(document.activeElement);
  });

  it("follows a segment's value changing later", async () => {
    // Arrange
    await mount(segmentedControlHtml({ value: "fortnight" }));

    // Act
    item("week").setAttribute("value", "fortnight");
    await settle();

    // Assert
    expect(radio("Week").getAttribute("aria-checked")).toBe("true");
  });

  it("follows a segment becoming disabled, moving the tab stop off it", async () => {
    // Arrange
    await mount(segmentedControlHtml());

    // Act
    item("day").setAttribute("disabled", "");
    await settle();

    // Assert
    expect(radio("Day").getAttribute("aria-disabled")).toBe("true");
    expect(radio("Week").getAttribute("tabindex")).toBe("0");
  });

  it("follows the whole control becoming disabled, and enabled again", async () => {
    // Arrange
    await mount(segmentedControlHtml());

    // Act
    root().setAttribute("disabled", "");
    await settle();
    const disabled = radio("Day").getAttribute("aria-disabled");
    root().removeAttribute("disabled");
    await settle();

    // Assert
    expect(disabled).toBe("true");
    expect(radio("Day").hasAttribute("aria-disabled")).toBe(false);
    expect(root().hasAttribute("data-disabled")).toBe(false);
  });

  it("follows the orientation changing later", async () => {
    // Arrange
    await mount(segmentedControlHtml());

    // Act
    root().setAttribute("orientation", "vertical");
    await settle();

    // Assert
    expect(root().getAttribute("data-orientation")).toBe("vertical");
  });

  it("decorates a segment's child again when it is replaced", async () => {
    // Arrange
    await mount(segmentedControlHtml({ value: "week" }));

    // Act
    item("week").innerHTML = '<button type="button">Week, replaced</button>';
    await settle();

    // Assert
    expect(radio("Week, replaced").getAttribute("aria-checked")).toBe("true");
  });

  it("stops responding once removed from the document", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(segmentedControlHtml());
    const control = root();
    const holder = document.createElement("div");
    control.remove();
    holder.append(control);

    // Act
    await user.click(within(holder).getByRole("radio", { name: "Week", hidden: true }));

    // Assert
    expect(control.hasAttribute("value")).toBe(false);
  });

  it("handles each event exactly once after being moved", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(`<section id="a">${segmentedControlHtml()}</section><section id="b"></section>`);
    const changes: string[] = [];
    document.addEventListener("primitiv-segmented-control-change", (event) => {
      changes.push((event as CustomEvent<{ value: string }>).detail.value);
    });

    // Act
    document.getElementById("b")?.append(root());
    await settle();
    await user.click(radio("Week"));

    // Assert
    expect(changes).toEqual(["week"]);
  });

  it("keeps a control nested in another independent of it, tab stop included", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(segmentedControlHtml({ value: "day" }));
    root().insertAdjacentHTML(
      "beforeend",
      '<primitiv-segmented-control aria-label="Inner"><primitiv-segmented-control-item value="inner">' +
        '<button type="button">Inner</button></primitiv-segmented-control-item></primitiv-segmented-control>',
    );
    await settle();

    // Act
    await user.click(radio("Inner"));
    await settle();

    // Assert
    expect(root().getAttribute("value")).toBe("day");
    expect(radio("Day").getAttribute("tabindex")).toBe("0");
    expect(radio("Inner").getAttribute("aria-checked")).toBe("true");
  });
});
