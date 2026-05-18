import { useState } from "react";

import { Check } from "@primitiv/icons";
import { Switch } from "@primitiv/react";

import "./SwitchExample.scss";

const FEATURES = [
  { key: "analytics", label: "Analytics", description: "Track usage metrics" },
  {
    key: "notifications",
    label: "Notifications",
    description: "Receive email alerts",
  },
  { key: "backups", label: "Backups", description: "Auto-save snapshots" },
] as const;

type FeatureKey = (typeof FEATURES)[number]["key"];

export function SwitchExample() {
  const [darkMode, setDarkMode] = useState(false);
  const [features, setFeatures] = useState<Record<FeatureKey, boolean>>({
    analytics: true,
    notifications: false,
    backups: true,
  });

  return (
    <div className="sw-example">
      <h2 className="sw-example__title">Switch</h2>

      <section className="sw-example__section">
        <h3 className="sw-example__section-title">Uncontrolled</h3>
        <p className="sw-example__description">
          State is owned by each switch. Toggle freely.
        </p>
        <div className="sw-example__list">
          <label className="sw-row">
            <span className="sw-row__text">
              <span className="sw-row__label">Dark mode</span>
              <span className="sw-row__description">
                Switch the interface to a dark colour scheme
              </span>
            </span>
            <Switch.Root className="sw-track" aria-label="Enable dark mode">
              <Switch.Thumb className="sw-thumb">
                <Check size={10} className="sw-thumb__icon" />
              </Switch.Thumb>
            </Switch.Root>
          </label>

          <label className="sw-row">
            <span className="sw-row__text">
              <span className="sw-row__label">Compact layout</span>
              <span className="sw-row__description">
                Reduce spacing for a denser view
              </span>
            </span>
            <Switch.Root
              className="sw-track"
              aria-label="Enable compact layout"
              defaultChecked
            >
              <Switch.Thumb className="sw-thumb">
                <Check size={10} className="sw-thumb__icon" />
              </Switch.Thumb>
            </Switch.Root>
          </label>
        </div>
      </section>

      <section className="sw-example__section">
        <h3 className="sw-example__section-title">Controlled</h3>
        <p className="sw-example__description">
          State is owned by the parent.{" "}
          <span className="sw-example__value">
            Dark mode is <strong>{darkMode ? "on" : "off"}</strong>.
          </span>
        </p>
        <label className="sw-row">
          <span className="sw-row__text">
            <span className="sw-row__label">Dark mode</span>
            <span className="sw-row__description">
              Switch the interface to a dark colour scheme
            </span>
          </span>
          <Switch.Root
            className="sw-track"
            aria-label="Enable dark mode (controlled)"
            checked={darkMode}
            onCheckedChange={setDarkMode}
          >
            <Switch.Thumb className="sw-thumb">
              <Check size={10} className="sw-thumb__icon" />
            </Switch.Thumb>
          </Switch.Root>
        </label>
      </section>

      <section className="sw-example__section">
        <h3 className="sw-example__section-title">Feature settings</h3>
        <p className="sw-example__description">
          Controlled list — each switch managed individually.
        </p>
        <div className="sw-example__list">
          {FEATURES.map(({ key, label, description }) => (
            <label key={key} className="sw-row">
              <span className="sw-row__text">
                <span className="sw-row__label">{label}</span>
                <span className="sw-row__description">{description}</span>
              </span>
              <Switch.Root
                className="sw-track"
                aria-label={`Enable ${label.toLowerCase()}`}
                checked={features[key]}
                onCheckedChange={(checked) =>
                  setFeatures((prev) => ({ ...prev, [key]: checked }))
                }
              >
                <Switch.Thumb className="sw-thumb">
                  <Check size={10} className="sw-thumb__icon" />
                </Switch.Thumb>
              </Switch.Root>
            </label>
          ))}
        </div>
      </section>

      <section className="sw-example__section">
        <h3 className="sw-example__section-title">Disabled</h3>
        <div className="sw-example__list">
          <label className="sw-row">
            <span className="sw-row__text">
              <span className="sw-row__label">Locked feature (off)</span>
              <span className="sw-row__description">
                Not available on your plan
              </span>
            </span>
            <Switch.Root
              className="sw-track"
              aria-label="Locked feature (off, disabled)"
              disabled
            >
              <Switch.Thumb className="sw-thumb">
                <Check size={10} className="sw-thumb__icon" />
              </Switch.Thumb>
            </Switch.Root>
          </label>

          <label className="sw-row">
            <span className="sw-row__text">
              <span className="sw-row__label">Required feature (on)</span>
              <span className="sw-row__description">Always enabled</span>
            </span>
            <Switch.Root
              className="sw-track"
              aria-label="Required feature (on, disabled)"
              defaultChecked
              disabled
            >
              <Switch.Thumb className="sw-thumb">
                <Check size={10} className="sw-thumb__icon" />
              </Switch.Thumb>
            </Switch.Root>
          </label>
        </div>
      </section>
    </div>
  );
}
