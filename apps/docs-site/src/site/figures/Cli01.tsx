"use client";

import { useId } from "react";

import "./figure-chrome.css";
import "./cli-figure.css";

/**
 * CLI-01 — the styling is a copy, the behaviour is a dependency.
 *
 * Two zones with a single one-way arrow between them. **The direction is the
 * point**: behaviour flows from the package into your repository and nothing
 * flows back, which is what "a file you own" actually means. One arrowhead, one
 * direction, no return path — if this ever grows a second arrow the figure is
 * saying something the CLI does not do.
 *
 * Built against the frame `CLI-01 — desktop`, which stays the design record
 * (plan §6.0.29).
 *
 * The file names are a real list named by its zone heading, and the arrow is
 * inline SVG taking its colour from the cascade (`stroke="currentColor"`), so
 * it follows the theme like everything else and needs no second asset. It is
 * `aria-hidden` with its meaning carried by the visible label beside it and by
 * the caption — a `<title>` on the SVG would announce a shape rather than the
 * claim.
 */
const COPIED = ["button.tsx", "button.recipe.ts", "styles/primitiv/button.css"];
const CONFIG = ["primitiv.json", "primitiv.lock"];

const FileChip = ({ name }: { name: string }) => (
  <li className="docs-cli__file docs-figure__mono">{name}</li>
);

export const Cli01 = () => {
  const repoId = useId();
  const npmId = useId();

  return (
    <figure className="docs-figure docs-cli">
      <div className="docs-cli__row">
        <div className="docs-cli__zone docs-cli__zone--repo">
          <p className="docs-figure__heading" id={repoId}>
            Your repository
          </p>

          <ul className="docs-cli__files" aria-labelledby={repoId}>
            {COPIED.map((name) => (
              <FileChip key={name} name={name} />
            ))}
          </ul>

          {/* A second group, not a gap in one list: these two are the CLI's own
              bookkeeping rather than the component it copied. */}
          <ul className="docs-cli__files" aria-label="Config files">
            {CONFIG.map((name) => (
              <FileChip key={name} name={name} />
            ))}
          </ul>

          <p className="docs-figure__caption">Committed. Yours to edit.</p>
        </div>

        <div className="docs-cli__flow">
          <p className="docs-cli__flow-label">behaviour, keyboard, ARIA</p>
          <span className="docs-cli__arrow-box">
            <svg
              className="docs-cli__arrow"
              viewBox="0 0 120 12"
              role="presentation"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M119 6 H7 M13 1 L6 6 L13 11"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </span>
        </div>

        <div className="docs-cli__zone">
          <p className="docs-figure__heading" id={npmId}>
            Installed from npm
          </p>
          <ul className="docs-cli__files" aria-labelledby={npmId}>
            <FileChip name="@primitiv-ui/react" />
          </ul>
          <p className="docs-figure__caption">Updates normally.</p>
        </div>
      </div>

      <figcaption className="docs-figure__caption docs-figure__caption--center">
        The styling is a copy. The behaviour is a dependency.
      </figcaption>
    </figure>
  );
};
