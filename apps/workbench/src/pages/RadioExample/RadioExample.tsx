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
        <h3 className="radio-ex__section-title">Native group (shared name)</h3>
        <p className="radio-ex__description">
          Three uncontrolled radios sharing one <code>name</code> — the browser
          forms a native radio group and enforces single-selection. No shared
          React state; selecting one deselects the others for free.
        </p>

        <ul className="radio-ex__options" role="presentation">
          {DENSITY_OPTIONS.map(([key, label]) => (
            <li key={key} className="radio-ex__field">
              <Radio.Root
                id={`radio-native-${key}`}
                className="radio-ex__control"
                name="density-native"
                value={key}
                defaultChecked={key === "comfortable"}
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
          <span className="radio-ex__value">{density}</span>.
        </p>

        <ul className="radio-ex__options" role="presentation">
          {DENSITY_OPTIONS.map(([key, label]) => (
            <li key={key} className="radio-ex__field">
              <Radio.Root
                id={`radio-density-${key}`}
                className="radio-ex__control"
                name="density-controlled"
                value={key}
                checked={density === key}
                onCheckedChange={() => setDensity(key)}
              >
                <Radio.Indicator className="radio-ex__dot" />
              </Radio.Root>
              <label htmlFor={`radio-density-${key}`}>{label}</label>
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
