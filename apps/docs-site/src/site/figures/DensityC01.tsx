"use client";

import { Button } from "@/components/button";
import { Field, FieldLabel } from "@/components/field";
import { Input } from "@/components/input";

import { useControlMetrics } from "./useControlMetrics";

import "./figure-chrome.css";
import "./density-figures.css";

/**
 * DENSITY-C01 — the same panel at all four densities, side by side.
 *
 * **This is the figure that most wanted to stop being a picture.** Its subject
 * is that one inherited attribute reflows a real composition, and the DOM does
 * exactly that: four `data-density` scopes around identical markup, with the
 * Context tier resolving every height, padding, radius and type size. Nothing
 * here knows which density it is drawing. The PNG it replaces was a rasterised
 * *drawing* of that, which could only ever assert the claim.
 *
 * Built against the frame `DENSITY-C01 — desktop` on "Docs Site — Content
 * illustrations", which stays the design record (plan §6.0.29).
 *
 * Three things worth keeping:
 *
 * - **The captions are measured, not typed.** See `useControlMetrics`. A figure
 *   printing `24 / 32 / 40 / 48` would assert the scale; reading it off the
 *   rendered control demonstrates it, and cannot drift when the tokens move.
 * - **`data-density` is on an inner wrapper, not on the column.** The mode label
 *   and the measured caption are chrome — they name the specimen and report on
 *   it — so they sit OUTSIDE the scope and stay one size across all four
 *   columns, exactly as the frame draws them. A first pass put the attribute on
 *   the column itself, which scaled the labels too (`overline/*` and the body
 *   line-height are both density-scaled): "DENSE" rendered visibly smaller than
 *   "SPACIOUS" and the row lost its baseline. Only the render showed it.
 * - **The columns stay four across down to the narrow breakpoint, then become a
 *   2x2.** The brief's own mobile note asks for that ("16:9 → two columns of
 *   two on mobile"), and it is right for the argument: the comparison only
 *   works while at least two densities are visible together.
 * - **Every column is a labelled region and every input is named by its
 *   density.** Four controls all labelled "Email" would otherwise read as four
 *   identical fields rather than as one field shown four ways.
 */
const MODES = ["dense", "compact", "comfortable", "spacious"] as const;

const BODY =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod tempor.";

const title = (mode: string) => mode[0].toUpperCase() + mode.slice(1);

const DensityColumn = ({ mode }: { mode: (typeof MODES)[number] }) => {
  const [ref, metrics] = useControlMetrics<HTMLInputElement>();

  return (
    <section className="docs-density-figure__column" aria-label={title(mode)}>
      <p className="docs-density-figure__mode">{title(mode)}</p>

      <div className="docs-density-figure__scope" data-density={mode}>
        <Field>
          <FieldLabel>Email</FieldLabel>
          <Input ref={ref} placeholder="hi@acme.io" aria-label={`Email, ${title(mode)}`} />
        </Field>

        <Button>Save</Button>

        <p className="docs-density-figure__body">{BODY}</p>
      </div>

      {/* Held open by the stylesheet, so the measured value arrives without
          shifting the column. `aria-hidden` because the number is a caption on
          a visual comparison, and the figure's own caption already says what
          the reader needs. */}
      <p className="docs-density-figure__metric" aria-hidden="true">
        {metrics ? `${metrics.height}px · r${metrics.radius}` : ""}
      </p>
    </section>
  );
};

export const DensityC01 = () => (
  <figure className="docs-figure docs-density-figure">
    <div className="docs-density-figure__row">
      {MODES.map((mode) => (
        <DensityColumn key={mode} mode={mode} />
      ))}
    </div>
    <figcaption className="docs-figure__caption">
      Same components. Same markup. One attribute.
    </figcaption>
  </figure>
);
