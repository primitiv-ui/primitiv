import {
  sliderRangeInsets,
  sliderThumbInset,
  type SliderAxis,
  type SliderInset,
} from "@primitiv-ui/core";

import { defineElements, ElementBase, write, type ElementRegistry } from "../internal/element.ts";
import { PrimitivRootElement } from "../internal/RootElement.ts";
import { SliderController, type SliderControllerHost } from "./SliderController.ts";

export type { ElementRegistry };

// Stryker disable StringLiteral: static — evaluated once at import, so runtime mutant switching never reaches them; the names are pinned by the defineSlider registry test instead.
const ROOT = "primitiv-slider";
const TRACK = "primitiv-slider-track";
const RANGE = "primitiv-slider-range";
const THUMB = "primitiv-slider-thumb";
// Stryker restore StringLiteral

/** Set an inline style property only when it would change: `""` removes it. */
function setStyle(element: HTMLElement, property: string, value: string): void {
  if (element.style.getPropertyValue(property) !== value) element.style.setProperty(property, value);
}

/**
 * Place `element` absolutely at `insets` along the track, clearing every other
 * edge so a flip of direction or orientation leaves no stale inset behind.
 */
function place(element: HTMLElement, insets: readonly SliderInset[]): void {
  setStyle(element, "position", "absolute");
  for (const edge of ["left", "right", "top", "bottom"] as const) {
    const inset = insets.find((candidate) => candidate.edge === edge);
    setStyle(element, edge, inset ? `${inset.percent}%` : "");
  }
}

/**
 * `<primitiv-slider>` — the state owner of a slider: one or more thumbs along a
 * track, each picking a value between `min` and `max` in `step`s.
 *
 * Each `<primitiv-slider-thumb>` is itself the `role="slider"`: give it an
 * `aria-label` (or `aria-labelledby`). Every thumb is in the Tab order. The
 * arrows step by one `step`, Page Up / Page Down by ten, Home / End jump to the
 * ends; a press on the slider jumps the nearest thumb there and drags it until
 * release. A thumb never passes its neighbours.
 *
 * **Positions are written inline**, as React's Slider does: each thumb and the
 * range get `position: absolute` and their inset along the track as a
 * percentage — the one style the elements write, since it is the value itself
 * (RFC 0033 D25). Style everything else from the attributes.
 *
 * @customElement primitiv-slider
 * @summary The state owner of a slider.
 * @attr {string} value - Each thumb's value, separated by spaces, in thumb order. Reflected: it changes as the user moves a thumb, so a server re-render or a history snapshot sees the live values. Defaults to `min`.
 * @attr {number} min - The lowest value. Defaults to `0`.
 * @attr {number} max - The highest value. Defaults to `100`.
 * @attr {number} step - The interval values snap to. Defaults to `1`. Read at each interaction.
 * @attr {number} min-steps-between-thumbs - How many steps apart neighbouring thumbs must stay. Defaults to `0`. Read at each interaction.
 * @attr {"horizontal" | "vertical"} orientation - Layout axis. Defaults to `horizontal`.
 * @attr {boolean} inverted - Run from the opposite end: `max` at the start edge.
 * @attr {boolean} disabled - Ignore keys and presses, and take the thumbs out of the Tab order.
 * @attr {string} name - Submit the values with a form: the slider keeps one hidden `<input>` per value inside itself, named `name` (or `name[]` for several thumbs).
 * @fires {CustomEvent<{ value: number[] }>} primitiv-slider-change - Bubbles, cancelable, fired before each user-driven change is applied, with every thumb's value afterwards — on every step of a drag. Call `preventDefault()` to veto it.
 * @fires {Event} change - Bubbles, fired after a user's change has applied, as a form control's is: the hidden form inputs already hold the new value, so a `change` listener, `hx-trigger="change"` or `new FormData()` reads it. Not cancelable; veto with the event above.
 * @fires {CustomEvent<{ value: number[] }>} primitiv-slider-commit - Bubbles, fired once an interaction ends — a key press, or the release of a drag — with the values the slider then holds.
 */
export class PrimitivSliderElement extends PrimitivRootElement {
  protected readonly controller: SliderController = new SliderController(this, this.#host());
  protected readonly reconcileOn: readonly string[] = [
    "value",
    "min",
    "max",
    "orientation",
    "inverted",
    "disabled",
    "name",
    "dir",
  ];

  /** Each thumb's value, reflected as the space-separated `value` attribute; `[min]` when it has none. */
  get value(): number[] {
    // Stryker disable next-line Regex: equivalent — splitting on single whitespace leaves empty tokens, which the filter drops.
    const values = (this.getAttribute("value") ?? "").split(/\s+/).filter(Boolean).map(Number);
    return values.length > 0 ? values : [this.#number("min", 0)];
  }

  /** Set the values, as an array or a space-separated string. */
  set value(next: string | readonly number[]) {
    this.setAttribute("value", typeof next === "string" ? next : next.join(" "));
  }

  /** A numeric attribute, or `fallback` when it is missing or not a number. */
  #number(name: string, fallback: number): number {
    // A missing attribute reads as "null", which is not a number either.
    const value = Number.parseFloat(String(this.getAttribute(name)));
    return Number.isFinite(value) ? value : fallback;
  }

  #axis(): SliderAxis {
    return {
      orientation: this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal",
      dir: this.direction(),
      inverted: this.hasAttribute("inverted"),
    };
  }

