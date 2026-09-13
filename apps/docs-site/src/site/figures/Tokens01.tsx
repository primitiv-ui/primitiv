"use client";

import { Button } from "@/components/button";
import sheet from "@/content/palette-sheet.generated.json";

import { Arrow } from "./Arrow";
import { useTokenValues } from "./useTokenValues";

import "./figure-chrome.css";
import "./tokens-figure.css";

/**
 * TOKENS-01 — one button's background, traced down through the three tiers.
 *
 * Built against the frame `TOKENS-01 — desktop`, which stays the design record
 * (plan §6.0.29). Three decisions were settled before the rebuild:
 *
 * 1. **The two unused Intent roles are gone.** The frame greys out
 *    `surface/default` and `border/subtle` with no path leaving them. In a
 *    drawing that reads as "there are others"; in the DOM a label with no
 *    connector reads as unfinished. Dropped, so every role shown is one the
 *    figure actually traces.
 * 2. **CONTEXT stays off to the side**, feeding the component horizontally
 *    rather than joining the vertical descent. That is truthful — geometry does
 *    not resolve through the colour tiers — and the separation is the point. So
 *    its connector is the one arrow in the figure that does not point down.
 * 3. **The ramp and the value are LIVE.** This is the figure whose subject IS
 *    the palette, so it is the one that must never disagree with it.
 *
 * **Three live values, three different sources, each for a reason.**
 *
 * - **The swatches: pure CSS.** Each cell carries its step as `data-step` and
 *   the stylesheet resolves `--primitiv-color-brand-<step>` for it. No
 *   JavaScript, so nothing to go stale, it follows the theme, and — unlike a
 *   value read in JS — `scripts/check-tokens.mjs` can see every one of them.
 * - **The geometry figures: read off the element** (`useTokenValues`), because
 *   they are printed as TEXT and CSS cannot put a token's value into the
 *   document. Same rule as the density captions: typing `40` asserts the scale,
 *   reading `framed-control/md/height` demonstrates it.
 *
 *   **This is the one place the rebuild departs from the frame**, which prints
 *   `40` and `16` where these rows print `2.5rem` and `1rem`. They are the same
 *   measurement; the rem figure is what the token itself holds. The label names
 *   a token, so the value beside it has to be that token's own value — measuring
 *   the rendered button instead would make the row assert something its label
 *   does not say. The density figures measure px for the opposite reason: their
 *   claim is about the control's size, not about a token.
 * - **The OkLCH string: from the engine**, via `palette-sheet.generated.json`,
 *   which the Rust `swatch-sheet` example writes. OkLCH is not in the token
 *   layer, and converting the hex in the browser would be the frontend
 *   computing a colour value — a second opinion about the exact thing this
 *   figure asserts. Adding it there surfaced a real bug: `SwatchStep.h` is the
 *   renderer's -180..180 form, so brand 500 came out as `-100.12` where the
 *   settled design says `259.8783`. Normalised in the engine, not here.
 */
const STEPS = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"] as const;

/** The step the figure traces — the one the brand pins to and Intent aliases. */
const TRACED = "500";

/*
 * The swatches take NO token through JavaScript. Each cell carries its step as
 * a `data-step` attribute and the stylesheet resolves
 * `--primitiv-color-brand-<step>` for it — live, theme-following, visible to
 * the token gate, and with nothing to go stale. Only a token printed as TEXT
 * needs the hook.
 */
const GEOMETRY_TOKENS = [
  "--primitiv-framed-control-md-height",
  "--primitiv-framed-control-md-padding-inline",
];

/** The traced step's own value, straight off the engine's sheet. */
const tracedOklch = () => {
  const brand = sheet.light.find((r) => r.ramp === "brand");
  const step = brand?.steps.find((s) => s.step === TRACED);
  const o = step && "oklch" in step ? (step.oklch as { l: number; c: number; h: number }) : null;
  return o ? `oklch(${o.l} ${o.c} ${o.h})` : null;
};

export const Tokens01 = () => {
  const [ref, values] = useTokenValues<HTMLDivElement>(GEOMETRY_TOKENS);

  const oklch = tracedOklch();

  return (
    <figure className="docs-figure docs-tokens" ref={ref}>
      {/*
        Labels and content are separate grid children rather than two stacked
        blocks, so the connector between them can be centred on the BUTTON row
        rather than on the block — which would have meant guessing a top offset
        from the label's own height.
      */}
      <div className="docs-tokens__top">
        <p className="docs-tokens__label docs-tokens__label--component">Component</p>
        <p className="docs-tokens__label docs-tokens__label--context">Context</p>

        <div className="docs-tokens__component">
          <Button>Save changes</Button>
        </div>

        {/* Geometry feeds the button from the side. `rotate` does not change the
            layout box, so the arrow needs a box sized to its ROTATED extent or
            it paints over the column beside it — the trap CLI-01 documents. */}
        <div className="docs-tokens__feed" aria-hidden="true">
          <Arrow className="docs-tokens__feed-arrow" />
        </div>

        <dl className="docs-tokens__geometry">
          {GEOMETRY_TOKENS.map((token) => (
            <div className="docs-tokens__geometry-row" key={token}>
              <dt className="docs-figure__mono">
                {token.replace("--primitiv-", "").replace(/-md-/, "/md/")}
              </dt>
              <dd className="docs-figure__mono docs-tokens__geometry-value">
                {values?.[token] ?? ""}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <Arrow className="docs-tokens__descend" />

      <div className="docs-tokens__tier">
        <p className="docs-tokens__label">Intent</p>
        <ul className="docs-tokens__roles" aria-label="Intent roles this button resolves">
          <li className="docs-figure__mono docs-tokens__role">action/primary/default</li>
          <li className="docs-figure__mono docs-tokens__role">content/on-action</li>
        </ul>
      </div>

      <Arrow className="docs-tokens__descend" />

      <div className="docs-tokens__tier">
        <p className="docs-tokens__label">
          Palette <span className="docs-tokens__theme">brand</span>
        </p>
        <ol className="docs-tokens__ramp" aria-label="The brand ramp">
          {[...STEPS, "white"].map((step) => (
            <li
              className="docs-tokens__swatch-cell"
              key={step}
              data-step={step}
              data-traced={step === TRACED || step === "white" ? "" : undefined}
            >
              {/* A real token-coloured box, filled by the stylesheet from this
                  cell's own `data-step`. Hidden from the a11y tree — the step
                  number beside it is the content, and eleven "swatch" nodes
                  would be noise. */}
              <span className="docs-tokens__swatch" aria-hidden="true" />
              <span className="docs-figure__mono docs-tokens__step">{step}</span>
            </li>
          ))}
        </ol>
        {oklch ? <p className="docs-figure__mono docs-tokens__value">{oklch}</p> : null}
      </div>

      <figcaption className="docs-figure__caption docs-figure__caption--center">
        Only the bottom tier holds a value. Everything above it points.
      </figcaption>
    </figure>
  );
};
