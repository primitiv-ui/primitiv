"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A density value plus a `gliding` flag that is true only while a change of it
 * is animating.
 *
 * ## Why the glide has to be windowed
 *
 * The density glide is a blanket `transition` on every descendant of a preview
 * (`playground.css`, `density-demo.css`). It is unlayered docs CSS, so it
 * out-ranks every `@layer primitiv.*` rule — and `transition` is a single
 * property, so it does not ADD the density properties to a component's own
 * list, it REPLACES that list. Left on permanently it silently killed every
 * component's own motion inside a preview: Accordion's open/close, Modal's
 * enter/exit, Button's hover fade. Scoping the rule to `[data-density-gliding]`
 * and setting that attribute only for the length of the glide gives each side
 * the whole `transition` property in turn.
 *
 * ## Why the flag is set in the same update as the density
 *
 * A transition only runs if the rule declaring it is in force when the value
 * changes. Raising the flag from an effect AFTER the new density committed
 * would let the browser style the new density first, without the glide, and
 * the change would snap. So the setter flips both together.
 *
 * ## How long the window lasts
 *
 * Read from `--primitiv-motion-duration-expand` — the token both stylesheets
 * glide on — rather than restated here, so the window cannot drift from the
 * transition it covers. Dropping the attribute early would not leave anything
 * stuck: a running transition whose property leaves `transition-property` is
 * cancelled, which simply jumps it to its end value.
 */
export const useDensityGlide = <T>(initial: T) => {
  const [density, setDensityState] = useState(initial);
  const [gliding, setGliding] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const setDensity = useCallback((next: T) => {
    setDensityState(next);
    setGliding(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setGliding(false), glideMs());
  }, []);

  return [density, setDensity, gliding] as const;
};

/** `--primitiv-motion-duration-expand` in milliseconds, `0` if unreadable. */
const glideMs = () => {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue("--primitiv-motion-duration-expand")
    .trim();
  const amount = Number.parseFloat(value);
  if (Number.isNaN(amount)) return 0;
  return value.endsWith("ms") ? amount : amount * 1000;
};
