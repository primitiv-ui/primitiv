---
description: Start the Figma-bridge → tokens → registry sync loop — pair the Desktop Bridge, load the workflow skill, then edit a design token in Figma and flow it through to the emitted token layer and the registry styling.
argument-hint: [what to change, e.g. "make inline-code padding density-sensitive"]
---

You are starting a **Figma-bridge token-sync session**: the loop that changes a
design token (or a component's variable bindings) in Figma via the Desktop Bridge
and flows it through to the emitted token layer and the registry styling. The
kitchen-sink (`apps/kitchen-sink`) is the testbed; the human verifies it live.

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
   token/variable and the target values (per density/theme mode if relevant).
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
