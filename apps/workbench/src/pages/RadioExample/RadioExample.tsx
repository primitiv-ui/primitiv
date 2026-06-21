import { useState } from "react";

import { Radio, RadioGroup } from "@primitiv-ui/react";

import "./RadioExample.css";
// The canonical per-component default theme straight from the registry — the
// same bytes `primitiv add radio` copies into a consumer repo. It styles the
// `.primitiv-radio` / `.primitiv-radio__indicator` contract classes applied
// below, resolving against the app-level Primitiv token layer (main.tsx).
import "../../../../../registry/components/radio/styles.css";

const SIZES = ["xs", "sm", "md", "lg", "xl"] as const;
const DENSITIES = ["dense", "compact", "comfortable", "spacious"] as const;

const PLAN_OPTIONS = [
  ["free", "Free"],
  ["pro", "Pro"],
  ["team", "Team"],
] as const;

type Plan = (typeof PLAN_OPTIONS)[number][0];

export function RadioExample() {
  const [plan, setPlan] = useState<Plan>("pro");
  const [optedIn, setOptedIn] = useState(false);
  const [size, setSize] = useState("md");

  return (
    <div className="radio-ex">
      <h2 className="radio-ex__title">Radio</h2>

      <section className="radio-ex__section">
        <h3 className="radio-ex__section-title">
          Default theme — styling contract
        </h3>
        <p className="radio-ex__description">
          The headless <code>Radio</code> — a real hidden{" "}
          <code>&lt;input type="radio"&gt;</code> in a{" "}
          <code>.primitiv-radio</code> box — with the registry classes applied.
          The dot and ring show off the input's native <code>:checked</code>;{" "}
          <code>data-disabled</code> styles itself.
        </p>

        <div className="radio-ex__contract-row">
          {[
            { caption: "off", props: {} },
            { caption: "on", props: { defaultChecked: true } },
            { caption: "disabled off", props: { disabled: true } },
            {
              caption: "disabled on",
              props: { defaultChecked: true, disabled: true },
            },
          ].map(({ caption, props }) => (
            <div key={caption} className="radio-ex__labeled">
              <Radio.Root
                className="primitiv-radio"
                aria-label={`Radio — ${caption}`}
                {...props}
              >
                <Radio.Indicator className="primitiv-radio__indicator" />
              </Radio.Root>
              <small className="radio-ex__caption">{caption}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="radio-ex__section">
        <h3 className="radio-ex__section-title">Size & density</h3>
        <p className="radio-ex__description">
          The <code>size</code> modifier re-points the box-size token (the radius
          stays a full circle, the dot half the box), and density is ambient via{" "}
          <code>data-density</code> — so the box, ring and dot scale together
          (RFC 0009). Pick a size to apply the <code>--{size}</code> modifier to
          every row below.
        </p>

        <RadioGroup.Root
          className="radio-ex__sizes"
          value={size}
          onValueChange={setSize}
          aria-label="Radio size"
        >
          {SIZES.map((slot) => (
            <RadioGroup.Item
              key={slot}
              className="radio-ex__size-option"
              value={slot}
            >
              <span className="radio-ex__size-ring">
                <RadioGroup.Indicator
                  className="radio-ex__size-dot"
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
            className="radio-ex__density"
          >
            <span className="radio-ex__density-label">{density}</span>
            <div className="radio-ex__contract-row">
              <Radio.Root
                className={`primitiv-radio primitiv-radio--${size}`}
                aria-label={`Radio off — ${density} ${size}`}
              >
                <Radio.Indicator className="primitiv-radio__indicator" />
              </Radio.Root>
              <Radio.Root
                className={`primitiv-radio primitiv-radio--${size}`}
                aria-label={`Radio on — ${density} ${size}`}
                defaultChecked
              >
                <Radio.Indicator className="primitiv-radio__indicator" />
              </Radio.Root>
            </div>
          </div>
        ))}
      </section>

      <section className="radio-ex__section">
        <h3 className="radio-ex__section-title">Native group (shared name)</h3>
        <p className="radio-ex__description">
          Three uncontrolled radios sharing one <code>name</code> — the browser
          forms a native radio group and enforces single-selection. No shared
          React state; selecting one deselects the others for free.
        </p>

        <ul className="radio-ex__options" role="presentation">
          {PLAN_OPTIONS.map(([key, label]) => (
            <li key={key} className="radio-ex__field">
              <Radio.Root
                id={`radio-native-${key}`}
                className="radio-ex__control"
                name="plan-native"
                value={key}
                defaultChecked={key === "pro"}
              >
                <Radio.Indicator className="radio-ex__dot" />
              </Radio.Root>
              <label htmlFor={`radio-native-${key}`}>{label}</label>
            </li>
          ))}
        </ul>
      </section>

      <section className="radio-ex__section">
        <h3 className="radio-ex__section-title">Controlled group</h3>
        <p className="radio-ex__description">
          The same control, but the parent owns the value via{" "}
          <code>checked</code> / <code>onCheckedChange</code>; selected is{" "}
          <span className="radio-ex__value">{plan}</span>.
        </p>

        <ul className="radio-ex__options" role="presentation">
          {PLAN_OPTIONS.map(([key, label]) => (
            <li key={key} className="radio-ex__field">
              <Radio.Root
                id={`radio-plan-${key}`}
                className="radio-ex__control"
                name="plan-controlled"
                value={key}
                checked={plan === key}
                onCheckedChange={() => setPlan(key)}
              >
                <Radio.Indicator className="radio-ex__dot" />
              </Radio.Root>
              <label htmlFor={`radio-plan-${key}`}>{label}</label>
            </li>
          ))}
        </ul>
      </section>

      <section className="radio-ex__section">
        <h3 className="radio-ex__section-title">Uncontrolled single opt-in</h3>
        <p className="radio-ex__description">
          A lone radio — it owns its own state and only ever moves into the
          selected position.
        </p>
        <div className="radio-ex__field">
          <Radio.Root
            id="radio-opt-in"
            className="radio-ex__control"
            name="opt-in"
            value="yes"
            onCheckedChange={() => setOptedIn(true)}
          >
            <Radio.Indicator className="radio-ex__dot" />
          </Radio.Root>
          <label htmlFor="radio-opt-in">
            Opt in{optedIn ? " — thanks!" : ""}
          </label>
        </div>
      </section>

      <section className="radio-ex__section">
        <h3 className="radio-ex__section-title">Disabled</h3>
        <div className="radio-ex__field">
          <Radio.Root
            id="radio-disabled"
            className="radio-ex__control"
            name="disabled-demo"
            value="x"
            defaultChecked
            disabled
          >
            <Radio.Indicator className="radio-ex__dot" />
          </Radio.Root>
          <label htmlFor="radio-disabled">Unavailable plan</label>
        </div>
      </section>
    </div>
  );
}
