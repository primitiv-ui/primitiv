import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { defineSegmentedControl, type PrimitivSegmentedControlElement } from "../elements";
import { segmentedControlHtml } from "./segmented-control.fixtures";

afterEach(() => {
  document.body.replaceChildren();
});

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function mount(html: string) {
  defineSegmentedControl();
  document.body.innerHTML = html;
  await settle();
}

const root = () => document.querySelector("primitiv-segmented-control") as PrimitivSegmentedControlElement;
const radio = (name: string) => screen.getByRole("radio", { name });

describe("<primitiv-segmented-control> interaction", () => {
  it("reflects a clicked segment into the value attribute", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(segmentedControlHtml({ value: "day" }));

    // Act
    await user.click(radio("Month"));
    await settle();

    // Assert
    expect(root().getAttribute("value")).toBe("month");
    expect(radio("Month").getAttribute("aria-checked")).toBe("true");
    expect(radio("Month").getAttribute("tabindex")).toBe("0");
    expect(radio("Day").getAttribute("aria-checked")).toBe("false");
  });

  it("reflects an arrow key's selection into the value attribute", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(segmentedControlHtml({ value: "day" }));
    radio("Day").focus();

    // Act
    await user.keyboard("{ArrowRight}");
    await settle();

    // Assert
    expect(root().getAttribute("value")).toBe("week");
    expect(document.activeElement).toBe(radio("Week"));
  });

  it("reports the change with a bubbling, cancelable primitiv-segmented-control-change event", async () => {
    // Arrange
    const user = userEvent.setup();
    const events: Array<CustomEvent<{ value: string }>> = [];
    document.addEventListener("primitiv-segmented-control-change", (event) => {
      events.push(event as CustomEvent<{ value: string }>);
    });
    await mount(segmentedControlHtml({ value: "day" }));

    // Act
    await user.click(radio("Week"));

    // Assert
    expect(events).toHaveLength(1);
    expect(events[0].detail).toEqual({ value: "week" });
    expect(events[0].bubbles).toBe(true);
    expect(events[0].cancelable).toBe(true);
  });

  it("reports nothing for a click on the selected segment", async () => {
    // Arrange
    const user = userEvent.setup();
    const events: Event[] = [];
    await mount(segmentedControlHtml({ value: "day" }));
    root().addEventListener("primitiv-segmented-control-change", (event) => events.push(event));

    // Act
    await user.click(radio("Day"));

    // Assert
    expect(events).toHaveLength(0);
  });

  it("applies nothing when the change event is vetoed", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(segmentedControlHtml({ value: "day" }));
    root().addEventListener("primitiv-segmented-control-change", (event) => event.preventDefault());

    // Act
    await user.click(radio("Week"));
    await settle();

    // Assert
    expect(root().getAttribute("value")).toBe("day");
    expect(radio("Week").getAttribute("aria-checked")).toBe("false");
  });

  it("reads and sets the selection through the value property", async () => {
    // Arrange
    await mount(segmentedControlHtml({ value: "day" }));
    const read = root().value;

    // Act
    root().value = "month";
    await settle();

    // Assert
    expect(read).toBe("day");
    expect(root().getAttribute("value")).toBe("month");
    expect(radio("Month").getAttribute("aria-checked")).toBe("true");
  });

  it("reads no selection through the value property when there is no value", async () => {
    // Arrange & Act
    await mount(segmentedControlHtml());

    // Assert
    expect(root().value).toBeUndefined();
  });

  it("reads disabled at the moment of a click", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(segmentedControlHtml({ value: "day" }));

    // Act
    root().toggleAttribute("disabled", true);
    await user.click(radio("Week"));

    // Assert
    expect(root().getAttribute("value")).toBe("day");
  });
});
