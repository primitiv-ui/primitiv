---
description: Tweak a registry component's design end-to-end — pair the Figma Desktop Bridge, adjust the component's variables/tokens in Figma, then flow the change through the emitted token layer to the registry styling and the kitchen-sink. The whole Figma-to-code loop for a styling change.
argument-hint: [component + change, e.g. "inline-code: make padding density-sensitive"]
---

You are **tweaking a registry component's design**: adjusting a token, scale, or
variable binding in Figma via the Desktop Bridge and flowing it through to the
emitted token layer and the registry styling. Figma is the design source of
truth; the kitchen-sink (`apps/kitchen-sink`) is the testbed; the human verifies
it live. (To *build* a new component, use `/scaffold-component` or the
`new-registry-component` skill instead — this command is for changing one that
exists.)

## Steps

1. **Load the `figma-bridge-token-sync` skill** (Skill tool) and follow its loop.
   Pull in `new-registry-component`, `registry-stylesheet-conventions`,
   `figma-variable-architecture`, and `sandbox-gotchas` as the task needs them.

2. **Pair the Desktop Bridge**: call `figma_pair_plugin`, give the user the 6-char
   code and the one-liner (plugin → ▶ Cloud Mode → enter code → Connect), and wait
   for them to confirm. **Verify with a read** — `figma_execute` returning a node
   name — NOT `figma_analyze_component_set` (it can throw / lag). If the relay
   still says "No plugin connected", issue a **fresh** code and have them toggle
   Cloud Mode off/on; codes expire in ~5 min, so don't loop on a stale one.

3. **Confirm the change** in one line: `$ARGUMENTS` if given, otherwise ask which
   component/token and the target values (per density/theme mode if relevant).
   Colour/scale decisions are the human's — propose concrete values and confirm
   before writing.

4. **Run the loop** from the skill: edit Figma variables (async API) → mirror into
   `packages/tokens/src/*.json` (surgical text edit, not a full reserialize) →
   regenerate with `cargo run -q -p primitiv-cli -- tokens --format css --out
   apps/kitchen-sink/src/styles/primitiv/tokens.css` → rebind the registry
   stylesheet (css + scss + contract `defaultsTo`) → hand-sync the kitchen-sink →
   verify with `cargo test -p primitiv-cli -p primitiv-emit` and
   `node scripts/check-registry-types.mjs`.

5. **Commit** the Figma-side and code-side as one logical change; note in the
   summary that the Figma variables were set via the bridge (they aren't in git).

Keep setup terse — pair, confirm the change, then work.
