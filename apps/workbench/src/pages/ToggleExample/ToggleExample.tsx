import { useState } from "react";

import { Toggle } from "@primitiv/react";

import "./ToggleExample.scss";

export function ToggleExample() {
  const [bold, setBold] = useState(false);

  return (
    <div className="toggle-example">
      <h2 className="toggle-example__title">Toggle</h2>

      <section className="toggle-example__section">
        <h3 className="toggle-example__section-title">Uncontrolled</h3>
        <p className="toggle-example__description">
          Press to toggle. State is owned by the component.
        </p>
        <div className="toggle-example__row">
          <Toggle className="toggle" aria-label="Bold" defaultPressed>
            <strong>B</strong>
          </Toggle>
          <Toggle className="toggle" aria-label="Italic">
            <em>I</em>
          </Toggle>
          <Toggle className="toggle" aria-label="Underline">
            <span style={{ textDecoration: "underline" }}>U</span>
          </Toggle>
        </div>
      </section>

      <section className="toggle-example__section">
        <h3 className="toggle-example__section-title">Controlled</h3>
        <p className="toggle-example__description">
          State is owned by the parent.{" "}
          <span className="toggle-example__value">
            Bold is {bold ? "on" : "off"}.
          </span>
        </p>
        <Toggle
          className="toggle"
          aria-label="Bold"
          pressed={bold}
          onPressedChange={setBold}
        >
          <strong>B</strong>
        </Toggle>
      </section>

      <section className="toggle-example__section">
        <h3 className="toggle-example__section-title">Disabled</h3>
        <div className="toggle-example__row">
          <Toggle className="toggle" aria-label="Bold (off, disabled)" disabled>
            <strong>B</strong>
          </Toggle>
          <Toggle
            className="toggle"
            aria-label="Italic (on, disabled)"
            defaultPressed
            disabled
          >
            <em>I</em>
          </Toggle>
        </div>
      </section>
    </div>
  );
}
