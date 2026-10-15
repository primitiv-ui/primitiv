/**
 * Pure timing helpers. Every frame of the video is a function of `t` (seconds),
 * so nothing here keeps state — the same `t` always yields the same picture.
 */

export type Easing = (p: number) => number;

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** 0 before `start`, 1 after `end`, linear between. */
export const progress = (t: number, start: number, end: number) =>
  end <= start ? (t >= start ? 1 : 0) : clamp((t - start) / (end - start), 0, 1);

export const linear: Easing = (p) => p;

export const interpolate = (
  t: number,
  [t0, t1]: readonly [number, number],
  [v0, v1]: readonly [number, number],
  ease: Easing = linear,
) => v0 + (v1 - v0) * ease(progress(t, t0, t1));

export const easeInOutCubic: Easing = (p) =>
  p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

export const easeOutCubic: Easing = (p) => 1 - Math.pow(1 - p, 3);

export const easeInCubic: Easing = (p) => p * p * p;

export const easeOutExpo: Easing = (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));

export const easeInOutQuint: Easing = (p) =>
  p < 0.5 ? 16 * p ** 5 : 1 - Math.pow(-2 * p + 2, 5) / 2;

export const easeOutBack: Easing = (p) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
};

/**
 * Closed-form damped spring from 0 to 1 with zero initial velocity, unit mass.
 * Defaults match react-spring's (tension 170, friction 26 — just critically
 * damped), so it settles without wobble unless asked to.
 */
export const spring = (
  t: number,
  { stiffness = 170, damping = 26 }: { stiffness?: number; damping?: number } = {},
) => {
  if (t <= 0) return 0;
  const omega = Math.sqrt(stiffness);
  const zeta = damping / (2 * omega);
  if (zeta < 1) {
    const wd = omega * Math.sqrt(1 - zeta * zeta);
    return (
      1 -
      Math.exp(-zeta * omega * t) * (Math.cos(wd * t) + ((zeta * omega) / wd) * Math.sin(wd * t))
    );
  }
  return 1 - Math.exp(-omega * t) * (1 + omega * t);
};
