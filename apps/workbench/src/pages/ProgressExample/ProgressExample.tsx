import { useState } from "react";

import { Progress } from "@primitiv-ui/react";

import "./ProgressExample.css";

const clamp = (n: number) => Math.max(0, Math.min(100, n));

export function ProgressExample() {
  const [value, setValue] = useState(40);

  return (
    <div className="prog-example">
      <h2 className="prog-example__title">Progress</h2>

      <section className="prog-example__section">
        <h3 className="prog-example__section-title">Determinate</h3>
        <p className="prog-example__description">
          Reflects a consumer-supplied value. State is currently{" "}
          <strong>{value === 100 ? "complete" : "loading"}</strong>.
        </p>
        <Progress.Root
          className="prog-bar"
          value={value}
          aria-label="Upload progress"
        >
          <Progress.Indicator
            className="prog-bar__fill"
            style={{ inlineSize: `${value}%` }}
          />
        </Progress.Root>
        <div className="prog-example__controls">
          <button
            type="button"
            className="prog-btn"
            onClick={() => setValue((v) => clamp(v - 20))}
          >
            −20
          </button>
          <button
            type="button"
            className="prog-btn"
            onClick={() => setValue((v) => clamp(v + 20))}
          >
            +20
          </button>
          <button
            type="button"
            className="prog-btn"
            onClick={() => setValue(0)}
          >
            Reset
          </button>
        </div>
      </section>

      <section className="prog-example__section">
        <h3 className="prog-example__section-title">Indeterminate</h3>
        <p className="prog-example__description">
          No <code>value</code> — the completion ratio is unknown.
        </p>
        <Progress.Root className="prog-bar" aria-label="Loading">
          <Progress.Indicator className="prog-bar__fill prog-bar__fill--indeterminate" />
        </Progress.Root>
      </section>

      <section className="prog-example__section">
        <h3 className="prog-example__section-title">Custom label &amp; max</h3>
        <p className="prog-example__description">
          A non-percentage <code>aria-valuetext</code> via{" "}
          <code>getValueLabel</code>, with <code>max={"{8}"}</code>.
        </p>
        <Progress.Root
          className="prog-bar"
          value={3}
          max={8}
          getValueLabel={(v, m) => `${v} of ${m} files uploaded`}
          aria-label="File upload"
        >
          <Progress.Indicator
            className="prog-bar__fill"
            style={{ inlineSize: `${(3 / 8) * 100}%` }}
          />
        </Progress.Root>
      </section>
    </div>
  );
}
