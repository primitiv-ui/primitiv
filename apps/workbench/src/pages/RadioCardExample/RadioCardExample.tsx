import { useState } from "react";

import { RadioCard } from "@primitiv/react";

import "./RadioCardExample.scss";

export function RadioCardExample() {
  const [plan, setPlan] = useState("pro");

  return (
    <div className="rc-example">
      <h2 className="rc-example__title">RadioCard</h2>

      <section className="rc-example__section">
        <h3 className="rc-example__section-title">Uncontrolled</h3>
        <p className="rc-example__description">
          Click a card or use arrow keys to select. State is owned by the
          component.
        </p>
        <RadioCard.Root
          className="rc-example__group"
          defaultValue="pro"
          aria-label="Pricing plan"
        >
          <RadioCard.Item value="starter" className="rc-card">
            <span className="rc-card__indicator-wrap">
              <RadioCard.Indicator className="rc-card__indicator" />
            </span>
            <span className="rc-card__label">Starter</span>
            <span className="rc-card__price">Free</span>
          </RadioCard.Item>
          <RadioCard.Item value="pro" className="rc-card">
            <span className="rc-card__indicator-wrap">
              <RadioCard.Indicator className="rc-card__indicator" />
            </span>
            <span className="rc-card__label">Pro</span>
            <span className="rc-card__price">$9 / mo</span>
          </RadioCard.Item>
          <RadioCard.Item value="enterprise" className="rc-card">
            <span className="rc-card__indicator-wrap">
              <RadioCard.Indicator className="rc-card__indicator" />
            </span>
            <span className="rc-card__label">Enterprise</span>
            <span className="rc-card__price">$49 / mo</span>
          </RadioCard.Item>
        </RadioCard.Root>
      </section>

      <section className="rc-example__section">
        <h3 className="rc-example__section-title">Controlled</h3>
        <p className="rc-example__description">
          State is owned by the parent.{" "}
          <span className="rc-example__value">
            Selected: <strong>{plan}</strong>
          </span>
        </p>
        <RadioCard.Root
          className="rc-example__group"
          value={plan}
          onValueChange={setPlan}
          aria-label="Pricing plan (controlled)"
        >
          <RadioCard.Item value="starter" className="rc-card">
            <span className="rc-card__indicator-wrap">
              <RadioCard.Indicator className="rc-card__indicator" />
            </span>
            <span className="rc-card__label">Starter</span>
          </RadioCard.Item>
          <RadioCard.Item value="pro" className="rc-card">
            <span className="rc-card__indicator-wrap">
              <RadioCard.Indicator className="rc-card__indicator" />
            </span>
            <span className="rc-card__label">Pro</span>
          </RadioCard.Item>
          <RadioCard.Item value="enterprise" className="rc-card">
            <span className="rc-card__indicator-wrap">
              <RadioCard.Indicator className="rc-card__indicator" />
            </span>
            <span className="rc-card__label">Enterprise</span>
          </RadioCard.Item>
        </RadioCard.Root>
      </section>

      <section className="rc-example__section">
        <h3 className="rc-example__section-title">Disabled items</h3>
        <p className="rc-example__description">
          The Enterprise card is disabled — it is skipped in keyboard
          navigation.
        </p>
        <RadioCard.Root
          className="rc-example__group"
          defaultValue="starter"
          aria-label="Pricing plan (with disabled)"
        >
          <RadioCard.Item value="starter" className="rc-card">
            <span className="rc-card__indicator-wrap">
              <RadioCard.Indicator className="rc-card__indicator" />
            </span>
            <span className="rc-card__label">Starter</span>
          </RadioCard.Item>
          <RadioCard.Item value="pro" className="rc-card">
            <span className="rc-card__indicator-wrap">
              <RadioCard.Indicator className="rc-card__indicator" />
            </span>
            <span className="rc-card__label">Pro</span>
          </RadioCard.Item>
          <RadioCard.Item value="enterprise" className="rc-card" disabled>
            <span className="rc-card__indicator-wrap">
              <RadioCard.Indicator className="rc-card__indicator" />
            </span>
            <span className="rc-card__label">Enterprise</span>
            <span className="rc-card__badge">Unavailable</span>
          </RadioCard.Item>
        </RadioCard.Root>
      </section>
    </div>
  );
}
