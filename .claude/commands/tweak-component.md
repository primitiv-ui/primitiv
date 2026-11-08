---
description: Tweak a registry component's design end-to-end — settle the token values in the DTCG + registry + docs site first (the fast visual loop), then mirror the same final values into the Figma variables via the Desktop Bridge last. The whole styling loop, code-first with Figma in lockstep.
argument-hint: [component + change, e.g. "inline-code: make padding density-sensitive"]
---

You are **tweaking a registry component's design**: adjusting a token, scale, or
variable binding and flowing it through the emitted token layer, the registry
styling, **and** the Figma variables. Figma is the design source of truth for the
*model*; the docs site (`apps/docs-site`) is the fast testbed, where the
component's page shows it; the human verifies it there. (To *build* a new component, use `/scaffold-component` or the
`new-registry-component` skill instead — this command is for changing one that
exists.)

**Preferred loop: iterate in code + docs site first, mirror to Figma last.**
The docs-site render is the fast visual signal; Figma variable writes need a
live bridge + human and aren't in git, so redoing them per-iteration is wasteful.
Settle the values in code, get the human's OK on the docs site, then push the
final numbers into the Figma variables in one bridge pass (lockstep). Only a
*structural* Figma build (adding a label, new anatomy) leads in Figma — and even
then, lock the token values in code first.

## Steps

1. **Load the `figma-bridge-token-sync` skill** (Skill tool) and follow its loop.
   Pull in `new-registry-component`, `registry-stylesheet-conventions`,
   `figma-variable-architecture`, and `sandbox-gotchas` as the task needs them.

2. **Confirm the change** in one line: `$ARGUMENTS` if given, otherwise ask which
   component/token and the target values (per density/theme mode if relevant).
   Colour/scale decisions are the human's — propose concrete values and confirm
   before writing.

3. **Run the code loop first** (no bridge yet): edit `packages/tokens/src/*.json`
   (surgical text edit, not a full reserialize) → regenerate with `cargo run -q -p
   primitiv-cli -- tokens --format css --out
   apps/docs-site/src/styles/primitiv/tokens.css` (and the workbench copy,
   `apps/workbench/src/primitiv-tokens.css`) → rebind the registry stylesheet
   (css + scss + contract `defaultsTo`) → hand-sync the docs site → build it and
   screenshot the component's page. Push each visual iteration if the human
   authorised it, let them eyeball it, and iterate here until the look is
   confirmed. Run the gates
   (`cargo test -p primitiv-cli -p primitiv-emit`,
   `node scripts/check-registry-types.mjs`) once at the end.

4. **Mirror into Figma last**: pair the Desktop Bridge — call `figma_pair_plugin`,
   give the user the 6-char code and the one-liner (plugin → ▶ Cloud Mode → enter
   code → Connect), and wait for them to confirm. **Verify with a read** —
   `figma_execute` returning a node name — NOT `figma_analyze_component_set` (it
   can throw / lag). If the relay still says "No plugin connected", issue a
   **fresh** code and have them toggle Cloud Mode off/on; codes expire in ~5 min,
   so don't loop on a stale one. Then write the **same** final values into the
   Figma variables (async API) so both sides stay in lockstep. For a *structural*
   build (label, new anatomy) this Figma step is the build itself — and remember
   that changing a control's size leaves static focus-ring frames stale; sweep
   them (see the `figma-framed-control-component` gotchas).

5. **Commit** the code-side; note in the summary that the Figma variables/build
   were done via the bridge (they aren't in git).

Keep setup terse — confirm the change, work in code, mirror to Figma last.

## Fast iteration — push first, full-check once

When the human is verifying the docs site (a local dev server or a deploy) and has
authorised it for the session, **push each visual iteration straight to `main`
(or their branch) before running the full test + type-check suite.** The
docs-site render is the fast signal: push, let the human eyeball it, iterate
on the styling from their feedback, and run the heavier gates —
`cargo test -p primitiv-cli -p primitiv-emit`, `node scripts/check-registry-types.mjs`,
css/scss parity — **once, after the look is confirmed**, not on every round. It
keeps the agent↔human loop tight; the checks gate the *final* state, not each
step. (Only push to `main` when the human has explicitly authorised it for the
session; otherwise stay on the working branch. And still run the full suite
before calling the change done — visual confirmation replaces per-iteration
checks, it doesn't replace the final green.)
