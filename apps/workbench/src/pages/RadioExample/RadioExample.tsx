import { useState } from "react";

import { Radio } from "@primitiv-ui/react";

import "./RadioExample.css";

const DENSITY_OPTIONS = [
  ["compact", "Compact"],
  ["comfortable", "Comfortable"],
  ["spacious", "Spacious"],
] as const;

type Density = (typeof DENSITY_OPTIONS)[number][0];

export function RadioExample() {
  const [density, setDensity] = useState<Density>("comfortable");
  const [optedIn, setOptedIn] = useState(false);

  return (
    <div className="radio-ex">
      <h2 className="radio-ex__title">Radio</h2>

      <section className="radio-ex__section">
        <h3 className="radio-ex__section-title">Consumer-owned group</h3>
        <p className="radio-ex__description">
          Standalone <code>Radio.Root</code> controls sharing one piece of
          state — the consumer owns the grouping. Selection is one-way: clicking
          the selected radio does nothing; selected is{" "}
          <span className="radio-ex__value">{density}</span>.
        </p>

        <ul className="radio-ex__options" role="presentation">
          {DENSITY_OPTIONS.map(([key, label]) => (
            <li key={key} className="radio-ex__field">
              <Radio.Root
                id={`radio-density-${key}`}
                className="radio-ex__control"
                checked={density === key}
                onCheckedChange={() => setDensity(key)}
              >
                <Radio.Indicator>
                  <span className="radio-ex__dot" />
                </Radio.Indicator>
              </Radio.Root>
              <label htmlFor={`radio-density-${key}`}>{label}</label>
            </li>
          ))}
        </ul>
      </section>

      <section className="radio-ex__section">
        <h3 className="radio-ex__section-title">Uncontrolled single opt-in</h3>
        <p className="radio-ex__description">
          A lone radio with <code>defaultChecked</code> omitted — it owns its own
          state and only ever moves into the selected position.
        </p>
        <div className="radio-ex__field">
          <Radio.Root
            id="radio-opt-in"
            className="radio-ex__control"
            onCheckedChange={() => setOptedIn(true)}
          >
            <Radio.Indicator>
              <span className="radio-ex__dot" />
            </Radio.Indicator>
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
            defaultChecked
            disabled
          >
            <Radio.Indicator>
              <span className="radio-ex__dot" />
            </Radio.Indicator>
          </Radio.Root>
          <label htmlFor="radio-disabled">Unavailable plan</label>
        </div>
      </section>
    </div>
  );
}
