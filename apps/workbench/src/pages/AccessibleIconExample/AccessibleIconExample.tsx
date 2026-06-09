import { AccessibleIcon } from "@primitiv-ui/react";

import "./AccessibleIconExample.css";

function CloseGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16">
      <path
        d="M6 18 18 6M6 6l12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function SearchGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16">
      <path
        d="m21 21-4.3-4.3M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export function AccessibleIconExample() {
  return (
    <div className="accessible-icon-example">
      <h2 className="accessible-icon-example__title">AccessibleIcon</h2>

      <section className="accessible-icon-example__section">
        <h3 className="accessible-icon-example__section-title">
          Icon-only buttons
        </h3>
        <p className="accessible-icon-example__description">
          Each button shows only a glyph; the label is announced by screen
          readers.
        </p>
        <div className="accessible-icon-example__row">
          <button className="accessible-icon-example__button">
            <AccessibleIcon label="Close dialog">
              <CloseGlyph />
            </AccessibleIcon>
          </button>
          <button className="accessible-icon-example__button">
            <AccessibleIcon label="Search">
              <SearchGlyph />
            </AccessibleIcon>
          </button>
        </div>
      </section>
    </div>
  );
}
