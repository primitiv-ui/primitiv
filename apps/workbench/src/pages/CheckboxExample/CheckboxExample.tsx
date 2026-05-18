import { useState } from "react";

import { Check, Minus } from "@primitiv/icons";
import { Checkbox } from "@primitiv/react";

import "./CheckboxExample.scss";

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
              <Check className="cb-example__indicator-icon" />
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
            onCheckedChange={() => {
              setChecked((prev) =>
                prev === "indeterminate"
                  ? true
                  : prev
                    ? false
                    : "indeterminate",
              );
            }}
            aria-label="Select all"
          >
            <Checkbox.Indicator>
              {checked === "indeterminate" ? (
                <Minus className="cb-example__indicator-icon" />
              ) : (
                <Check className="cb-example__indicator-icon" />
              )}
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
              <Check className="cb-example__indicator-icon" />
            </Checkbox.Indicator>
          </Checkbox.Root>
          <span>Locked setting</span>
        </div>
      </section>
    </div>
  );
}
