import { FormEvent, useState } from "react";

import { Input } from "@primitiv/react";

import "./InputExample.css";

const TYPES = [
  { type: "text", label: "Text", placeholder: "Anything" },
  { type: "email", label: "Email", placeholder: "you@example.com" },
  { type: "password", label: "Password", placeholder: "••••••••" },
  { type: "number", label: "Number", placeholder: "0" },
  { type: "search", label: "Search", placeholder: "Search…" },
  { type: "date", label: "Date", placeholder: "" },
] as const;

export function InputExample() {
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);

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
        <h3 className="in-example__section-title">Default</h3>
        <p className="in-example__description">
          A native <code>{`<input>`}</code> paired with a{" "}
          <code>{`<label>`}</code>. <code>type="text"</code> by default.
        </p>
        <label className="in-example__label" htmlFor="in-default">
          Display name
        </label>
        <Input
          id="in-default"
          className="in-example__field"
          placeholder="Ada Lovelace"
        />
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
              <label
                className="in-example__label"
                htmlFor={`in-type-${type}`}
              >
                {label}
              </label>
              <Input
                id={`in-type-${type}`}
                className="in-example__field"
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
          className="in-example__field"
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
        />
      </section>

      <section className="in-example__section">
        <h3 className="in-example__section-title">Native validation</h3>
        <p className="in-example__description">
          The browser handles <code>required</code>, <code>type="email"</code>,
          and <code>pattern</code> directly — submit empty or with a malformed
          email to see the native error UI. CSS targets{" "}
          <code>input:invalid</code> for styling.
        </p>
        <form className="in-example__form" onSubmit={handleSubmit} noValidate={false}>
          <label className="in-example__label" htmlFor="in-validated">
            Email
          </label>
          <Input
            id="in-validated"
            className="in-example__field in-example__field--validated"
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

      <section className="in-example__section">
        <h3 className="in-example__section-title">Disabled</h3>
        <p className="in-example__description">
          Native <code>disabled</code> plus a <code>data-disabled</code>{" "}
          styling hook.
        </p>
        <label className="in-example__label" htmlFor="in-disabled">
          Locked field
        </label>
        <Input
          id="in-disabled"
          className="in-example__field"
          defaultValue="Read-only value"
          disabled
        />
      </section>
    </div>
  );
}
