import { useState } from "react";

import { Button } from "@primitiv/react";

import "./ButtonExample.scss";

export function ButtonExample() {
  const [count, setCount] = useState(0);

  return (
    <div className="btn-example">
      <h2 className="btn-example__title">Button</h2>

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
