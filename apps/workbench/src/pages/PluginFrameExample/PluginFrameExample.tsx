// A living mock of the Harmoni Figma plugin window — a fixed-size frame (the real
// plugin size, set in apps/harmoni-figma-plugin/src/code/code.ts) that hosts a
// faithful, working replica of the plugin's ColorEngine, developed here in the
// workbench where iterating the UI in a real browser is easier (RFC 0010 §9).
// The brand colour uses the OKLCH picker's compact row layout and white/black are
// painted lightness-only anchors. The frame width and chart aspect are adjustable
// to dial the layout in. This is a design sandbox, not a gated component.

import { useState } from "react";

import { PluginColorEngine } from "./PluginColorEngine";

import "./PluginFrameExample.css";

const FRAME_WIDTHS = [600, 640, 720, 800] as const;
const FRAME_HEIGHT = 800;

export function PluginFrameExample() {
  const [frameWidth, setFrameWidth] = useState<number>(720);
  const [chartAspect, setChartAspect] = useState<number>(1.5);

  return (
    <div className="pf-page">
      <header className="pf-page__head">
        <h1>Plugin frame sandbox</h1>
        <p>
          A working replica of the Harmoni plugin&rsquo;s Color Engine at the real
          plugin window size, for iterating the plugin UI in the browser. Brand
          uses the OKLCH picker&rsquo;s compact <code>layout=&quot;row&quot;</code>;
          white and black are painted lightness-only anchors.
        </p>
        <div className="pf-controls">
          <div className="pf-width-control" role="group" aria-label="Frame width">
            {FRAME_WIDTHS.map((w) => (
              <button
                key={w}
                type="button"
                className={
                  w === frameWidth
                    ? "pf-width-control__btn pf-width-control__btn--active"
                    : "pf-width-control__btn"
                }
                aria-pressed={w === frameWidth}
                onClick={() => setFrameWidth(w)}
              >
                {w}px
              </button>
            ))}
          </div>
          <label className="pf-aspect-control">
            Chart aspect {chartAspect.toFixed(2)}
            <input
              type="range"
              min={0.5}
              max={2.5}
              step={0.05}
              value={chartAspect}
              onChange={(e) => setChartAspect(e.target.valueAsNumber)}
            />
          </label>
        </div>
      </header>

      <div
        className="pf-frame"
        style={{ width: frameWidth, height: FRAME_HEIGHT }}
      >
        <div className="pf-frame__body">
          <PluginColorEngine chartAspect={chartAspect} />
        </div>
      </div>
    </div>
  );
}
