// The Supa-style ramp padding control: two full-width horizontal lines that sit
// on top of the curve editor. The top line is the dark-padding boundary (how far
// the dark end is inset), the bottom line the light-padding boundary. Dragging a
// line vertically sets that padding; the engine clamps the ramp into the band
// between them. The overlay itself is click-through (`pointer-events: none`) so
// the per-swatch column sliders underneath stay draggable — only the two lines
// capture the pointer. RFC 0010 §9 plugin work; a sandbox component.

import { useRef, useState } from "react";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

const KEY_STEP = 0.01;

export type RampPaddingProps = {
  /** Light-end inset (bottom line), 0..maxLight. */
  lightPadding: number;
  /** Dark-end inset (top line), 0..maxDark. */
  darkPadding: number;
  maxLight: number;
  maxDark: number;
  onLightChange: (value: number) => void;
  onDarkChange: (value: number) => void;
  /** Accessible name prefix, e.g. `"Brand light"`. */
  label: string;
};

export function RampPadding({
  lightPadding,
  darkPadding,
  maxLight,
  maxDark,
  onLightChange,
  onDarkChange,
  label,
}: RampPaddingProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<"light" | "dark" | null>(null);

  const apply = (kind: "light" | "dark", clientY: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (kind === "light") {
      onLightChange(clamp((rect.bottom - clientY) / rect.height, 0, maxLight));
    } else {
      onDarkChange(clamp((clientY - rect.top) / rect.height, 0, maxDark));
    }
  };

  const handlePointerDown =
    (kind: "light" | "dark") => (event: React.PointerEvent) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(kind);
      apply(kind, event.clientY);
    };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (dragging) apply(dragging, event.clientY);
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    if (dragging) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      setDragging(null);
    }
  };

  const nudge =
    (value: number, max: number, onChange: (v: number) => void) =>
    (event: React.KeyboardEvent) => {
      const delta =
        event.key === "ArrowUp" ? KEY_STEP : event.key === "ArrowDown" ? -KEY_STEP : 0;
      if (delta === 0) return;
      event.preventDefault();
      // Up always grows the inset (dark line moves down, light line moves up).
      onChange(clamp(value + delta, 0, max));
    };

  return (
    <div className="pf-padding" ref={trackRef}>
      <div
        className="pf-padding__line pf-padding__line--dark"
        style={{ top: `${darkPadding * 100}%` }}
        role="slider"
        tabIndex={0}
        aria-label={`${label} dark padding`}
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={Number(maxDark.toFixed(2))}
        aria-valuenow={Number(darkPadding.toFixed(2))}
        onPointerDown={handlePointerDown("dark")}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onKeyDown={nudge(darkPadding, maxDark, onDarkChange)}
      >
        <span className="pf-padding__handle pf-padding__handle--start" />
      </div>
      <div
        className="pf-padding__line pf-padding__line--light"
        style={{ bottom: `${lightPadding * 100}%` }}
        role="slider"
        tabIndex={0}
        aria-label={`${label} light padding`}
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={Number(maxLight.toFixed(2))}
        aria-valuenow={Number(lightPadding.toFixed(2))}
        onPointerDown={handlePointerDown("light")}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onKeyDown={nudge(lightPadding, maxLight, onLightChange)}
      >
        <span className="pf-padding__handle pf-padding__handle--end" />
      </div>
    </div>
  );
}
