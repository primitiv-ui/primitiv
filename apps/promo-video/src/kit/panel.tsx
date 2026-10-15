import type { ReactNode } from "react";

import { easeInOutCubic, easeInOutQuint, progress, spring } from "@lib/time";
import { useTime } from "./timeline";
import { Mark, Wordmark } from "./ui";

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
