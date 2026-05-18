import { useState } from "react";

import { Checkbox } from "@primitiv/react";

import "./CheckboxExample.scss";

function CheckIcon() {
  return (
    <svg className="cb-example__check" viewBox="0 0 10 10" aria-hidden="true">
      <path
        d="M1 5 4 8 9 1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export function CheckboxExample() {
  const [checked, setChecked] = useState<boolean | "indeterminate">(
    "indeterminate",
  );

  return (
    <div className="cb-example">
      <h2 className="cb-example__title">Checkbox</h2>

      <section className="cb-example__section">
        <h3 className="cb-example__section-title">Uncontrolled</h3>
        <div className="cb-example__field">
          <Checkbox.Root
            className="cb-example__box"
            defaultChecked
            aria-label="Accept terms"
          >
            <Checkbox.Indicator>
              <CheckIcon />
            </Checkbox.Indicator>
          </Checkbox.Root>
          <span>Accept terms</span>
        </div>
      </section>

      <section className="cb-example__section">
        <h3 className="cb-example__section-title">Controlled tri-state</h3>
        <p className="cb-example__description">
          Click to cycle. Current state:{" "}
          <span className="cb-example__value">{String(checked)}</span>
        </p>
        <div className="cb-example__field">
          <Checkbox.Root
            className="cb-example__box"
            checked={checked}
            onCheckedChange={setChecked}
            aria-label="Select all"
          >
            <Checkbox.Indicator>
              <CheckIcon />
            </Checkbox.Indicator>
          </Checkbox.Root>
          <span>Select all</span>
        </div>
      </section>

      <section className="cb-example__section">
        <h3 className="cb-example__section-title">Disabled</h3>
        <div className="cb-example__field">
          <Checkbox.Root
            className="cb-example__box"
            defaultChecked
            disabled
            aria-label="Locked setting"
          >
            <Checkbox.Indicator>
              <CheckIcon />
            </Checkbox.Indicator>
          </Checkbox.Root>
          <span>Locked setting</span>
        </div>
      </section>
    </div>
  );
}
