import { VisuallyHidden } from "@primitiv-ui/react";

import "./VisuallyHiddenExample.css";

export function VisuallyHiddenExample() {
  return (
    <div className="visually-hidden-example">
      <h2 className="visually-hidden-example__title">VisuallyHidden</h2>

      <section className="visually-hidden-example__section">
        <h3 className="visually-hidden-example__section-title">
          Accessible name for an icon-only button
        </h3>
        <p className="visually-hidden-example__description">
          The label is hidden visually but announced by screen readers.
        </p>
        <button className="visually-hidden-example__button">
          <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 24 24"
            width="16"
            height="16"
          >
            <path
              d="m21 21-4.3-4.3M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <VisuallyHidden>Search</VisuallyHidden>
        </button>
      </section>

      <section className="visually-hidden-example__section">
        <h3 className="visually-hidden-example__section-title">
          Hidden running commentary
        </h3>
        <p className="visually-hidden-example__description">
          Extra context for assistive tech, invisible on screen.
        </p>
        <p className="visually-hidden-example__text">
          Page 3 of 10
          <VisuallyHidden> — use the pagination controls below</VisuallyHidden>
        </p>
      </section>

      <section className="visually-hidden-example__section">
        <h3 className="visually-hidden-example__section-title">asChild</h3>
        <p className="visually-hidden-example__description">
          Hide a semantic element while keeping it in the accessibility tree.
        </p>
        <VisuallyHidden asChild>
          <h4>Decorative section heading</h4>
        </VisuallyHidden>
        <p className="visually-hidden-example__text">
          The heading above is hidden but still navigable by screen readers.
        </p>
      </section>
    </div>
  );
}
