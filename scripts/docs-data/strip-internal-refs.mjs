/*
 * Removes internal cross-references from prose on its way into the docs site.
 *
 * Descriptions are authored for two audiences at once. `contract.json` and the
 * headless JSDoc are read by maintainers, where "(RFC 0022 §8)" is a useful
 * pointer to the decision record — and by CONSUMERS, who get the same strings
 * in their installed contract, in editor IntelliSense, and on this site, where
 * the citation is a dead end: the RFCs are not published.
 *
 * So the reference is stripped at the boundary rather than deleted at source.
 * Maintainers keep their cross-references; a consumer never meets one.
 *
 * ## What counts as a citation
 *
 * Only a parenthetical whose ENTIRE contents is a reference — the shape every
 * one of these actually takes, verified against the rendered HTML:
 *
 *     (RFC 0022)  (RFC 0022 §8)  (RFC 0012 D13)  (RFC 0006 Principle 2)
 *     (RFC 0018, clone-strip revision)  (D58)  (§1.16)
 *
 * Two guards keep it from eating real prose. A parenthetical containing a
 * colon is left alone, because that shape is explanatory rather than a
 * citation — "(D1: the field never keeps a stale query)" is a sentence, not a
 * pointer. And one longer than `MAX` is left alone too, so a long aside that
 * merely opens with a reference cannot be swallowed whole.
 *
 * Deliberately NOT a blanket regex over "RFC \d+": a sentence like "the RFC
 * 0022 rule" reads as prose and would be left mangled by removing two words
 * from its middle. If one ever appears, rewrite the sentence at source — the
 * strip only handles the parenthetical form.
 */
const MAX = 60;

const CITATION = new RegExp(
  String.raw`\s*\(` +
    String.raw`(?:see\s+)?` +
    String.raw`(?:RFC\s*\d+|§[\d.]+|D\d{1,2}|Principle\s+\d+)` +
    String.raw`[^():]*` +
    String.raw`\)`,
  "g",
);

/**
 * Strips citation parentheticals from one string.
 *
 * No punctuation repair afterwards, deliberately. The pattern already consumes
 * the whitespace BEFORE the parenthesis, so "...a raw <div> (RFC 0022)." comes
 * out as "...a raw <div>." with nothing to tidy. A general "collapse space
 * before punctuation" pass was tried and had to go: it silently rewrote
 * DescriptionList's "(dt : dd side by side)" — deliberate prose describing the
 * inline layout — into "(dt: dd". A repair that can reach text the strip never
 * touched is worse than the problem.
 */
export const stripInternalRefs = (text) => {
  if (!text) return text;
  return text
    .replace(CITATION, (match) => (match.length - match.indexOf("(") > MAX ? match : ""))
    .trim();
};
