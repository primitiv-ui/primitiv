# `scripts/figma-qa` — browser measurement for the Figma ↔ kitchen-sink audit

Tooling for validating what the kitchen-sink **renders** against what Figma
**specifies**. Built 2026-07-28/29 after four CSS bugs in a row were diagnosed
wrongly from screenshots and reasoning; every one was settled in minutes once the
values were measured in a real browser.

There is no Playwright in this repo's install and no headless Chromium, but macOS
Chrome is present — so these drive Chrome directly over the DevTools Protocol
using Node's global `WebSocket` (Node 18+).

## `cdp.mjs` — measure anything in a real browser

```sh
node scripts/figma-qa/cdp.mjs <url> <path-to-expression-file> [waitMs]
```

Launches headless Chrome, navigates to `<url>` (a `file://` harness or the
deployed site), waits `waitMs` for the SPA to mount, evaluates the JS in
`<expression-file>`, and prints the returned value. The expression must be a
single expression — wrap it in `(() => { … })()`.

```sh
# against the deployed kitchen-sink
node scripts/figma-qa/cdp.mjs \
  https://primitiv-ui.github.io/primitiv/kitchen-sink/ /tmp/expr.js 7000
```

Injecting a candidate stylesheet into the live page and re-measuring is the
fastest way to test a fix before committing it — that is how the AspectRatio
`align-items` bug was finally pinned down.

### Gotchas, all hit in practice

- **Return a string, and join with `String.fromCharCode(10)`.** If you build the
  expression file from a template literal, a literal `"\n"` inside it becomes a
  real newline and breaks the injected script.
- **Never clear `style.cssText` on a component you're measuring.** Several
  components carry inline custom properties (`--primitiv-aspect-ratio`,
  `--primitiv-progress-value`); wiping them silently changes what you're
  measuring and every variant looks like it passes.
- **Probe the property that actually renders.** `font-style` reports `normal` on
  text the reset obliques with `transform: skewX(-10deg)` — a false pass. Check
  `transform` too.
- `/json/new` needs a PUT in modern Chrome; this uses `Target.createTarget` on
  the browser endpoint instead.
- **A comment that closes early silently kills the whole rule.** Writing a token
  family as `body/<star>/font-weight` inside a CSS comment ends it at that
  `<star>/`; the remaining prose becomes garbage declarations and the browser
  drops the rule without a word. It happened on `figure`, and the symptom looked
  like two unrelated regressions (caption pinned to `body/sm` at every size, and
  its gap doubled — the dead `margin: 0` no longer suppressing the reset's
  `figcaption` margin). Measuring after the edit is what caught it;
  `pnpm qa:stylesheets` now guards it in CI.

## `size-pin.mjs` — find parts that ignore the `size` axis

```sh
REPO=$PWD SP=/tmp node scripts/figma-qa/size-pin.mjs   # writes $SP/size-pin.html
node scripts/figma-qa/cdp.mjs "file://$SP/size-pin.html" /tmp/expr-pin.js 2500
```

Renders each component at xs…xl from the real token layer, reset and component
stylesheets, then reports every text part whose `font-size` **doesn't move**.

That is the signature of the bug class that produced three separate faults:
`primitiv.reset` styles bare elements (`p`, `dt`, `dd`, `cite`, `caption`, …)
**directly**, and a declaration on an element beats an inherited one whatever the
layer — so a component that sets its type on the root and lets a part inherit
gets the reset's value and stops responding to `size` entirely. Each was
invisible at `md`/comfortable, where the reset's scale happens to coincide.

Two known-good exceptions the report will list — confirm before "fixing" either:

- **`prose`** has no `size` axis, so its parts are correctly pinned.
- **`table__caption`** is bound to `body/sm` on *every* Figma Size variant, so a
  size-invariant caption is the design.

An earlier version diffed reset-on against reset-off instead. Don't go back to
it: it drowns in false positives, because disabling the reset also removes its
legitimate normalisation (`th` bold/centre, `caption` size) and reports the UA
defaults as "what the component wants".
