import { SkipNav } from "@primitiv/react";

import "./SkipNavExample.css";

export function SkipNavExample() {
  return (
    <div className="skip-nav-example">
      <h2 className="skip-nav-example__title">SkipNav</h2>
      <p className="skip-nav-example__description">
        Press <kbd>Tab</kbd> from the top of the page — the skip link is the
        first focusable element. Activate it to move focus past the
        navigation straight to the main content.
      </p>

      <SkipNav.Link className="skip-nav-example__link">
        Skip to main content
      </SkipNav.Link>

      <nav className="skip-nav-example__nav" aria-label="Example navigation">
        <a className="skip-nav-example__nav-link" href="#products">
          Products
        </a>
        <a className="skip-nav-example__nav-link" href="#pricing">
          Pricing
        </a>
        <a className="skip-nav-example__nav-link" href="#about">
          About
        </a>
        <a className="skip-nav-example__nav-link" href="#contact">
          Contact
        </a>
      </nav>

      <SkipNav.Content className="skip-nav-example__content">
        <h3 className="skip-nav-example__content-title">Main content</h3>
        <p className="skip-nav-example__text">
          Focus lands on this region after the skip link is followed, so the
          next <kbd>Tab</kbd> continues from here rather than the top of the
          page.
        </p>
      </SkipNav.Content>
    </div>
  );
}
