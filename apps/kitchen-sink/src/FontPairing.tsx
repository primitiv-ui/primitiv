/*
 * Font pairing preview — a live heading/body font swap for the whole page.
 *
 * Why it exists: the 2026-08-15 typography and colour passes left a font
 * decision open (docs/interface-audit.md). A pairing cannot be judged from
 * specimens, only in situ across every component at once, which is exactly what
 * the kitchen sink is.
 *
 * CORRECTED 2026-08-18. This header used to say Asta Sans carries no tabular
 * figures, making the `tabular-nums` shipped on Pagination / Data Table /
 * Carousel inert. Measured in Chromium, that is wrong: **Asta Sans implements
 * `tnum`** (proportional by default — a 45px spread on "1111" vs "8888" at 100px
 * — collapsing to 0 with the feature on), so those declarations work. **Khand
 * does not** (71px either way), which is what the Figma type panel was showing,
 * and which matters because the heading family is what Badge renders its counts
 * in. So the pair is mostly fine and the open question is narrower than it
 * looked: only heading-face numerals are unaligned.
 *
 * THE LIST IS VERIFIED, NOT CURATED. Both requirements are measured in the
 * browser rather than taken on trust, because a hand-assembled "these should be
 * fine" list is how the current font got picked:
 *
 *   1. WEIGHTS. The system leans on semibold — 45 uses of
 *      --primitiv-font-weight-semibold against 25 of regular and 13 of medium —
 *      and 600 is the weight Google Fonts most often omits (plenty ship
 *      400/500/700 only). Google's CSS API silently drops a weight a family
 *      does not have, so the CSS response is fetched and parsed directly — a weight
 *      Google will not serve simply never appears in it. Variable families
 *      declare a RANGE ("100 900") instead of one block per weight, so both
 *      shapes are handled. Parsing text rather than walking `document.fonts`
 *      is deliberate: FontFaceSet population is asynchronous and was the cause
 *      of an empty option list that took two rounds to pin down.
 *
 *   2. TABULAR FIGURES. Measured, not asserted: the rendered width of "1111"
 *      against "8888" with `font-variant-numeric: normal`, then again with
 *      `tabular-nums`. If the spread collapses, the family has `tnum`; if it
 *      was already zero the family is monospaced-by-figure and equally fine.
 *      This is the measurement that corrected the Figma-panel reading above.
 *
 *      It is a HARD requirement for the body slot and a SOFT one for the heading
 *      slot, because every component that renders a *changing* number resolves
 *      the text family — Pagination, Data Table, the Avatar Group counter — while
 *      the heading family is consumed by headings, `label/*` and `overline/*`,
 *      which do not. Badge is the one exception, so heading families that fail
 *      only this check are offered with that caveat attached rather than hidden.
 *      Hiding them was excluding most display and condensed faces (they rarely
 *      ship `tnum`) and quietly turning the heading list into a list of body
 *      faces.
 *
 * Rejections are shown with their reason rather than filtered away silently: a
 * mysteriously short list teaches nothing, and "no 600" vs "no tabular figures"
 * are different problems.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectContent,
  SelectItem,
  SelectItemLabel,
} from "./components";
import { ChevronDown } from "@primitiv-ui/icons";

/* The weights the system actually consumes. Checked against the emitted token
   layer, not guessed: thin/extralight/light/bold appear once each (in the scale
   specimen), so requiring them would reject good families for no benefit. */
const REQUIRED_WEIGHTS = [400, 500, 600] as const;

/*
 * Candidate families. Deliberately a shortlist, not all ~1500 Google Fonts:
 * every entry costs a network fetch to verify, so the panel would spend minutes
 * loading and the option list would be unreadable. These are the sans and serif
 * text faces plausible for a design system's body or heading slot, plus the two
 * currently in use so the baseline is directly comparable.
 */
const CANDIDATES = [
  "Asta Sans", "Khand",
  "Inter", "Source Sans 3", "IBM Plex Sans", "Roboto", "Rubik", "Work Sans",
  "Manrope", "Public Sans", "Archivo", "Figtree", "Lexend", "Karla", "Mulish",
  "Nunito Sans", "Barlow", "DM Sans", "Plus Jakarta Sans", "Outfit",
  "Space Grotesk", "Epilogue", "Sora", "Urbanist", "Red Hat Display",
  "Red Hat Text", "Asap", "Cabin", "Chivo", "Commissioner", "Encode Sans",
  "Heebo", "Jost", "Libre Franklin", "Montserrat", "Noto Sans", "Open Sans",
  "Overpass", "Poppins", "Raleway", "Schibsted Grotesk", "Instrument Sans",
  "Onest", "Fraunces", "Newsreader", "Source Serif 4", "Literata", "Lora",
  "Bitter", "Crimson Pro", "Petrona", "Playfair Display",
].sort((a, b) => a.localeCompare(b));

