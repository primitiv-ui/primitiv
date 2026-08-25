/**
 * Shortens a component's description for its card on the `/components` grid.
 *
 * ## Why this exists at all
 *
 * The card used to show the whole description clamped to three lines by
 * `-webkit-line-clamp`, which appended the browser's own U+2026. That
 * character is banned repo-wide, and removing the clamp left descriptions
 * cutting off mid-sentence with nothing to say they had been cut — the reader
 * cannot tell a truncated card from a component whose description simply ends
 * abruptly.
 *
 * Nothing in CSS can fix that. `text-overflow` does not apply to a line clamp,
 * the standard `block-ellipsis` that would is not shipping in any engine, and a
 * fade or mask applies UNCONDITIONALLY — it would blur one-line descriptions
 * that are already complete, because CSS cannot ask whether the text actually
 * overflowed. So the cut has to happen where the text is known: here.
 *
 * ## The rule
 *
 * 1. Fits the budget whole? Show it whole, with no marker.
 * 2. Does its FIRST SENTENCE fit? Show that — a complete thought, and still no
 *    marker, because nothing was cut mid-way.
 * 3. Otherwise cut at the last word boundary inside the budget and append
 *    `...`, so the reader knows there is more.
 *
 * Only step 3 adds a marker, which is the point: a card is never decorated with
 * an ellipsis it did not earn.
 *
 * ## The budget
 *
 * A card is at minimum `--docs-index-card-min` (16rem) wide with 1rem of
 * padding each side, leaving ~224px of text — about 28 characters per line at
 * `body-md`, so ~84 for the three lines the card allows. The budget is set just
 * under that so the CSS clamp is a backstop that should never actually bite;
 * if it did, it would eat the `...` and we would be back to a silent cut.
 *
 * Being conservative costs almost nothing: the card's media region carries
 * `flex-grow: 1`, so a shorter description simply gives the artwork more room
 * and every card in a row stays the same height either way.
 */
const BUDGET = 88;

/**
 * True when the string has an unclosed code span.
 *
 * Descriptions are rendered through `renderDoc`, which turns `` `x` `` into a
 * code chip. Cutting between the two backticks would leave a stray one to be
 * rendered literally, so a cut that lands mid-span is walked back.
 */
const hasOpenCodeSpan = (text: string) => (text.match(/`/g) ?? []).length % 2 === 1;

/**
 * The first sentence, or null when the text does not obviously have one.
 *
 * A sentence ends at `.`/`!`/`?` followed by whitespace and a capital, an
 * opening bracket or a backtick — not merely by whitespace, which would split
 * "e.g. a Button" and abbreviations of that shape.
 */
const firstSentence = (text: string): string | null => {
  const match = /^.*?[.!?](?=\s+[A-Z`(]|$)/s.exec(text);
  return match ? match[0] : null;
};

export const cardSummary = (description: string): string => {
  const text = description.trim();
  if (text.length <= BUDGET) return text;

  const sentence = firstSentence(text);
  if (sentence && sentence.length <= BUDGET && !hasOpenCodeSpan(sentence)) {
    return sentence;
  }

  let cut = text.slice(0, BUDGET);
  cut = cut.slice(0, cut.lastIndexOf(" "));
  /* Walk back whole words until the code spans balance, so a cut never lands
     between a pair of backticks. */
  while (cut && hasOpenCodeSpan(cut)) {
    const previous = cut.lastIndexOf(" ");
    if (previous === -1) break;
    cut = cut.slice(0, previous);
  }
  /* Trailing punctuation before an ellipsis reads as a typo ("the panel,..."). */
  return `${cut.replace(/[\s,;:—-]+$/, "")}...`;
};