  /** The controller's view of this element: state lives in reflected attributes. */
  #host(): SliderControllerHost {
    return {
      state: () => ({
        values: this.value,
        min: this.#number("min", 0),
        max: this.#number("max", 100),
        step: this.#number("step", 1),
        minStepsBetweenThumbs: this.#number("min-steps-between-thumbs", 0),
        disabled: this.hasAttribute("disabled"),
        ...this.#axis(),
      }),
      change: (value) => {
        if (this.announceValue("primitiv-slider-change", { value })) this.value = value;
      },
      // The values the slider holds now: a vetoed change was never applied.
      commit: () => {
        this.dispatchEvent(new CustomEvent("primitiv-slider-commit", { bubbles: true, detail: { value: this.value } }));
      },
    };
  }

  /** Keep one hidden input per value while the slider has a `name`, and none without. */
  #inputs(values: readonly number[]): void {
    const name = this.getAttribute("name");
    const inputs = [...this.querySelectorAll<HTMLInputElement>(':scope > input[type="hidden"]')];
    const wanted = name === null ? 0 : values.length;
    for (const extra of inputs.splice(wanted)) extra.remove();
    while (inputs.length < wanted) {
      const input = this.ownerDocument.createElement("input");
      input.type = "hidden";
      this.append(input);
      inputs.push(input);
    }
    inputs.forEach((input, index) => {
      write(input, "name", values.length > 1 ? `${name}[]` : name);
      write(input, "value", String(values[index]));
    });
  }

  protected reconcile(): void {
    const values = this.value;
    const scale = { min: this.#number("min", 0), max: this.#number("max", 100) };
    const axis = this.#axis();
    const disabled = this.hasAttribute("disabled") ? "" : null;
    write(this, "data-orientation", axis.orientation);
    write(this, "data-disabled", disabled);

    const thumbs = this.parts(THUMB);
    this.controller.setTriggers(thumbs.map((thumb, index) => ({ value: String(index), element: thumb })));

    for (const part of [...this.parts(TRACK), ...this.parts(RANGE), ...thumbs]) {
      write(part, "data-orientation", axis.orientation);
      write(part, "data-disabled", disabled);
    }
    for (const range of this.parts(RANGE)) {
      const { start, end } = sliderRangeInsets(values, scale, axis);
      place(range, [start, end]);
    }
    thumbs.forEach((thumb, index) => {
      write(thumb, "role", "slider");
      write(thumb, "tabindex", disabled === null ? "0" : null);
      write(thumb, "aria-orientation", axis.orientation);
      write(thumb, "aria-valuemin", String(scale.min));
      write(thumb, "aria-valuemax", String(scale.max));
      write(thumb, "aria-valuenow", String(values[index]));
      write(thumb, "aria-disabled", disabled === null ? null : "true");
      place(thumb, [sliderThumbInset(values[index], scale, axis)]);
    });
    this.#inputs(values);
  }
}

/**
 * `<primitiv-slider-track>` — a structural part: the bar the range fills.
 *
 * @customElement primitiv-slider-track
 */
export class PrimitivSliderTrackElement extends ElementBase {}

/**
 * `<primitiv-slider-range>` — a structural part: the filled stretch of the
 * track, from its start edge to a single thumb or between the outermost of
 * several. Positioned inline from the values.
 *
 * @customElement primitiv-slider-range
 */
export class PrimitivSliderRangeElement extends ElementBase {}

/**
 * `<primitiv-slider-thumb>` — a handle, and itself the `role="slider"`: it gets
 * `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-orientation`, the
 * Tab stop and its inline position. Its value is the root's value at the
 * thumb's position in document order. Name each with `aria-label`.
 *
 * @customElement primitiv-slider-thumb
 */
export class PrimitivSliderThumbElement extends ElementBase {}

/**
 * Define the four Slider elements on `registry` (the global `customElements`
 * by default). Safe to call more than once, and a no-op where there is no
 * registry (a server render).
 */
export function defineSlider(registry: ElementRegistry | undefined = globalThis.customElements): void {
  defineElements(registry, [
    [ROOT, PrimitivSliderElement],
    [TRACK, PrimitivSliderTrackElement],
    [RANGE, PrimitivSliderRangeElement],
    [THUMB, PrimitivSliderThumbElement],
  ]);
}
