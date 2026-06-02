/**
 * Minimal jsdom polyfill for Element.scrollTo and Element.scrollIntoView.
 *
 * jsdom does not implement scroll APIs — calling them throws
 * `viewport.scrollTo is not a function` (and likewise for
 * `scrollIntoView`). This polyfill installs no-ops so the React side of
 * programmatic scrolling can run during tests, with
 * `vi.spyOn(el, "scrollTo")` / `vi.spyOn(el, "scrollIntoView")` still
 * observing the call shape.
 */
export function installScrollPolyfill() {
  if (typeof Element === "undefined") return;
  const proto = Element.prototype as unknown as {
    scrollTo?: () => void;
    scrollIntoView?: () => void;
  };
  if (typeof proto.scrollTo !== "function") {
    proto.scrollTo = function scrollTo() {};
  }
  if (typeof proto.scrollIntoView !== "function") {
    proto.scrollIntoView = function scrollIntoView() {};
  }
}
