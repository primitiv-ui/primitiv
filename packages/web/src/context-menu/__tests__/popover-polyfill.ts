/**
 * Minimal jsdom polyfill for the HTML Popover API.
 *
 * jsdom does not yet implement `showPopover()`, `hidePopover()`, or
 * `togglePopover()`. This polyfill installs the three methods on the
 * HTMLElement prototype so components under test can drive the popover
 * API the same way they do in a real browser. Open state is mirrored to
 * a `data-popover-open` attribute so jsdom assertions can observe it.
 * `beforetoggle` / `toggle` events are dispatched to match the spec.
 */

type PopoverState = "open" | "closed";

const stateMap = new WeakMap<HTMLElement, PopoverState>();

function getState(el: HTMLElement): PopoverState {
  return stateMap.get(el) ?? "closed";
}

function setState(el: HTMLElement, next: PopoverState) {
  stateMap.set(el, next);
  if (next === "open") {
    el.setAttribute("data-popover-open", "");
  } else {
    el.removeAttribute("data-popover-open");
  }
}

function fireToggleEvents(
  el: HTMLElement,
  oldState: PopoverState,
  newState: PopoverState,
): boolean {
  const before = new Event("beforetoggle", { cancelable: true, bubbles: false });
  Object.defineProperty(before, "oldState", { value: oldState });
  Object.defineProperty(before, "newState", { value: newState });
  const allowed = el.dispatchEvent(before);
  if (!allowed) return false;

  const after = new Event("toggle", { cancelable: false, bubbles: false });
  Object.defineProperty(after, "oldState", { value: oldState });
  Object.defineProperty(after, "newState", { value: newState });
  el.dispatchEvent(after);
  return true;
}

export function installPopoverPolyfill() {
  if (typeof HTMLElement === "undefined") return;
  const proto = HTMLElement.prototype as unknown as {
    showPopover?: () => void;
    hidePopover?: () => void;
    togglePopover?: (force?: boolean) => boolean;
  };
  if (typeof proto.showPopover === "function") return;

  proto.showPopover = function showPopover(this: HTMLElement) {
    if (getState(this) === "open") return;
    if (!fireToggleEvents(this, "closed", "open")) return;
    setState(this, "open");
  };

  proto.hidePopover = function hidePopover(this: HTMLElement) {
    if (getState(this) === "closed") return;
    if (!fireToggleEvents(this, "open", "closed")) return;
    setState(this, "closed");
  };

  proto.togglePopover = function togglePopover(
    this: HTMLElement,
    force?: boolean,
  ) {
    const current = getState(this);
    const target: PopoverState =
      force === undefined
        ? current === "open"
          ? "closed"
          : "open"
        : force
          ? "open"
          : "closed";
    if (target === current) return current === "open";
    if (target === "open") this.showPopover!();
    else this.hidePopover!();
    return getState(this) === "open";
  };
}

installPopoverPolyfill();
