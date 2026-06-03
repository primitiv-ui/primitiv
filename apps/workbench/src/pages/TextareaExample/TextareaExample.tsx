import { useState } from "react";

import { Textarea } from "@primitiv/react";

import "./TextareaExample.css";

export function TextareaExample() {
  const [value, setValue] = useState("");

  return (
    <div className="ta-example">
      <h2 className="ta-example__title">Textarea</h2>

      <section className="ta-example__section">
        <h3 className="ta-example__section-title">Default</h3>
        <p className="ta-example__description">
          A native <code>{`<textarea>`}</code> paired with a{" "}
          <code>{`<label>`}</code>.
        </p>
        <label className="ta-example__label" htmlFor="ta-default">
          Bio
        </label>
        <Textarea
          id="ta-default"
          className="ta-example__field"
          rows={4}
          placeholder="Tell us about yourself"
        />
      </section>

      <section className="ta-example__section">
        <h3 className="ta-example__section-title">Controlled</h3>
        <p className="ta-example__description">
          Driven by React state.{" "}
          <span className="ta-example__value">
            {value.length} characters.
          </span>
        </p>
        <label className="ta-example__label" htmlFor="ta-controlled">
          Feedback
        </label>
        <Textarea
          id="ta-controlled"
          className="ta-example__field"
          rows={4}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </section>

      <section className="ta-example__section">
        <h3 className="ta-example__section-title">Disabled</h3>
        <Textarea
          aria-label="Disabled field"
          className="ta-example__field"
          rows={3}
          defaultValue="This field is disabled."
          disabled
        />
      </section>
    </div>
  );
}
