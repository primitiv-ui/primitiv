import { useState } from "react";

import { RadioGroup } from "@primitiv/react";

import "./RadioGroupExample.scss";

const densities = ["compact", "comfortable", "spacious"];

export function RadioGroupExample() {
  const [value, setValue] = useState("comfortable");

  return (
    <div className="rg-example">
      <h2 className="rg-example__title">Radio Group</h2>

      <section className="rg-example__section">
        <h3 className="rg-example__section-title">Uncontrolled</h3>
        <RadioGroup.Root
          className="rg-example__group"
          defaultValue="comfortable"
          aria-label="Density"
        >
          {densities.map((density) => (
            <RadioGroup.Item
              key={density}
              className="rg-example__radio"
              value={density}
            >
              <span className="rg-example__ring">
                <RadioGroup.Indicator
                  className="rg-example__dot"
                  forceMount
                />
              </span>
              {density}
            </RadioGroup.Item>
          ))}
        </RadioGroup.Root>
      </section>

      <section className="rg-example__section">
        <h3 className="rg-example__section-title">Controlled</h3>
        <p className="rg-example__description">
          Selected: <span className="rg-example__value">{value}</span>
        </p>
        <RadioGroup.Root
          className="rg-example__group"
          value={value}
          onValueChange={setValue}
          aria-label="Density (controlled)"
        >
          {densities.map((density) => (
            <RadioGroup.Item
              key={density}
              className="rg-example__radio"
              value={density}
            >
              <span className="rg-example__ring">
                <RadioGroup.Indicator
                  className="rg-example__dot"
                  forceMount
                />
              </span>
              {density}
            </RadioGroup.Item>
          ))}
        </RadioGroup.Root>
      </section>

      <section className="rg-example__section">
        <h3 className="rg-example__section-title">Disabled item</h3>
        <p className="rg-example__description">
          Arrow keys skip the disabled radio.
        </p>
        <RadioGroup.Root className="rg-example__group" aria-label="Plan">
          <RadioGroup.Item className="rg-example__radio" value="free">
            <span className="rg-example__ring">
              <RadioGroup.Indicator className="rg-example__dot" forceMount />
            </span>
            Free
          </RadioGroup.Item>
          <RadioGroup.Item className="rg-example__radio" value="pro">
            <span className="rg-example__ring">
              <RadioGroup.Indicator className="rg-example__dot" forceMount />
            </span>
            Pro
          </RadioGroup.Item>
          <RadioGroup.Item
            className="rg-example__radio"
            value="enterprise"
            disabled
          >
            <span className="rg-example__ring">
              <RadioGroup.Indicator className="rg-example__dot" forceMount />
            </span>
            Enterprise (contact sales)
          </RadioGroup.Item>
        </RadioGroup.Root>
      </section>
    </div>
  );
}
