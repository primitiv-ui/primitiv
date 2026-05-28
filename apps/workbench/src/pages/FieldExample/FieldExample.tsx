import { FormEvent, useState } from "react";

import { Mail } from "@primitiv/icons";
import { Field, Input, InputGroup, Select, Textarea } from "@primitiv/react";

import "./FieldExample.scss";

export function FieldExample() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

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
        <h3 className="fl-example__section-title">Basic</h3>
        <p className="fl-example__description">
          Label, input, and description wired together via{" "}
          <code>FieldContext</code>. No manual <code>id</code> or{" "}
          <code>aria-describedby</code> in the consumer code.
        </p>
        <Field.Root className="fl-example__field">
          <Field.Label className="fl-example__label">Display name</Field.Label>
          <Input className="fl-example__input" placeholder="Ada Lovelace" />
          <Field.Description className="fl-example__hint">
            The name shown to other people.
          </Field.Description>
        </Field.Root>
      </section>

      <section className="fl-example__section">
        <h3 className="fl-example__section-title">
          With invalid state + error message
        </h3>
        <p className="fl-example__description">
          Toggle <code>Field.Root invalid</code> and{" "}
          <code>Field.ErrorText</code> renders. <code>Input</code>{" "}
          automatically picks up <code>aria-invalid="true"</code> and adds the
          error id to its <code>aria-describedby</code>.
        </p>
        <form
          className="fl-example__form"
          onSubmit={handleSubmit}
          noValidate
        >
          <Field.Root className="fl-example__field" invalid={!!error}>
            <Field.Label className="fl-example__label">Email</Field.Label>
            <Input
              className="fl-example__input"
              type="email"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError(null);
              }}
              placeholder="you@example.com"
            />
            <Field.ErrorText className="fl-example__error">
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
          <code>Field.Root required</code> cascades to the input — submit the
          form empty to see the browser's native constraint UI.
        </p>
        <form
          className="fl-example__form"
          onSubmit={(event) => {
            event.preventDefault();
            alert("Submitted");
          }}
        >
          <Field.Root className="fl-example__field" required>
            <Field.Label className="fl-example__label">Full name</Field.Label>
            <Input
              className="fl-example__input"
              placeholder="Required by the field"
            />
            <Field.Description className="fl-example__hint">
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
          carries <code>data-field-disabled</code> so the whole field group can
          dim in CSS.
        </p>
        <Field.Root className="fl-example__field" disabled>
          <Field.Label className="fl-example__label">Locked field</Field.Label>
          <Input
            className="fl-example__input"
            defaultValue="Set by an admin"
          />
          <Field.Description className="fl-example__hint">
            Contact support to change this.
          </Field.Description>
        </Field.Root>
      </section>

      <section className="fl-example__section">
        <h3 className="fl-example__section-title">Works with any control</h3>
        <p className="fl-example__description">
          <code>Textarea</code> and <code>Select.Root</code> both read{" "}
          <code>FieldContext</code> too — same auto-wiring rules apply.
        </p>
        <Field.Root className="fl-example__field" id="fl-bio">
          <Field.Label className="fl-example__label">Bio</Field.Label>
          <Textarea
            className="fl-example__input"
            rows={3}
            placeholder="Tell us about yourself"
          />
          <Field.Description className="fl-example__hint">
            A short summary shown on your profile.
          </Field.Description>
        </Field.Root>
        <Field.Root className="fl-example__field" id="fl-fruit">
          <Field.Label className="fl-example__label">
            Favourite fruit
          </Field.Label>
          <Select.Root className="fl-example__input">
            <Select.Placeholder>Choose a fruit…</Select.Placeholder>
            <Select.Option value="apple">Apple</Select.Option>
            <Select.Option value="banana">Banana</Select.Option>
            <Select.Option value="cherry">Cherry</Select.Option>
          </Select.Root>
          <Field.Description className="fl-example__hint">
            We'll feature this on the menu.
          </Field.Description>
        </Field.Root>
      </section>

      <section className="fl-example__section">
        <h3 className="fl-example__section-title">With InputGroup adornment</h3>
        <p className="fl-example__description">
          <code>Field</code> and <code>InputGroup</code> compose — the field
          wraps the whole group, the group wraps the control plus adornments.
          Context flows through the DOM nesting without ceremony.
        </p>
        <Field.Root className="fl-example__field" id="fl-newsletter">
          <Field.Label className="fl-example__label">Email</Field.Label>
          <InputGroup className="fl-example__group">
            <InputGroup.LeadingAdornment className="fl-example__icon">
              <Mail size={18} aria-hidden="true" />
            </InputGroup.LeadingAdornment>
            <Input
              className="fl-example__group-input"
              type="email"
              placeholder="you@example.com"
            />
          </InputGroup>
          <Field.Description className="fl-example__hint">
            We'll send a confirmation link.
          </Field.Description>
        </Field.Root>
      </section>
    </div>
  );
}
