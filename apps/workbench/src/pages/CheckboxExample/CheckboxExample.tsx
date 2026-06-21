import { useState } from "react";

import { Check, Minus } from "@primitiv-ui/icons";
import { Checkbox, CheckedState, RadioGroup } from "@primitiv-ui/react";

import "./CheckboxExample.css";
// The canonical per-component default theme straight from the registry — the
// same bytes `primitiv add checkbox` copies into a consumer repo. It styles the
// `.primitiv-checkbox` / `.primitiv-checkbox__indicator` contract classes
// applied below, resolving against the app-level Primitiv token layer (main.tsx).
import "../../../../../registry/components/checkbox/styles.css";

const SIZES = ["xs", "sm", "md", "lg", "xl"] as const;
const DENSITIES = ["dense", "compact", "comfortable", "spacious"] as const;

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
  const [size, setSize] = useState("md");

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
        <h3 className="cb-example__section-title">
          Default theme — styling contract
        </h3>
        <p className="cb-example__description">
          The headless <code>Checkbox</code> — a real hidden{" "}
          <code>&lt;input type="checkbox"&gt;</code> in a{" "}
          <code>.primitiv-checkbox</code> box — with the registry classes
          applied. The tick (or mixed bar) shows off the input's native{" "}
          <code>:checked</code> / <code>:indeterminate</code>;{" "}
          <code>data-disabled</code> styles itself.
        </p>

        <div className="cb-example__contract-row">
          {[
            { caption: "off", props: {} },
            { caption: "on", props: { defaultChecked: true } },
            {
              caption: "mixed",
              props: { defaultChecked: "indeterminate" as const },
            },
            {
              caption: "disabled on",
              props: { defaultChecked: true, disabled: true },
            },
          ].map(({ caption, props }) => (
            <div key={caption} className="cb-example__labeled">
              <Checkbox.Root
                className="primitiv-checkbox"
                aria-label={`Checkbox — ${caption}`}
                {...props}
              >
                <Checkbox.Indicator className="primitiv-checkbox__indicator" />
              </Checkbox.Root>
              <small className="cb-example__caption">{caption}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="cb-example__section">
        <h3 className="cb-example__section-title">Size & density</h3>
        <p className="cb-example__description">
          The <code>size</code> modifier re-points the box, radius and mark
          tokens, and density is ambient via <code>data-density</code> — so the
          whole control scales together (RFC 0009). Pick a size to apply the{" "}
          <code>--{size}</code> modifier to every row below.
        </p>

        <RadioGroup.Root
          className="cb-example__sizes"
          value={size}
          onValueChange={setSize}
          aria-label="Checkbox size"
        >
          {SIZES.map((slot) => (
            <RadioGroup.Item
              key={slot}
              className="cb-example__size-option"
              value={slot}
            >
              <span className="cb-example__size-ring">
                <RadioGroup.Indicator
                  className="cb-example__size-dot"
                  forceMount
                />
              </span>
              {slot}
            </RadioGroup.Item>
          ))}
        </RadioGroup.Root>

        {DENSITIES.map((density) => (
          <div key={density} data-density={density} className="cb-example__density">
            <span className="cb-example__density-label">{density}</span>
            <div className="cb-example__contract-row">
              <Checkbox.Root
                className={`primitiv-checkbox primitiv-checkbox--${size}`}
                aria-label={`Checkbox off — ${density} ${size}`}
              >
                <Checkbox.Indicator className="primitiv-checkbox__indicator" />
              </Checkbox.Root>
              <Checkbox.Root
                className={`primitiv-checkbox primitiv-checkbox--${size}`}
                aria-label={`Checkbox on — ${density} ${size}`}
                defaultChecked
              >
                <Checkbox.Indicator className="primitiv-checkbox__indicator" />
              </Checkbox.Root>
              <Checkbox.Root
                className={`primitiv-checkbox primitiv-checkbox--${size}`}
                aria-label={`Checkbox mixed — ${density} ${size}`}
                defaultChecked="indeterminate"
              >
                <Checkbox.Indicator className="primitiv-checkbox__indicator" />
              </Checkbox.Root>
            </div>
          </div>
        ))}
      </section>

      <section className="cb-example__section">
        <h3 className="cb-example__section-title">Uncontrolled</h3>
        <div className="cb-example__field">
          <Checkbox.Root
            id="cb-accept-terms"
            className="cb-example__box"
            name="terms"
            value="accepted"
            defaultChecked
          >
            <Checkbox.Indicator className="cb-example__indicator">
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
            <Checkbox.Indicator className="cb-example__indicator">
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
                <Checkbox.Indicator className="cb-example__indicator">
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
            <Checkbox.Indicator className="cb-example__indicator">
              <Check className="cb-example__indicator-icon" />
            </Checkbox.Indicator>
          </Checkbox.Root>
          <label htmlFor="cb-locked-setting">Locked setting</label>
        </div>
      </section>
    </div>
  );
}
