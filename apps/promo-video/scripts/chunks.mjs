/**
 * Splits a render into `jobs` contiguous ranges of whole frames, [from, to),
 * as evenly as possible. Working in frames rather than seconds is what keeps
 * the joined video seamless: a boundary off the frame grid would duplicate or
 * drop a frame at the seam.
 */
export const chunks = (duration, jobs, fps) => {
  const total = Math.round(duration * fps);
  const n = Math.max(1, Math.min(jobs, total));
  return Array.from({ length: n }, (_, i) => ({
    from: Math.floor((i * total) / n),
    to: Math.floor(((i + 1) * total) / n),
  }));
};