type Verdict = {
  family: string;
  weights: number[];
  missingWeights: number[];
  normalSpread: number;
  tabularSpread: number;
  numericOk: boolean;
  ok: boolean;
  reason: string | null;
};

/** Build one Google Fonts CSS URL for a batch of families at the required weights. */
function cssUrl(families: string[]): string {
  const spec = families
    .map((f) => `family=${f.replace(/ /g, "+")}:wght@${REQUIRED_WEIGHTS.join(";")}`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${spec}&display=swap`;
}

/**
 * Rendered width of a string in `family`, with a given `font-variant-numeric`.
 * Measured off-DOM-flow at 100px so the spread is large enough to be decisive
 * at sub-pixel precision.
 */
function widthOf(el: HTMLElement, text: string): number {
  el.textContent = text;
  return el.getBoundingClientRect().width;
}

function measureFigures(family: string): { normalSpread: number; tabularSpread: number } {
  const el = document.createElement("span");
  el.setAttribute("aria-hidden", "true");
  el.style.cssText =
    "position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre;" +
    `font-size:100px;font-family:"${family}";`;
  document.body.appendChild(el);

  el.style.fontVariantNumeric = "normal";
  const normalSpread = Math.abs(widthOf(el, "1111") - widthOf(el, "8888"));
  el.style.fontVariantNumeric = "tabular-nums";
  const tabularSpread = Math.abs(widthOf(el, "1111") - widthOf(el, "8888"));

  el.remove();
  return { normalSpread, tabularSpread };
}

/**
 * Which weights Google actually serves for each family, parsed straight out of
 * the CSS response.
 *
 * This replaced an earlier `document.fonts` walk, which was the bug behind the
 * empty option list: FontFaceSet population is asynchronous and not reliably
 * observable — StrictMode's second effect pass read it before anything had
 * parsed, saw zero weights for all 52 families, and rejected every one. Polling
 * for it only papered over the timing.
 *
 * The CSS text is deterministic by comparison. Google emits one `@font-face`
 * block per family × weight × unicode subset, so the same weight appears many
 * times; a variable family instead emits a `font-weight: 100 900` range. Both
 * shapes are handled, and a weight Google does not serve simply never appears —
 * which is exactly the signal wanted, with no timing involved at all.
 */
function parseWeights(css: string): Map<string, Set<number>> {
  const out = new Map<string, Set<number>>();
  for (const block of css.split("@font-face").slice(1)) {
    const fam = /font-family:\s*['"]([^'"]+)['"]/.exec(block)?.[1];
    const weight = /font-weight:\s*([^;]+);/.exec(block)?.[1]?.trim();
    if (!fam || !weight) continue;
    const set = out.get(fam) ?? new Set<number>();
    if (/\s/.test(weight)) {
      const [lo, hi] = weight.split(/\s+/).map(Number);
      for (const w of REQUIRED_WEIGHTS) if (w >= lo && w <= hi) set.add(w);
    } else {
      set.add(Number(weight));
    }
    out.set(fam, set);
  }
  return out;
}

export function FontPairing() {
  const [heading, setHeading] = useState("Khand");
  const [body, setBody] = useState("Asta Sans");
  const [verdicts, setVerdicts] = useState<Verdict[] | null>(null);
  const [showRejected, setShowRejected] = useState(false);
  const [diag, setDiag] = useState<string | null>(null);

  // Fetch + parse the CSS (weights), inject it (usability), then measure figures.
  useEffect(() => {
    let cancelled = false;

    const batches: string[][] = [];
    for (let i = 0; i < CANDIDATES.length; i += 8) batches.push(CANDIDATES.slice(i, i + 8));

    (async () => {
      try {
        /* Fetch the CSS rather than link it, so the weight data comes from text
           we can parse synchronously instead of from FontFaceSet timing. The
           same text is then injected as a <style> so the families are actually
           usable for the measurement and the previews. */
        const sheets = await Promise.all(
          batches.map((b) =>
            fetch(cssUrl(b)).then((r) => {
              if (!r.ok) throw new Error(`Google Fonts returned ${r.status}`);
              return r.text();
            }),
          ),
        );
        if (cancelled) return;

        const css = sheets.join("\n");
        if (!document.getElementById("ks-font-pairing-sheet")) {
          const style = document.createElement("style");
          style.id = "ks-font-pairing-sheet";
          style.textContent = css;
          document.head.appendChild(style);
        }

        const weightMap = parseWeights(css);
        setDiag(`parsed ${weightMap.size} families from ${(css.length / 1024).toFixed(0)}kB of CSS`);

        const weighed = CANDIDATES.map((family) => {
          const weights = [...(weightMap.get(family) ?? [])].sort((a, b) => a - b);
          return {
            family, weights,
            missingWeights: REQUIRED_WEIGHTS.filter((w) => !weights.includes(w)),
          };
        });

        /* Glyphs are only needed for the figure measurement, only at 400, and
           only for families still in contention — so a weight-rejected family is
           never downloaded. */
        const contenders = weighed.filter((w) => w.missingWeights.length === 0);
        await Promise.all(
          contenders.map((w) => document.fonts.load(`400 16px "${w.family}"`).catch(() => [])),
        );
        if (cancelled) return;

        const next: Verdict[] = weighed.map(({ family, weights, missingWeights }) => {
          const measurable = missingWeights.length === 0;
          const { normalSpread, tabularSpread } = measurable
            ? measureFigures(family)
            : { normalSpread: 0, tabularSpread: 0 };
          // Either already tabular by default, or `tnum` collapses the spread.
          // 1px at 100px is well inside sub-pixel noise.
          const numericOk = measurable && (normalSpread < 1 || tabularSpread < 1);
          const reason = missingWeights.length
            ? `no ${missingWeights.join("/")}`
            : !numericOk
              ? "no tabular figures"
              : null;
          return {
            family, weights, missingWeights,
            normalSpread: Math.round(normalSpread),
            tabularSpread: Math.round(tabularSpread),
            numericOk, ok: reason === null, reason,
          };
        });
        setVerdicts(next);
      } catch (err) {
        // Surface it in the panel: a silent empty list is what cost two rounds
        // of guessing at this bug already.
        setDiag(`FAILED — ${err instanceof Error ? err.message : String(err)}`);
        setVerdicts([]);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  /*
   * Drive the two family tokens — on :root, and it HAS to be :root.
   *
   * These were first set on `.kitchen-sink-layout` to keep the panel's own
   * chrome out of the preview, and nothing changed. The reason is custom
   * property indirection: the token layer declares both the base
   * (`--primitiv-font-family-heading`) and every derived token
   * (`--primitiv-heading-h1-font-family: var(--primitiv-font-family-heading)`)
   * on `:root`. Substitution happens where the declaration lives, so the
   * derived token is resolved against :root's value and then inherits its
   * already-substituted result down the tree. Re-pointing the base variable
   * further down cannot reach back and change it.
   *
   * The tell was that the panel's own specimen DID update: it consumes
   * `var(--primitiv-font-family-heading)` directly rather than through a
   * derived token. Direct consumers follow an override anywhere; derived ones
   * only follow it at the element where they were declared.
   */
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primitiv-font-family-heading", heading);
    root.style.setProperty("--primitiv-font-family-text", body);
  }, [heading, body]);

  const passing = useMemo(() => (verdicts ?? []).filter((v) => v.ok), [verdicts]);
  const rejected = useMemo(() => (verdicts ?? []).filter((v) => !v.ok), [verdicts]);

  /*
   * Tabular figures are a hard requirement for the TEXT slot and a soft one for
   * the HEADING slot, so the heading list also offers families that fail only
   * the numeric check — labelled, not hidden.
   *
   * Measured 2026-08-18 rather than assumed: every component that actually
   * renders a *changing* number resolves the text family — Pagination, Data
   * Table and the Avatar Group counter — so the text face has to align its
   * digits. The heading family is consumed by headings, `label/*` and
   * `overline/*`, none of which carry changing numbers. The one exception is
   * Badge, which does render counts and deltas in the heading face; that is why
   * these families are flagged rather than treated as fine.
   *
   * Filtering them out was hiding most display and condensed faces — the natural
   * heading choices almost never ship `tnum` — which made the heading list look
   * like a set of body faces and narrowed the search for no good reason.
   */
  const headingCandidates = useMemo(
    () => (verdicts ?? []).filter((v) => v.ok || (v.missingWeights.length === 0 && !v.numericOk)),
    [verdicts],
  );

  const reset = useCallback(() => { setHeading("Khand"); setBody("Asta Sans"); }, []);

  /*
   * Anchoring is a PAIR of classes, not one: the trigger carries
   * `ks-anchor-<slot>` (which declares `anchor-name`) and the panel carries
   * `ks-anchored-<slot>` (which declares `position-anchor`). Miss either and the
   * panel has no anchor to resolve against, so it falls back to the initial
   * containing block and lands in the page's top-left corner — the same failure
   * BreadcrumbOverflow hit. Both classes are defined in demos.css alongside the
   * other kitchen-sink anchors.
   */
  /*
   * Candidates for a slot, plus the current selection even if it failed.
   *
   * Filtering strictly to passing families left the initial value absent from its
   * own list and the trigger rendered empty — Khand fails the numeric check, so
   * the heading select had no Khand in it. Keeping the current value visible (and
   * labelled with why it fails) also preserves the point of including the shipped
   * pair at all: a baseline to compare against.
   *
   * Corrected 2026-08-18: this used to say "both fonts the system ships today are
   * rejected". **Asta Sans passes** — it draws proportional figures by default but
   * does implement `tnum`, so the tabular check collapses its spread to 0. Only
   * Khand fails. The earlier claim came from reading Figma's type panel rather
   * than measuring a rendered line.
   */
  const optionsFor = useCallback(
    (current: string, slot: string): Verdict[] => {
      const pool = slot === "font-heading" ? headingCandidates : passing;
      if (pool.some((v) => v.family === current)) return pool;
      const failing = (verdicts ?? []).find((v) => v.family === current);
      return failing ? [failing, ...pool] : pool;
    },
    [passing, headingCandidates, verdicts],
  );

  const renderSelect = (
    label: string, value: string, onChange: (v: string) => void, slot: string,
  ) => (
    <label className="ks-fonts__field">
      <span className="ks-fonts__label">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger size="sm" aria-label={label} className={`ks-anchor-${slot}`}>
          <SelectValue placeholder="Pick a font..." />
          <SelectIcon><ChevronDown /></SelectIcon>
        </SelectTrigger>
        <SelectContent size="sm" className={`ks-anchored-${slot}`}>
          {optionsFor(value, slot).map((v) => (
            <SelectItem key={v.family} value={v.family}>
              {/* Each row previews in its own face, the way Figma's picker does —
                  the point of a rich Select here rather than a native <select>,
                  whose <option> cannot be styled reliably across engines. */}
              <SelectItemLabel style={{ fontFamily: `"${v.family}"` }}>
                {v.family}
                {v.ok ? null : (
                  <span className="ks-fonts__fails">
                    {" · "}
                    {/* On the heading slot a numeric-only failure is a caveat, not
                        a rejection: the only heading-face component that renders a
                        changing number is Badge. Say which, so the trade-off is
                        legible instead of reading as "this font is unusable". */}
                    {slot === "font-heading" && v.missingWeights.length === 0
                      ? "no tabular figures — Badge counts will shift"
                      : v.reason}
                  </span>
                )}
              </SelectItemLabel>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );

  return (
    <aside className="ks-fonts" aria-label="Font pairing preview">
      <p className="ks-fonts__title">Font pairing</p>

      {verdicts === null ? (
        <p className="ks-fonts__status">
          {diag ?? `Loading and verifying ${CANDIDATES.length} families…`}
        </p>
      ) : (
        <>
          {renderSelect("Heading", heading, setHeading, "font-heading")}
          {renderSelect("Body", body, setBody, "font-body")}

          <p className="ks-fonts__status">
            {passing.length} of {verdicts.length} families meet the system's needs
            — 400/500/600 as real faces, and tabular figures.
            {diag ? <><br /><span className="ks-fonts__diag">{diag}</span></> : null}
          </p>

          <div className="ks-fonts__specimen" aria-hidden="true">
            <span className="ks-fonts__specimen-heading">Heading 1118</span>
            <span className="ks-fonts__specimen-body">Body copy 1118 · 8888</span>
          </div>

          <button type="button" className="ks-fonts__toggle" onClick={reset}>
            Reset to current
          </button>

          <button
            type="button"
            className="ks-fonts__toggle"
            onClick={() => setShowRejected((s) => !s)}
            aria-expanded={showRejected}
          >
            {showRejected ? "Hide" : "Show"} {rejected.length} rejected
          </button>

          {showRejected && (
            <ul className="ks-fonts__rejected">
              {rejected.map((v) => (
                <li key={v.family}>
                  <span>{v.family}</span>
                  <span className="ks-fonts__reason">{v.reason}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </aside>
  );
}
