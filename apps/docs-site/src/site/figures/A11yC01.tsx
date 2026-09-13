"use client";

import { useId } from "react";

import "./figure-chrome.css";
import "./split-figures.css";

/**
 * A11Y-C01 — what the component handles, and what you handle.
 *
 * Two regions of equal weight either side of a dividing line. **Equal weight is
 * the whole design**: neither side is a pass or a fail, so there are no ticks,
 * no crosses and no colour separating them — both halves are required work, and
 * the caption says so. A first instinct to tint the left side "done" and the
 * right side "todo" would invert the argument.
 *
 * Built against the frame `A11Y-C01 — desktop`, which stays the design record
 * (plan §6.0.29).
 *
 * **These are real lists, and that matters more here than in any other figure.**
 * This is the accessibility page: a reader on a screen reader gets "list, 5
 * items" and can navigate it, where the PNG it replaces offered one sentence of
 * alt text for eleven items. Each list is named by its own heading paragraph
 * through `aria-labelledby`, which is the relationship a real `<h*>` would have
 * given without putting a heading into the page outline.
 */
const COMPONENT_HANDLES = [
  "Roles and ARIA states",
  "Keyboard navigation",
  "Focus management",
  "Contrast of the generated palette",
  "Visible focus",
];

const YOU_HANDLE = [
  "Labels",
  "Heading structure",
  "Reading order",
  "Alt text",
  "Link text",
  "Error wording",
];

const Half = ({ heading, items }: { heading: string; items: readonly string[] }) => {
  const id = useId();
  return (
    <div className="docs-split__half">
      <p className="docs-figure__heading" id={id}>
        {heading}
      </p>
      <ul className="docs-split__list" aria-labelledby={id}>
        {items.map((item) => (
          <li className="docs-figure__item" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export const A11yC01 = () => (
  <figure className="docs-figure docs-split">
    <div className="docs-split__row">
      <Half heading="The component handles" items={COMPONENT_HANDLES} />

      {/* The rule, with its label riding it. `aria-hidden` because "the line"
          names a visual device — the two halves are already named, and the
          caption carries the point the line is making. */}
      <div className="docs-split__rule" aria-hidden="true">
        <span className="docs-split__rule-label">the line</span>
      </div>

      <Half heading="You handle" items={YOU_HANDLE} />
    </div>
    <figcaption className="docs-figure__caption docs-figure__caption--center">
      Both halves are required. Neither is optional.
    </figcaption>
  </figure>
);
