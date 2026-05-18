import { useState } from "react";

import { Check, Minus } from "@primitiv/icons";
import { CheckboxCard, CheckedState } from "@primitiv/react";

import "./CheckboxCardExample.scss";

type Features = {
  analytics: boolean;
  notifications: boolean;
  backups: boolean;
};

export function CheckboxCardExample() {
  const [darkMode, setDarkMode] = useState<CheckedState>(false);

  const [features, setFeatures] = useState<Features>({
    analytics: true,
    notifications: false,
    backups: false,
  });

  const checkedCount = Object.values(features).filter(Boolean).length;
  const totalCount = Object.keys(features).length;
  const allState: CheckedState =
    checkedCount === 0
      ? false
      : checkedCount === totalCount
        ? true
        : "indeterminate";

  function handleAllChange(checked: boolean) {
    setFeatures({ analytics: checked, notifications: checked, backups: checked });
  }

  function toggleFeature(key: keyof Features) {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="cc-example">
      <h2 className="cc-example__title">CheckboxCard</h2>

      <section className="cc-example__section">
        <h3 className="cc-example__section-title">Uncontrolled</h3>
        <p className="cc-example__description">
          Click a card to toggle. State is owned by each component.
        </p>
        <div className="cc-example__row">
          <CheckboxCard.Root
            className="cc-card"
            aria-label="Enable analytics"
            defaultChecked
          >
            <span className="cc-card__header">
              <span className="cc-card__label">Analytics</span>
              <CheckboxCard.Indicator className="cc-card__indicator">
                <Check size={14} />
              </CheckboxCard.Indicator>
            </span>
            <span className="cc-card__description">Track usage metrics</span>
          </CheckboxCard.Root>

          <CheckboxCard.Root
            className="cc-card"
            aria-label="Enable notifications"
          >
            <span className="cc-card__header">
              <span className="cc-card__label">Notifications</span>
              <CheckboxCard.Indicator className="cc-card__indicator">
                <Check size={14} />
              </CheckboxCard.Indicator>
            </span>
            <span className="cc-card__description">Receive email alerts</span>
          </CheckboxCard.Root>

          <CheckboxCard.Root className="cc-card" aria-label="Enable backups">
            <span className="cc-card__header">
              <span className="cc-card__label">Backups</span>
              <CheckboxCard.Indicator className="cc-card__indicator">
                <Check size={14} />
              </CheckboxCard.Indicator>
            </span>
            <span className="cc-card__description">Auto-save snapshots</span>
          </CheckboxCard.Root>
        </div>
      </section>

      <section className="cc-example__section">
        <h3 className="cc-example__section-title">Controlled</h3>
        <p className="cc-example__description">
          State is owned by the parent.{" "}
          <span className="cc-example__value">
            Dark mode is <strong>{darkMode === true ? "on" : "off"}</strong>.
          </span>
        </p>
        <CheckboxCard.Root
          className="cc-card"
          aria-label="Enable dark mode"
          checked={darkMode}
          onCheckedChange={setDarkMode}
        >
          <span className="cc-card__header">
            <span className="cc-card__label">Dark mode</span>
            <CheckboxCard.Indicator className="cc-card__indicator">
              <Check size={14} />
            </CheckboxCard.Indicator>
          </span>
          <span className="cc-card__description">
            Switch to a dark colour scheme
          </span>
        </CheckboxCard.Root>
      </section>

      <section className="cc-example__section">
        <h3 className="cc-example__section-title">
          Indeterminate — select all pattern
        </h3>
        <p className="cc-example__description">
          The parent card reflects the collective state of the three children.
          When only some are selected it shows{" "}
          <strong>indeterminate</strong> (—). Clicking the parent from any
          partial state checks all; clicking when all are checked unchecks all.
        </p>
        <div className="cc-example__select-all">
          <CheckboxCard.Root
            className="cc-card cc-card--parent"
            aria-label="All features"
            checked={allState}
            onCheckedChange={handleAllChange}
          >
            <span className="cc-card__header">
              <span className="cc-card__label">All features</span>
              <CheckboxCard.Indicator className="cc-card__indicator cc-card__indicator--mixed">
                <Check size={14} className="cc-card__check-icon" />
                <Minus size={14} className="cc-card__minus-icon" />
              </CheckboxCard.Indicator>
            </span>
            <span className="cc-card__description">
              {checkedCount} of {totalCount} selected
            </span>
          </CheckboxCard.Root>

          <div className="cc-example__row">
            {(
              [
                ["analytics", "Track usage metrics"],
                ["notifications", "Receive email alerts"],
                ["backups", "Auto-save snapshots"],
              ] as const
            ).map(([key, description]) => (
              <CheckboxCard.Root
                key={key}
                className="cc-card"
                aria-label={`Enable ${key}`}
                checked={features[key]}
                onCheckedChange={() => toggleFeature(key)}
              >
                <span className="cc-card__header">
                  <span className="cc-card__label">
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </span>
                  <CheckboxCard.Indicator className="cc-card__indicator">
                    <Check size={14} />
                  </CheckboxCard.Indicator>
                </span>
                <span className="cc-card__description">{description}</span>
              </CheckboxCard.Root>
            ))}
          </div>
        </div>
      </section>

      <section className="cc-example__section">
        <h3 className="cc-example__section-title">Disabled</h3>
        <div className="cc-example__row">
          <CheckboxCard.Root
            className="cc-card"
            aria-label="Enable locked feature"
            disabled
          >
            <span className="cc-card__header">
              <span className="cc-card__label">Locked feature</span>
              <CheckboxCard.Indicator className="cc-card__indicator">
                <Check size={14} />
              </CheckboxCard.Indicator>
            </span>
            <span className="cc-card__description">
              Not available on your plan
            </span>
          </CheckboxCard.Root>

          <CheckboxCard.Root
            className="cc-card"
            aria-label="Enable required feature"
            defaultChecked
            disabled
          >
            <span className="cc-card__header">
              <span className="cc-card__label">Required feature</span>
              <CheckboxCard.Indicator className="cc-card__indicator">
                <Check size={14} />
              </CheckboxCard.Indicator>
            </span>
            <span className="cc-card__description">Always enabled</span>
          </CheckboxCard.Root>
        </div>
      </section>
    </div>
  );
}
