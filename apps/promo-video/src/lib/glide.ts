import { progress, type Easing } from "./time";

export type Step<T> = { readonly at: number; readonly to: T };
export type Glide<T> = { from: T; to: T; p: number };

/**
 * Where a stepped glide is at time `t`: each step starts at `at` and takes
 * `duration` seconds to travel from the previous destination to `to`.
 */
export const glideAt = <T>(
  t: number,
  initial: T,
  steps: readonly Step<T>[],
  duration: number,
  ease: Easing,
): Glide<T> => {
  let from = initial;
  let to = initial;
  let p = 1;
  for (const step of steps) {
    if (t < step.at) break;
    from = to;
    to = step.to;
    p = ease(progress(t, step.at, step.at + duration));
  }
  return { from, to, p };
};
