import { FormEvent, useState } from "react";

import { Mail } from "@primitiv-ui/icons";
import {
  Field,
  Input,
  InputGroup,
  RadioGroup,
  Select,
  Textarea,
} from "@primitiv-ui/react";

import "./FieldExample.css";
// The canonical per-component default themes straight from the registry — the
// same bytes `primitiv add field` / `add input` / `add input-group` copy into a
// consumer repo (RFC 0006 §7). They style the `.primitiv-field*`,
// `.primitiv-input` and `.primitiv-input-group*` contract classes applied below,
// resolving against the app-level Primitiv token layer (imported in main.tsx).
import "../../../../../registry/components/field/styles.css";
import "../../../../../registry/components/input/styles.css";
import "../../../../../registry/components/input-group/styles.css";

const SIZES = ["xs", "sm", "md", "lg", "xl"] as const;
const DENSITIES = ["dense", "compact", "comfortable", "spacious"] as const;

export function FieldExample() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [size, setSize] = useState("md");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    alert(`Submitted: ${email}`);
  }

  return (
    <div className="fl-example">
      <h2 className="fl-example__title">Field</h2>

      <section className="fl-example__section">
        <h3 className="fl-example__section-title">
          Default theme — styling contract
        </h3>
        <p className="fl-example__description">
          The headless <code>Field</code> with the registry{" "}
          <code>.primitiv-field</code> classes applied — a vertical stack of
          label, control, and description wired through <code>FieldContext</code>
          . No manual <code>id</code> or <code>aria-describedby</code> in the
          consumer code.
        </p>
        <Field.Root className="primitiv-field">
          <Field.Label className="primitiv-field__label">
            Display name
          </Field.Label>
          <Input className="primitiv-input" placeholder="Ada Lovelace" />
          <Field.Description className="primitiv-field__description">
            The name shown to other people.
          </Field.Description>
        </Field.Root>
      </section>

      <section className="fl-example__section">
        <h3 className="fl-example__section-title">Density</h3>
        <p className="fl-example__description">
          The same contract-styled field under each <code>data-density</code>{" "}
          scope. Density is ambient — the label, control, and helper tokens
          resolve to the matching scale (RFC 0009). Pick a size to rescale the
          control.
        </p>

        <RadioGroup.Root
          className="fl-example__sizes"
          value={size}
          onValueChange={setSize}
          aria-label="Field control size"
        >
          {SIZES.map((slot) => (
            <RadioGroup.Item
              key={slot}
              className="fl-example__size-option"
              value={slot}
            >
              <span className="fl-example__size-ring">
                <RadioGroup.Indicator
                  className="fl-example__size-dot"
                  forceMount
                />
              </span>
              {slot}
            </RadioGroup.Item>
          ))}
        </RadioGroup.Root>

        <div className="fl-example__density-grid">
          {DENSITIES.map((density) => (
            <div key={density} data-density={density}>
              <span className="fl-example__density-label">{density}</span>
              <Field.Root className="primitiv-field">
                <Field.Label className="primitiv-field__label">
                  Email
                </Field.Label>
                <Input
                  className={`primitiv-input primitiv-input--${size}`}
                  type="email"
                  placeholder="you@example.com"
                  aria-label={`Email — ${density} ${size}`}
                />
                <Field.Description className="primitiv-field__description">
                  We won&rsquo;t share it.
                </Field.Description>
              </Field.Root>
            </div>
          ))}
        </div>
      </section>

      <section className="fl-example__section">
        <h3 className="fl-example__section-title">
          Invalid state + error message
        </h3>
        <p className="fl-example__description">
          Toggle <code>Field.Root invalid</code> and{" "}
          <code>Field.ErrorText</code> renders. <code>Input</code> automatically
          picks up <code>aria-invalid="true"</code> — its border tints red — and
          adds the error id to its <code>aria-describedby</code>.
        </p>
        <form className="fl-example__form" onSubmit={handleSubmit} noValidate>
          <Field.Root className="primitiv-field" invalid={!!error}>
            <Field.Label className="primitiv-field__label">Email</Field.Label>
            <Input
              className="primitiv-input"
              type="email"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError(null);
              }}
              placeholder="you@example.com"
            />
            <Field.ErrorText className="primitiv-field__error">
              {error}
            </Field.ErrorText>
          </Field.Root>
          <button className="fl-example__submit" type="submit">
            Submit
          </button>
        </form>
      </section>

      <section className="fl-example__section">
        <h3 className="fl-example__section-title">Required cascade</h3>
        <p className="fl-example__description">
          <code>Field.Root required</code> cascades to the input — its label
          grows a required marker, and submitting the form empty shows the
          browser&rsquo;s native constraint UI.
        </p>
        <form
          className="fl-example__form"
          onSubmit={(event) => {
            event.preventDefault();
            alert("Submitted");
          }}
        >
          <Field.Root className="primitiv-field" required>
            <Field.Label className="primitiv-field__label">
              Full name
            </Field.Label>
            <Input
              className="primitiv-input"
              placeholder="Required by the field"
            />
            <Field.Description className="primitiv-field__description">
              No <code>required</code> prop on the Input — it inherits from the
              field.
            </Field.Description>
          </Field.Root>
          <button className="fl-example__submit" type="submit">
            Submit
          </button>
        </form>
      </section>

      <section className="fl-example__section">
        <h3 className="fl-example__section-title">Disabled cascade</h3>
        <p className="fl-example__description">
          <code>Field.Root disabled</code> cascades to the input. The wrapper
          carries <code>data-field-disabled</code>, so the whole field group
          dims via the registry stylesheet.
        </p>
        <Field.Root className="primitiv-field" disabled>
          <Field.Label className="primitiv-field__label">
            Locked field
          </Field.Label>
          <Input className="primitiv-input" defaultValue="Set by an admin" />
          <Field.Description className="primitiv-field__description">
            Contact support to change this.
          </Field.Description>
        </Field.Root>
      </section>

      <section className="fl-example__section">
        <h3 className="fl-example__section-title">With InputGroup adornment</h3>
        <p className="fl-example__description">
          <code>Field</code> and <code>InputGroup</code> compose — the field
          wraps the whole group, the group frames the control plus a leading
          icon. Context flows through the DOM nesting without ceremony.
        </p>
        <Field.Root className="primitiv-field" id="fl-newsletter">
          <Field.Label className="primitiv-field__label">Email</Field.Label>
          <InputGroup className="primitiv-input-group primitiv-input-group--md">
            <InputGroup.LeadingAdornment className="primitiv-input-group__leading">
              <Mail aria-hidden="true" />
            </InputGroup.LeadingAdornment>
            <Input className="primitiv-input" type="email" placeholder="you@example.com" />
          </InputGroup>
          <Field.Description className="primitiv-field__description">
            We&rsquo;ll send a confirmation link.
          </Field.Description>
        </Field.Root>
      </section>

      <section className="fl-example__section">
        <h3 className="fl-example__section-title">Works with any control</h3>
        <p className="fl-example__description">
          <code>Textarea</code> and <code>Select.Root</code> both read{" "}
          <code>FieldContext</code> too — same auto-wiring rules apply.
        </p>
        <Field.Root className="primitiv-field" id="fl-bio">
          <Field.Label className="primitiv-field__label">Bio</Field.Label>
          <Textarea
            className="primitiv-input fl-example__textarea"
            rows={3}
            placeholder="Tell us about yourself"
          />
          <Field.Description className="primitiv-field__description">
            A short summary shown on your profile.
          </Field.Description>
        </Field.Root>
        <Field.Root className="primitiv-field" id="fl-fruit">
          <Field.Label className="primitiv-field__label">
            Favourite fruit
          </Field.Label>
          <Select.Root className="primitiv-input">
            <Select.Placeholder>Choose a fruit…</Select.Placeholder>
            <Select.Option value="apple">Apple</Select.Option>
            <Select.Option value="banana">Banana</Select.Option>
            <Select.Option value="cherry">Cherry</Select.Option>
          </Select.Root>
          <Field.Description className="primitiv-field__description">
            We&rsquo;ll feature this on the menu.
          </Field.Description>
        </Field.Root>
      </section>
    </div>
  );
}
