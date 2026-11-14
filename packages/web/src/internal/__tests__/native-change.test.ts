import "../../select/__tests__/popover-polyfill";

import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { defineCheckboxCard } from "../../checkbox-card/elements";
import { checkboxCardHtml } from "../../checkbox-card/__tests__/checkbox-card.fixtures";
import { defineCombobox } from "../../combobox/elements";
import { comboboxHtml } from "../../combobox/__tests__/combobox.fixtures";
import { defineRadioCard } from "../../radio-card/elements";
import { radioCardHtml } from "../../radio-card/__tests__/radio-card.fixtures";
import { defineSegmentedControl } from "../../segmented-control/elements";
import { segmentedControlHtml } from "../../segmented-control/__tests__/segmented-control.fixtures";
import { defineSelect } from "../../select/elements";
import { selectHtml } from "../../select/__tests__/select.fixtures";
import { defineSlider } from "../../slider/elements";
import { sliderHtml } from "../../slider/__tests__/slider.fixtures";
import { defineToggleGroup } from "../../toggle-group/elements";
import { ITEMS as TOGGLES, toggleGroupHtml } from "../../toggle-group/__tests__/toggle-group.fixtures";

/*
 * After a user's change applies, a value-holding element fires a native,
 * bubbling `change`, as a form control does, once its hidden form inputs hold
 * the new value. So `hx-trigger="change"`, a form listener or `new FormData()`
 * reads the value the user just chose, not the one before it — which the
 * cancelable `primitiv-*-change`, fired before the change applies, cannot give.
 */

afterEach(() => {
  document.body.replaceChildren();
});

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

async function mount(html: string) {
  document.body.innerHTML = `<form>${html}</form>`;
  await settle();
  return document.querySelector("form") as HTMLFormElement;
}

/** Every `change` that reaches the form: its target, and what the form held then. */
function recordChanges(form: HTMLFormElement) {
  const seen: { target: string; data: [string, FormDataEntryValue][] }[] = [];
  form.addEventListener("change", (event) =>
    seen.push({ target: (event.target as Element).localName, data: [...new FormData(form).entries()] }),
  );
  return seen;
}

describe("a native change after a user's change applies", () => {
  it("fires from a Segmented Control, with the form holding the new value", async () => {
    defineSegmentedControl();
    const user = userEvent.setup();
    const form = await mount(segmentedControlHtml({ name: "range", value: "day" }));
    const seen = recordChanges(form);

    await user.click(screen.getByRole("radio", { name: "Week" }));
    await settle();

    expect(seen).toEqual([{ target: "primitiv-segmented-control", data: [["range", "week"]] }]);
  });

  it("fires nothing when the change is vetoed", async () => {
    defineSegmentedControl();
    const user = userEvent.setup();
    const form = await mount(segmentedControlHtml({ name: "range", value: "day" }));
    form.addEventListener("primitiv-segmented-control-change", (event) => event.preventDefault());
    const seen = recordChanges(form);

    await user.click(screen.getByRole("radio", { name: "Week" }));
    await settle();

    expect(seen).toEqual([]);
  });

  it("fires from a Radio Card", async () => {
    defineRadioCard();
    const user = userEvent.setup();
    const form = await mount(radioCardHtml({ name: "plan", value: "basic" }));
    const seen = recordChanges(form);

    await user.click(screen.getByRole("radio", { name: "Pro" }));
    await settle();

    expect(seen).toEqual([{ target: "primitiv-radio-card", data: [["plan", "pro"]] }]);
  });

  it("fires from a Toggle Group", async () => {
    defineToggleGroup();
    const user = userEvent.setup();
    const form = await mount(toggleGroupHtml({ name: "format" }));
    const seen = recordChanges(form);

    await user.click(screen.getByRole("button", { name: TOGGLES[0].label }));
    await settle();

    expect(seen).toEqual([{ target: "primitiv-toggle-group", data: [["format", TOGGLES[0].value]] }]);
  });

  it("fires from a Checkbox Card", async () => {
    defineCheckboxCard();
    const user = userEvent.setup();
    const form = await mount(checkboxCardHtml({ name: "updates", value: "weekly" }));
    const seen = recordChanges(form);

    await user.click(screen.getByRole("checkbox", { name: "Email updates" }));
    await settle();

    expect(seen).toEqual([{ target: "primitiv-checkbox-card", data: [["updates", "weekly"]] }]);
  });

  it("fires from a Select", async () => {
    defineSelect();
    const user = userEvent.setup();
    const form = await mount(selectHtml({ name: "fruit", value: "apple" }));
    const seen = recordChanges(form);

    await user.click(screen.getByRole("button", { name: "Fruit" }));
    await user.click(screen.getByRole("option", { name: "Banana", hidden: true }));
    await settle();

    expect(seen).toEqual([{ target: "primitiv-select", data: [["fruit", "banana"]] }]);
  });

  it("fires from a Combobox, choosing and clearing", async () => {
    defineCombobox();
    const user = userEvent.setup();
    const form = await mount(comboboxHtml({ name: "framework", open: true }));
    const seen = recordChanges(form);

    await user.click(document.querySelector('primitiv-combobox-item[value="react"]') as HTMLElement);
    await settle();
    await user.clear(document.querySelector("primitiv-combobox-input input") as HTMLInputElement);
    await settle();

    expect(seen.filter((change) => change.target === "primitiv-combobox")).toEqual([
      { target: "primitiv-combobox", data: [["framework", "react"]] },
      { target: "primitiv-combobox", data: [["framework", ""]] },
    ]);
  });

  it("fires from a Slider", async () => {
    defineSlider();
    const user = userEvent.setup();
    const form = await mount(sliderHtml({ value: "40", attrs: 'name="volume"' }));
    const seen = recordChanges(form);

    (document.querySelector("primitiv-slider-thumb") as HTMLElement).focus();
    await user.keyboard("{ArrowRight}");
    await settle();

    expect(seen).toEqual([{ target: "primitiv-slider", data: [["volume", "41"]] }]);
  });
});
