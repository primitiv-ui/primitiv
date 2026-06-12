import { useState, type CSSProperties } from "react";

import { Check } from "@primitiv-ui/icons";
import { RadioGroup, Switch } from "@primitiv-ui/react";

import "./SwitchExample.css";
// The canonical per-component default theme straight from the registry — the
// same bytes `primitiv add switch` copies into a consumer repo (the state-driven,
// no-modifier counterpart to Button; RFC 0006 §7). It styles the
// `.primitiv-switch` / `.primitiv-switch__thumb` contract classes applied below,
// resolving against the app-level Primitiv token layer (imported in main.tsx).
import "../../../../../registry/r/switch/styles.css";

const DENSITIES = ["dense", "compact", "comfortable", "spacious"] as const;
const SIZES = ["xs", "sm", "md", "lg", "xl"] as const;

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
  const [size, setSize] = useState("md");

  // Switch has no size *modifier* — it re-sizes by re-pointing its
  // `--primitiv-switch-*` anatomy knobs at the chosen size slot (the same knob
  // seam a consumer overrides). The slot is still density-scoped, so this
  // composes with the `[data-density]` rows below.
  const sizeVars = {
    "--primitiv-switch-track-width": `var(--primitiv-switch-${size}-track-width)`,
    "--primitiv-switch-track-height": `var(--primitiv-switch-${size}-track-height)`,
    "--primitiv-switch-thumb-size": `var(--primitiv-switch-${size}-thumb-size)`,
    "--primitiv-switch-thumb-margin": `var(--primitiv-switch-${size}-thumb-margin)`,
  } as CSSProperties;

  return (
    <div className="sw-example">
      <h2 className="sw-example__title">Switch</h2>

      <section className="sw-example__section">
        <h3 className="sw-example__section-title">
          Default theme — styling contract
        </h3>
        <p className="sw-example__description">
          The headless <code>Switch</code> with the registry{" "}
          <code>.primitiv-switch</code> / <code>.primitiv-switch__thumb</code>{" "}
          classes applied. Switch is the state-driven proof — no visual
          modifiers; the track colour swaps and the thumb slides off{" "}
          <code>data-state</code> alone, and <code>data-disabled</code> styles
          itself.
        </p>

        <div className="sw-example__contract-row">
          {[
            { caption: "off", props: {} },
            { caption: "on", props: { defaultChecked: true } },
            { caption: "disabled off", props: { disabled: true } },
            {
              caption: "disabled on",
              props: { defaultChecked: true, disabled: true },
            },
          ].map(({ caption, props }) => (
            <div key={caption} className="sw-example__labeled">
              <Switch.Root
                className="primitiv-switch"
                aria-label={`Switch — ${caption}`}
                {...props}
              >
                <Switch.Thumb className="primitiv-switch__thumb" />
              </Switch.Root>
              <small className="sw-example__caption">{caption}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="sw-example__section">
        <h3 className="sw-example__section-title">Density</h3>
        <p className="sw-example__description">
          The same contract-styled switch under each <code>data-density</code>{" "}
          scope. Density is ambient — set on any ancestor — and the{" "}
          <code>switch/*</code> anatomy tokens resolve to the matching scale (RFC
          0009). Pick a size to re-point the anatomy knobs and rescale them all.
        </p>

        <RadioGroup.Root
          className="sw-example__sizes"
          value={size}
          onValueChange={setSize}
          aria-label="Switch size"
        >
          {SIZES.map((slot) => (
            <RadioGroup.Item
              key={slot}
              className="sw-example__size-option"
              value={slot}
            >
              <span className="sw-example__size-ring">
                <RadioGroup.Indicator
                  className="sw-example__size-dot"
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
            className="sw-example__density"
          >
            <span className="sw-example__density-label">{density}</span>
            <div className="sw-example__contract-row">
              <Switch.Root
                className="primitiv-switch"
                style={sizeVars}
                aria-label={`Switch off — ${density} ${size}`}
              >
                <Switch.Thumb className="primitiv-switch__thumb" />
              </Switch.Root>
              <Switch.Root
                className="primitiv-switch"
                style={sizeVars}
                aria-label={`Switch on — ${density} ${size}`}
                defaultChecked
              >
                <Switch.Thumb className="primitiv-switch__thumb" />
              </Switch.Root>
            </div>
          </div>
        ))}
      </section>

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
