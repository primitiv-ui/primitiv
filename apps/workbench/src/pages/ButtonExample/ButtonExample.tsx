import { useState } from "react";

import { Button } from "@primitiv-ui/react";

import "./ButtonExample.css";
// The generated Primitiv token layer (custom-property defaults) + the canonical
// per-component default theme straight from the registry. Together they style
// the `.primitiv-button` contract classes applied below — the same bytes
// `primitiv add button` copies into a consumer repo (RFC 0006 §7).
import "./primitiv-tokens.css";
import "../../../../../registry/r/button/styles.css";

const INTENTS = ["primary", "secondary", "danger", "link"] as const;
const SIZES = ["xs", "sm", "md", "lg", "xl"] as const;
const DENSITIES = ["dense", "compact", "comfortable", "spacious"] as const;

export function ButtonExample() {
  const [count, setCount] = useState(0);

  return (
    <div className="btn-example">
      <h2 className="btn-example__title">Button</h2>

      <section className="btn-example__section">
        <h3 className="btn-example__section-title">
          Default theme — styling contract
        </h3>
        <p className="btn-example__description">
          The headless <code>Button</code> with the registry{" "}
          <code>.primitiv-button</code> classes applied. Intents are visual
          modifiers; <code>data-disabled</code> styles itself.
        </p>

        <div className="btn-example__row">
          {INTENTS.map((intent) => (
            <Button
              key={intent}
              className={`primitiv-button primitiv-button--${intent} primitiv-button--md`}
            >
              {intent}
            </Button>
          ))}
        </div>

        <div className="btn-example__row">
          {SIZES.map((size) => (
            <Button
              key={size}
              className={`primitiv-button primitiv-button--primary primitiv-button--${size}`}
            >
              {size}
            </Button>
          ))}
        </div>

        <div className="btn-example__row">
          <Button className="primitiv-button primitiv-button--primary primitiv-button--md">
            Default
          </Button>
          <Button
            className="primitiv-button primitiv-button--primary primitiv-button--md"
            disabled
          >
            Disabled
          </Button>
          <Button
            className="primitiv-button primitiv-button--danger primitiv-button--md"
            aria-label="Delete"
          >
            <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
              <path
                d="M6 18 18 6M6 6l12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            Delete
          </Button>
        </div>
      </section>

      <section className="btn-example__section">
        <h3 className="btn-example__section-title">Density</h3>
        <p className="btn-example__description">
          The same md button under each <code>data-density</code> scope. Density
          is ambient — set on any ancestor — and the <code>framed-control/*</code>{" "}
          and <code>label/*</code> tokens resolve to the matching scale (RFC
          0009).
        </p>

        {DENSITIES.map((density) => (
          <div
            key={density}
            data-density={density}
            className="btn-example__density"
          >
            <span className="btn-example__density-label">{density}</span>
            <div className="btn-example__row">
              {INTENTS.map((intent) => (
                <Button
                  key={intent}
                  className={`primitiv-button primitiv-button--${intent} primitiv-button--md`}
                >
                  {intent}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="btn-example__section">
        <h3 className="btn-example__section-title">Default</h3>
        <p className="btn-example__description">
          Renders <code>{`<button type="button">`}</code>.{" "}
          <span className="btn-example__value">Clicked {count} times.</span>
        </p>
        <Button
          className="btn-example__button"
          onClick={() => setCount((c) => c + 1)}
        >
          Click me
        </Button>
      </section>

      <section className="btn-example__section">
        <h3 className="btn-example__section-title">Form types</h3>
        <p className="btn-example__description">
          Override <code>type</code> for form semantics.
        </p>
        <form
          className="btn-example__row"
          onSubmit={(event) => event.preventDefault()}
        >
          <Button className="btn-example__button" type="submit">
            Submit
          </Button>
          <Button className="btn-example__button" type="reset">
            Reset
          </Button>
        </form>
      </section>

      <section className="btn-example__section">
        <h3 className="btn-example__section-title">Disabled</h3>
        <Button className="btn-example__button" disabled>
          Disabled
        </Button>
      </section>

      <section className="btn-example__section">
        <h3 className="btn-example__section-title">Icon only</h3>
        <p className="btn-example__description">
          A decorative icon plus an <code>aria-label</code> for the
          accessible name.
        </p>
        <Button
          className="btn-example__button btn-example__button--icon"
          aria-label="Close"
        >
          <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 24 24"
            width="16"
            height="16"
          >
            <path
              d="M6 18 18 6M6 6l12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </Button>
      </section>

      <section className="btn-example__section">
        <h3 className="btn-example__section-title">asChild</h3>
        <p className="btn-example__description">
          Render an anchor with the button styling.
        </p>
        <Button className="btn-example__button" asChild>
          <a href="#button-aschild">Anchor button</a>
        </Button>
      </section>
    </div>
  );
}
