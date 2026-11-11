import {
  sliderClosestThumb,
  sliderKeyValue,
  sliderPointerValue,
  sliderSetThumb,
  type SliderOrientation,
  type SliderReadingDirection,
} from "@primitiv-ui/core";

import { TriggerController, type Trigger } from "../internal/TriggerController.ts";

/**
 * What a {@link SliderController} asks of whoever hosts it. The controller owns
 * behaviour and never owns state (RFC 0033 D28): the custom elements keep the
 * values in a reflected `value` attribute, the React adapter keeps them in
 * React, and each answers these calls from wherever it keeps them.
 */
export type SliderControllerHost = {
  /** The state the controller cannot see for itself. */
  state(): {
    /** Each thumb's value, in thumb order. */
    values: readonly number[];
    min: number;
    max: number;
    step: number;
    /** How many steps apart neighbouring thumbs must stay. */
    minStepsBetweenThumbs: number;
    orientation: SliderOrientation;
    dir: SliderReadingDirection;
    /** Run from the opposite end: max at the start edge. */
    inverted: boolean;
    disabled: boolean;
  };
  /** Apply a change the user is making: `values` is every thumb's value afterwards. */
  change(values: number[]): void;
  /** The user finished a change — a key press, or the end of a drag — with these values. */
  commit(values: number[]): void;
};

/**
 * The DOM behaviour of a slider: the WAI-ARIA slider keys on a focused thumb,
 * and a press on the track that jumps the nearest thumb there and drags it
 * until release. Thumbs register as triggers, in DOM order. It attaches to
 * whatever elements register with it, so the same code runs under the custom
 * elements and under the React adapter (RFC 0033 §3.4). Every change is
 * reported as it happens, and committed once the interaction ends.
 */
export class SliderController extends TriggerController {
  readonly #root: HTMLElement;
  readonly #host: SliderControllerHost;
  /** Listens for presses while connected. */
  #presses: AbortController | null = null;
  /** Listens for the pointer while a drag is in progress. */
  #drag: AbortController | null = null;

  constructor(root: HTMLElement, host: SliderControllerHost) {
    super(root);
    this.#root = root;
    this.#host = host;
  }

  connect(): void {
    super.connect();
    if (this.#presses) return;
    this.#presses = new AbortController();
    this.#root.addEventListener("pointerdown", (event) => this.#press(event), { signal: this.#presses.signal });
  }

  disconnect(): void {
    super.disconnect();
    this.#presses?.abort();
    this.#presses = null;
    this.#drag?.abort();
    this.#drag = null;
  }

  /** Thumb `index` moved to `value`: report the change, or `null` when nothing moved. */
  #move(index: number, value: number): number[] | null {
    const state = this.#host.state();
    const next = sliderSetThumb(state.values, index, value, state);
    if (next) this.#host.change(next);
    return next;
  }

  /** The value under the pointer, read along the host's axis. */
  #pointerValue(event: PointerEvent): number {
    return sliderPointerValue({ x: event.clientX, y: event.clientY }, this.#root.getBoundingClientRect(), this.#host.state());
  }

  #press(event: PointerEvent): void {
    const state = this.#host.state();
    if (state.disabled) return;
    const value = this.#pointerValue(event);
    const index = sliderClosestThumb(value, state.values);
    let pending = this.#move(index, value);
    this.ordered()[index]?.[0].focus();

    this.#drag?.abort();
    const drag = new AbortController();
    this.#drag = drag;
    const { signal } = drag;
    const doc = this.#root.ownerDocument;
    doc.addEventListener("pointermove", (move) => (pending = this.#move(index, this.#pointerValue(move)) ?? pending), {
      signal,
    });
    doc.addEventListener(
      "pointerup",
      () => {
        drag.abort();
        this.#drag = null;
        if (pending) this.#host.commit(pending);
      },
      { signal },
    );
    event.preventDefault();
  }

  protected onTriggerClick(): void {}

  protected onTriggerKeydown(trigger: Trigger, event: KeyboardEvent): void {
    const state = this.#host.state();
    if (state.disabled) return;
    const index = this.ordered().findIndex(([, thumb]) => thumb === trigger);
    const target = sliderKeyValue(event.key, state.values[index], state);
    if (target === null) return;
    event.preventDefault();
    const next = this.#move(index, target);
    if (next) this.#host.commit(next);
  }
}
