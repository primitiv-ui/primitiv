import { useState, type ComponentProps } from "react";

import { Select } from "@primitiv/react";

import "./SelectExample.css";

function StyledSelect(props: ComponentProps<"select">) {
  return <select {...props} className="sel-example__styled-select" />;
}

export function SelectExample() {
  const [fruit, setFruit] = useState("apple");
  const [submitted, setSubmitted] = useState<string | null>(null);

  return (
    <div className="sel-example">
      <h2 className="sel-example__title">Select</h2>

      <section className="sel-example__section">
        <h3 className="sel-example__section-title">Uncontrolled</h3>
        <p className="sel-example__description">
          Native <code>&lt;select&gt;</code> with <code>defaultValue</code>.
          State is owned by the browser.
        </p>
        <label className="sel-example__row">
          <span className="sel-example__label">Pick a fruit</span>
          <Select.Root className="sel-example__select" defaultValue="banana">
            <Select.Option value="apple">Apple</Select.Option>
            <Select.Option value="banana">Banana</Select.Option>
            <Select.Option value="cherry">Cherry</Select.Option>
          </Select.Root>
        </label>
      </section>

      <section className="sel-example__section">
        <h3 className="sel-example__section-title">Controlled</h3>
        <p className="sel-example__description">
          State is owned by the parent.{" "}
          <span className="sel-example__value">
            Current value: <strong>{fruit}</strong>.
          </span>
        </p>
        <label className="sel-example__row">
          <span className="sel-example__label">Pick a fruit</span>
          <Select.Root
            className="sel-example__select"
            value={fruit}
            onValueChange={setFruit}
          >
            <Select.Option value="apple">Apple</Select.Option>
            <Select.Option value="banana">Banana</Select.Option>
            <Select.Option value="cherry">Cherry</Select.Option>
          </Select.Root>
        </label>
      </section>

      <section className="sel-example__section">
        <h3 className="sel-example__section-title">Placeholder + Groups</h3>
        <p className="sel-example__description">
          Placeholder is the initial selection; groups split related
          options under a non-selectable heading.
        </p>
        <label className="sel-example__row">
          <span className="sel-example__label">Pick a food</span>
          <Select.Root className="sel-example__select">
            <Select.Placeholder>Choose a food…</Select.Placeholder>
            <Select.Group label="Fruits">
              <Select.Option value="apple">Apple</Select.Option>
              <Select.Option value="banana">Banana</Select.Option>
            </Select.Group>
            <Select.Group label="Vegetables">
              <Select.Option value="carrot">Carrot</Select.Option>
              <Select.Option value="celery">Celery</Select.Option>
            </Select.Group>
          </Select.Root>
        </label>
      </section>

      <section className="sel-example__section">
        <h3 className="sel-example__section-title">Form integration</h3>
        <p className="sel-example__description">
          Native <code>name</code> + <code>required</code> + a real{" "}
          <code>&lt;form&gt;</code>. Submission carries the value with no extra
          wiring.{" "}
          {submitted !== null && (
            <span className="sel-example__value">
              Submitted: <strong>{submitted || "(empty)"}</strong>.
            </span>
          )}
        </p>
        <form
          className="sel-example__form"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            setSubmitted(String(data.get("fruit") ?? ""));
          }}
        >
          <label className="sel-example__row">
            <span className="sel-example__label">Fruit</span>
            <Select.Root
              className="sel-example__select"
              name="fruit"
              required
            >
              <Select.Placeholder>Choose a fruit…</Select.Placeholder>
              <Select.Option value="apple">Apple</Select.Option>
              <Select.Option value="banana">Banana</Select.Option>
            </Select.Root>
          </label>
          <button type="submit" className="sel-example__submit">
            Submit
          </button>
        </form>
      </section>

      <section className="sel-example__section">
        <h3 className="sel-example__section-title">Disabled</h3>
        <div className="sel-example__list">
          <label className="sel-example__row">
            <span className="sel-example__label">Whole control disabled</span>
            <Select.Root className="sel-example__select" disabled>
              <Select.Option value="apple">Apple</Select.Option>
            </Select.Root>
          </label>
          <label className="sel-example__row">
            <span className="sel-example__label">Individual option disabled</span>
            <Select.Root className="sel-example__select" defaultValue="apple">
              <Select.Option value="apple">Apple</Select.Option>
              <Select.Option value="durian" disabled>
                Durian (sold out)
              </Select.Option>
            </Select.Root>
          </label>
        </div>
      </section>

      <section className="sel-example__section">
        <h3 className="sel-example__section-title">asChild</h3>
        <p className="sel-example__description">
          Root delegates to a consumer-supplied <code>&lt;select&gt;</code>{" "}
          wrapper; Root's props are merged onto it.
        </p>
        <label className="sel-example__row">
          <span className="sel-example__label">Custom-styled select</span>
          <Select.Root asChild defaultValue="apple">
            <StyledSelect>
              <Select.Option value="apple">Apple</Select.Option>
              <Select.Option value="banana">Banana</Select.Option>
            </StyledSelect>
          </Select.Root>
        </label>
      </section>
    </div>
  );
}
