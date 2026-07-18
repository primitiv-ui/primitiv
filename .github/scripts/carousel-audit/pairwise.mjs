// Generic pairwise (all-pairs) combinatorial test case generator — no deps,
// deterministic. Given a set of factors (axis name -> possible values), it
// produces a minimal-ish set of cases such that every PAIR of values from any
// two different axes appears together in at least one case. This is the
// standard trade-off for testing systems with too many axes for a full
// cartesian product: pairwise coverage catches the large majority of
// real-world interaction bugs (two axes fighting each other) at a fraction of
// the cost of every combination.
//
// Algorithm: greedy case-by-case construction. For each new case, walk the
// axes (rotating the starting axis each case so no single axis always gets
// "first pick" and defaults to the same value forever); for each axis, pick
// whichever value covers the most currently-uncovered pairs against the axes
// already fixed *in this case*, breaking ties by overall remaining demand for
// that (axis, value) — not the first-declared value — so early-in-case picks
// (which have nothing fixed yet to score against) still diversify instead of
// collapsing to one default. Not provably minimal (real pairwise tools use
// more sophisticated search), but simple, dependency-free, and converges well
// for the carousel's ~25-factor set.

/**
 * @param {Record<string, readonly string[]>} factors
 * @returns {Record<string, string>[]}
 */
export function generatePairwiseCases(factors) {
  const axes = Object.keys(factors);
  if (axes.length < 2) {
    const only = axes[0];
    return only ? factors[only].map((v) => ({ [only]: v })) : [];
  }

  const pairKey = (a, av, b, bv) => `${a}=${av} ${b}=${bv}`;
  const orderedPair = (a, av, b, bv) =>
    axes.indexOf(a) < axes.indexOf(b) ? pairKey(a, av, b, bv) : pairKey(b, bv, a, av);

  const uncovered = new Set();
  for (let i = 0; i < axes.length; i++) {
    for (let j = i + 1; j < axes.length; j++) {
      const a = axes[i];
      const b = axes[j];
      for (const av of factors[a]) {
        for (const bv of factors[b]) {
          uncovered.add(pairKey(a, av, b, bv));
        }
      }
    }
  }

  // How many uncovered pairs currently involve (axis, value) at all, summed
  // across every other axis — used to break ties toward values still most "in
  // demand" rather than always the first-declared one.
  function demand(axis, value) {
    let count = 0;
    for (const other of axes) {
      if (other === axis) continue;
      for (const otherValue of factors[other]) {
        if (uncovered.has(orderedPair(axis, value, other, otherValue))) count++;
      }
    }
    return count;
  }

  const cases = [];
  const MAX_CASES = 500;
  let rotation = 0;

  while (uncovered.size > 0 && cases.length < MAX_CASES) {
    const order = [...axes.slice(rotation), ...axes.slice(0, rotation)];
    rotation = (rotation + 1) % axes.length;

    /** @type {Record<string, string>} */
    const assignment = {};
    for (const axis of order) {
      let bestValue = factors[axis][0];
      let bestScore = -1;
      let bestDemand = -1;
      for (const value of factors[axis]) {
        let score = 0;
        for (const otherAxis of Object.keys(assignment)) {
          if (uncovered.has(orderedPair(axis, value, otherAxis, assignment[otherAxis]))) {
            score++;
          }
        }
        const d = demand(axis, value);
        if (score > bestScore || (score === bestScore && d > bestDemand)) {
          bestScore = score;
          bestDemand = d;
          bestValue = value;
        }
      }
      assignment[axis] = bestValue;
    }

    for (let i = 0; i < axes.length; i++) {
      for (let j = i + 1; j < axes.length; j++) {
        const a = axes[i];
        const b = axes[j];
        uncovered.delete(pairKey(a, assignment[a], b, assignment[b]));
      }
    }
    cases.push(assignment);
  }

  return cases;
}
