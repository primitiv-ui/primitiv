"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The resolved value of one or more design tokens, read off a rendered element.
 *
 * Only for tokens a figure has to print as TEXT. A token that merely colours or
 * sizes something belongs in CSS, where `var(--primitiv-…)` resolves it with no
 * JavaScript at all and `scripts/check-tokens.mjs` can see it — TOKENS-01's
 * eleven swatches are keyed off a `data-step` attribute for exactly that reason.
 * This hook exists for the case CSS cannot serve: putting a token's own value
 * into the document as readable text.
 *
 * Same rule as `useControlMetrics`, and the same reason: a figure that types
 * `40` beside a control asserts the scale, where one that reads
 * `framed-control/md/height` demonstrates it and cannot drift when the token
 * moves. Returns `null` until the effect has run — the static export has no
 * cascade, so there is no honest value to prerender.
 *
 * **Do not point this at a COLOUR token.** A length or a number comes back as
 * authored, but a colour does not round-trip: Chromium resolves it and
 * serialises it in another space, so a token holding
 * `oklch(0.5557 0.1923 259.8783)` reads back as
 * `lab(46.564% 12.2373 -67.1156)`. TOKENS-01 tried exactly this once the
 * emitter began writing colours as OkLCH; its JSDoc records the finding. A
 * colour belongs in CSS, where it never passes through JavaScript at all — and
 * where a figure needs one as *text*, it comes from the engine.
 */
export const useTokenValues = <T extends HTMLElement>(tokens: readonly string[]) => {
  const ref = useRef<T>(null);
  const [values, setValues] = useState<Record<string, string> | null>(null);

  /* Joined, so the effect re-runs when the LIST changes rather than on every
     render — a fresh array literal from the caller is a new reference each time
     and would otherwise loop. */
  const key = tokens.join("|");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const read = () => {
      const style = getComputedStyle(el);
      setValues(
        Object.fromEntries(key.split("|").map((t) => [t, style.getPropertyValue(t).trim()])),
      );
    };

    read();

    /* Density and theme both re-point these, and neither fires an event — but
       both change the element's own computed style, and a density change also
       changes its size. Observing the box catches the density case; the theme
       case is caught because the whole tree re-renders on the toggle. */
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, [key]);

  return [ref, values] as const;
};
