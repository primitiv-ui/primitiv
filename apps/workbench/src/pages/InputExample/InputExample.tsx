import { FormEvent, useState } from "react";

import { Input, RadioGroup } from "@primitiv-ui/react";

import "./InputExample.css";
// The canonical per-component default theme straight from the registry — the
// same bytes `primitiv add input` copies into a consumer repo (RFC 0006 §7). It
// styles the `.primitiv-input` contract classes applied below, resolving against
// the app-level Primitiv token layer (imported once in main.tsx).
import "../../../../../registry/components/input/styles.css";

const TYPES = [
  { type: "text", label: "Text", placeholder: "Anything" },
  { type: "email", label: "Email", placeholder: "you@example.com" },
  { type: "password", label: "Password", placeholder: "••••••••" },
  { type: "number", label: "Number", placeholder: "0" },
  { type: "search", label: "Search", placeholder: "Search…" },
  { type: "date", label: "Date", placeholder: "" },
] as const;

const SIZES = ["xs", "sm", "md", "lg", "xl"] as const;
const DENSITIES = ["dense", "compact", "comfortable", "spacious"] as const;

export function InputExample() {
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [size, setSize] = useState("md");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    setSubmitted(email);
  }

  return (
    <div className="in-example">
      <h2 className="in-example__title">Input</h2>

      <section className="in-example__section">
        <h3 className="in-example__section-title">
          Default theme — styling contract
        </h3>
        <p className="in-example__description">
          The headless <code>Input</code> with the registry{" "}
          <code>.primitiv-input</code> class applied. The frame maps to the{" "}
          <code>framed-control/*</code> anatomy; <code>:focus-visible</code>{" "}
          draws the shared two-layer ring, <code>aria-invalid</code> tints the
          border, and <code>data-disabled</code> dims it.
        </p>
        <div className="in-example__row">
          <div className="in-example__field-group">
            <span className="in-example__caption">default</span>
            <Input className="primitiv-input" placeholder="Ada Lovelace" />
          </div>
          <div className="in-example__field-group">
            <span className="in-example__caption">invalid</span>
            <Input
              className="primitiv-input"
              aria-invalid
              defaultValue="not-an-email"
              aria-label="Invalid input"
            />
          </div>
          <div className="in-example__field-group">
            <span className="in-example__caption">disabled</span>
            <Input
              className="primitiv-input"
              disabled
              defaultValue="Read-only value"
              aria-label="Disabled input"
            />
          </div>
        </div>
      </section>

      <section className="in-example__section">
        <h3 className="in-example__section-title">Size</h3>
        <p className="in-example__description">
          The <code>size</code> modifier re-points the{" "}
          <code>framed-control/*</code> anatomy at the chosen slot.
        </p>
        <div className="in-example__row">
          {SIZES.map((slot) => (
            <div key={slot} className="in-example__field-group">
              <span className="in-example__caption">{slot}</span>
              <Input
                className={`primitiv-input primitiv-input--${slot}`}
                placeholder={slot}
                aria-label={`Input ${slot}`}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="in-example__section">
        <h3 className="in-example__section-title">Density</h3>
        <p className="in-example__description">
          The same contract-styled input under each <code>data-density</code>{" "}
          scope. Density is ambient — set on any ancestor — and the{" "}
          <code>framed-control/*</code> and <code>body/*</code> tokens resolve to
          the matching scale (RFC 0009). Pick a size to rescale them all.
        </p>

        <RadioGroup.Root
          className="in-example__sizes"
          value={size}
          onValueChange={setSize}
          aria-label="Input size"
        >
          {SIZES.map((slot) => (
            <RadioGroup.Item
              key={slot}
              className="in-example__size-option"
              value={slot}
            >
              <span className="in-example__size-ring">
                <RadioGroup.Indicator
                  className="in-example__size-dot"
                  forceMount
                />
              </span>
              {slot}
            </RadioGroup.Item>
          ))}
        </RadioGroup.Root>

        {DENSITIES.map((density) => (
          <div
            key={density}
            data-density={density}
            className="in-example__density"
          >
            <span className="in-example__density-label">{density}</span>
            <Input
              className={`primitiv-input primitiv-input--${size}`}
              placeholder={`${density} ${size}`}
              aria-label={`Input ${density} ${size}`}
            />
          </div>
        ))}
      </section>

      <section className="in-example__section">
        <h3 className="in-example__section-title">Type gallery</h3>
        <p className="in-example__description">
          Every native input type works — the browser handles each one
          appropriately.
        </p>
        <div className="in-example__grid">
          {TYPES.map(({ type, label, placeholder }) => (
            <div key={type} className="in-example__field-group">
              <label className="in-example__label" htmlFor={`in-type-${type}`}>
                {label}
              </label>
              <Input
                id={`in-type-${type}`}
                className="primitiv-input"
                type={type}
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="in-example__section">
        <h3 className="in-example__section-title">Controlled</h3>
        <p className="in-example__description">
          Driven by React state.{" "}
          <span className="in-example__value">
            {feedback.length} characters.
          </span>
        </p>
        <label className="in-example__label" htmlFor="in-controlled">
          Feedback headline
        </label>
        <Input
          id="in-controlled"
          className="primitiv-input"
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
        />
      </section>

      <section className="in-example__section">
        <h3 className="in-example__section-title">Native validation</h3>
        <p className="in-example__description">
          The browser handles <code>required</code>, <code>type="email"</code>,
          and <code>pattern</code> directly — submit empty or with a malformed
          email to see the native error UI.
        </p>
        <form className="in-example__form" onSubmit={handleSubmit}>
          <label className="in-example__label" htmlFor="in-validated">
            Email
          </label>
          <Input
            id="in-validated"
            className="primitiv-input"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
          />
          <button className="in-example__submit" type="submit">
            Submit
          </button>
        </form>
        {submitted !== null && (
          <p className="in-example__success">
            Submitted: <strong>{submitted}</strong>
          </p>
        )}
      </section>
    </div>
  );
}
