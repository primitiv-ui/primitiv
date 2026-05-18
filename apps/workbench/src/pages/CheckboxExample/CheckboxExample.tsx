import { useState } from "react";

import { Check, Minus } from "@primitiv/icons";
import { Checkbox, CheckedState } from "@primitiv/react";

import "./CheckboxExample.scss";

type Options = {
  a: boolean;
  b: boolean;
  c: boolean;
};

export function CheckboxExample() {
  const [options, setOptions] = useState<Options>({
    a: true,
    b: false,
    c: false,
  });

  const checkedCount = Object.values(options).filter(Boolean).length;
  const totalCount = Object.keys(options).length;
  const allState: CheckedState =
    checkedCount === 0
      ? false
      : checkedCount === totalCount
        ? true
        : "indeterminate";

  function handleAllChange(next: boolean) {
    setOptions({ a: next, b: next, c: next });
  }

  function toggleOption(key: keyof Options) {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="cb-example">
      <h2 className="cb-example__title">Checkbox</h2>

      <section className="cb-example__section">
        <h3 className="cb-example__section-title">Uncontrolled</h3>
        <div className="cb-example__field">
          <Checkbox.Root
            id="cb-accept-terms"
            className="cb-example__box"
            defaultChecked
          >
            <Checkbox.Indicator>
              <Check className="cb-example__indicator-icon" />
            </Checkbox.Indicator>
          </Checkbox.Root>
          <label htmlFor="cb-accept-terms">Accept terms</label>
        </div>
      </section>

      <section className="cb-example__section">
        <h3 className="cb-example__section-title">Controlled tri-state</h3>
        <p className="cb-example__description">
          The parent reflects the collective state of the three children.
          Clicking the parent from any partial state checks all; clicking when
          all are checked unchecks all.
        </p>

        <div className="cb-example__field">
          <Checkbox.Root
            id="cb-select-all"
            className="cb-example__box"
            checked={allState}
            onCheckedChange={handleAllChange}
          >
            <Checkbox.Indicator>
              {allState === "indeterminate" ? (
                <Minus className="cb-example__indicator-icon" />
              ) : (
                <Check className="cb-example__indicator-icon" />
              )}
            </Checkbox.Indicator>
          </Checkbox.Root>
          <label htmlFor="cb-select-all">Select all</label>
        </div>

        <ul className="cb-example__children">
          {(
            [
              ["a", "Option A"],
              ["b", "Option B"],
              ["c", "Option C"],
            ] as const
          ).map(([key, label]) => (
            <li key={key} className="cb-example__field">
              <Checkbox.Root
                id={`cb-option-${key}`}
                className="cb-example__box"
                checked={options[key]}
                onCheckedChange={() => toggleOption(key)}
              >
                <Checkbox.Indicator>
                  <Check className="cb-example__indicator-icon" />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <label htmlFor={`cb-option-${key}`}>{label}</label>
            </li>
          ))}
        </ul>
      </section>

      <section className="cb-example__section">
        <h3 className="cb-example__section-title">Disabled</h3>
        <div className="cb-example__field">
          <Checkbox.Root
            id="cb-locked-setting"
            className="cb-example__box"
            defaultChecked
            disabled
          >
            <Checkbox.Indicator>
              <Check className="cb-example__indicator-icon" />
            </Checkbox.Indicator>
          </Checkbox.Root>
          <label htmlFor="cb-locked-setting">Locked setting</label>
        </div>
      </section>
    </div>
  );
}
