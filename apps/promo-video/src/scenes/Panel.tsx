import type { ReactNode } from "react";

import { easeInOutCubic, easeInOutQuint, progress, spring } from "../lib/time";
import { useTime } from "../timeline";
import { fadeStyle, Mark, Words, Wordmark } from "../ui";

/**
 * The brand panel wipes up over the frame at `inAt` and (optionally) leaves
 * upward at `outAt`, revealing whatever is underneath.
 */
export const Panel = ({
  inAt,
  outAt,
  children,
}: {
  inAt: number;
  outAt?: number;
  children: ReactNode;
}) => {
  const t = useTime();
  const pIn = easeInOutQuint(progress(t, inAt, inAt + 0.6));
  const pOut = outAt === undefined ? 0 : easeInOutQuint(progress(t, outAt, outAt + 0.6));
  const y = (1 - pIn) * 100 - pOut * 100;
  // The leading edge is cut on a slant so the wipe reads as motion, not a cut.
  const slant = Math.sin(Math.PI * (pIn < 1 ? pIn : pOut)) * 9;
  return (
    <div
      className="v-panel"
      style={{
        transform: `translateY(${y}%)`,
        clipPath:
          pIn < 1
            ? `polygon(0 ${slant}%, 100% 0, 100% 100%, 0 100%)`
            : `polygon(0 0, 100% 0, 100% ${100 - slant}%, 0 100%)`,
      }}
    >
      <div className="v-panel-grid" />
      {children}
    </div>
  );
};

/** Three pieces of the mark spring up in turn, smallest first. */
export const markBuild = (t: number, at: number) =>
  [0, 1, 2].map((i) => spring(t - at - i * 0.13, { stiffness: 210, damping: 17 }));

export const BrandLockup = ({
  at,
  markSize = 112,
  wordHeight = 40,
}: {
  at: number;
  markSize?: number;
  wordHeight?: number;
}) => {
  const t = useTime();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      <Mark size={markSize} build={markBuild(t, at)} />
      <Wordmark height={wordHeight} reveal={easeInOutCubic(progress(t, at + 0.45, at + 1.05))} />
    </div>
  );
};

export const TITLE_START = 8.3;
export const TITLE_END = 12.4;

/** 8.3–12.4s: the name, between the hook and the detail. */
export const Title = () => {
  const t = useTime();
  return (
    <Panel inAt={0} outAt={3.45}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 30,
          paddingBottom: 30,
        }}
      >
        <BrandLockup at={0.55} />
        <p
          style={{
            margin: 0,
            textAlign: "center",
            fontSize: 19,
            lineHeight: 1.35,
            color: "rgb(255 255 255 / 0.86)",
            ...fadeStyle(t, 1.55, undefined, { dist: 10 }),
          }}
        >
          Headless, accessible React components
          <br />
          with <b style={{ color: "#fff" }}>density</b> built in.
        </p>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 52,
          textAlign: "center",
          fontFamily: "var(--primitiv-font-family-heading)",
          fontWeight: 600,
          fontSize: 15,
          letterSpacing: "0.22em",
          color: "rgb(255 255 255 / 0.7)",
        }}
      >
        <Words text="DESIGN SYSTEM · TOKENS · CLI" at={2.0} stagger={0.08} />
      </div>
    </Panel>
  );
};
