// A living mock of the Harmoni Figma plugin window — a fixed-size frame (the real
// plugin size, set in apps/harmoni-figma-plugin/src/code/code.ts) that hosts a
// faithful, working replica of the plugin's ColorEngine, developed here in the
// workbench where iterating the UI in a real browser is easier (RFC 0010 §9).
// The brand colour uses the OKLCH picker's compact row layout and white/black are
// painted lightness-only anchors. The frame width and chart aspect are adjustable
// to dial the layout in. This is a design sandbox, not a gated component.

import { useState } from "react";

import { Button, Slider } from "@primitiv-ui/react";

import { PluginColorEngine } from "./PluginColorEngine";

import "./PluginFrameExample.css";
import "../../../../../registry/components/button/styles.css";

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
              <Button
                key={w}
                type="button"
                className={`primitiv-button primitiv-button--${
                  w === frameWidth ? "primary" : "secondary"
                } primitiv-button--sm`}
                aria-pressed={w === frameWidth}
                onClick={() => setFrameWidth(w)}
              >
                {w}px
              </Button>
            ))}
          </div>
          <div className="pf-aspect-control">
            <span>Chart aspect {chartAspect.toFixed(2)}</span>
            <Slider.Root
              className="pf-slider pf-aspect-control__slider"
              aria-label="Chart aspect"
              min={0.5}
              max={2.5}
              step={0.05}
              value={[chartAspect]}
              onValueChange={([next]) => setChartAspect(next)}
            >
              <Slider.Track className="pf-slider__track">
                <Slider.Range className="pf-slider__range" />
              </Slider.Track>
              <Slider.Thumb className="pf-slider__thumb" />
            </Slider.Root>
          </div>
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
