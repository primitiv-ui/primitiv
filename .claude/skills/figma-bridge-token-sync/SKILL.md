---
name: figma-bridge-token-sync
description: The live loop for changing a design token (or a component's variable bindings) and keeping the emitted token layer, the registry styling, and the Figma variables in lockstep. Code-first order — edit the DTCG source (packages/tokens/src/*.json), regenerate tokens.css via the local CLI, rebind the registry stylesheet + kitchen-sink and confirm the look there, THEN pair the Desktop Bridge and mirror the same final values into the Figma variables last (figma_execute, async API). TRIGGER when a registry styling change originates in or must sync with Figma variables (e.g. "make X density-sensitive", "add a code/* token", "adjust the scale then update Figma", "sync the Figma variable to the tokens"). SKIP for the sync-PLUGIN backup flow (see figma-token-sync), the variable model itself (see figma-variable-architecture), and pure code-side stylesheet edits (see registry-stylesheet-conventions).

  This is the bridge-driven *edit* loop, distinct from figma-token-sync (the plugin's DTCG *backup*). Keep Figma and the repo DTCG in lockstep by editing both, so a later plugin backup is a no-op.
---

# Figma bridge → tokens → registry sync

The end-to-end loop used to give `inline-code` its `code/*/font-size` scale and
density-scoped `code/inline/padding-*`, and to grow the choice controls a
`choice-control/*/gap`: change the values, flow them through the emitted token
layer and the registry styling, and keep Figma's variables in lockstep.

## 0. Order of operations — code + kitchen-sink first, Figma last

**Do the value iteration in code, verify it live in the kitchen-sink, and only
mirror the final numbers into Figma variables at the end.** This is the fast
loop, and it's the preferred default:

- The **kitchen-sink render is the fast visual signal.** Editing the DTCG →
  regenerating `tokens.css` → eyeballing (or pushing) the kitchen-sink is a tight
  code loop with no bridge in it.
- **Figma variable writes are the slow part** — they need a live paired bridge
  and a human at the keyboard, and they aren't in git, so redoing them on every
  iteration is wasteful. Lock the values in code first, get the human's OK in the
  kitchen-sink, *then* push the final values into Figma in **one** bridge pass so
  both sides end up identical (lockstep — a later sync-plugin backup is a no-op).

So the numbered steps below run **1 → 4 in code**, then **5 (Figma) last**. The
only time Figma leads is a *structural component build* (adding a label, new
anatomy) — the Figma work there is the build itself, not a variable tweak — but
even then, settle the token **values** in code first so the build binds to
final numbers.

## 1. Edit the DTCG source (`packages/tokens/src/*.json`), surgically

The repo's source of truth for emitted tokens is the DTCG JSON — **`context.json`**
for density (`comfortable`/`compact`/`spacious`/`dense` blocks, in that file
order), `intent.json` for Light/Dark, etc. Tokens alias primitives:
`{ "$type": "number", "$value": "{font-size.13}" }`.

**Edit surgically** (regex / text insertion). These files are hand-formatted with
irregular indent; `json.load` + `json.dump` reformats the whole file into a huge
diff. Insert/replace the leaf next to its siblings and re-validate with
`json.loads`.

## 2. Regenerate `tokens.css` via the local CLI

`primitiv tokens` `include_str!`s the DTCG at compile time, so a rebuild embeds
your edit:

```sh
cargo run -q -p primitiv-cli -- tokens --format css \
  --out apps/kitchen-sink/src/styles/primitiv/tokens.css
```

The diff should be **only** your new/changed `--primitiv-*` lines (check it). The
emit goldens are **fixture-based** (inline `json!` macros in `*_tests.rs`), so
adding tokens to `context.json` does **not** break them — no golden churn.

## 3. Rebind the registry stylesheet + kitchen-sink

Point the component's knob at the new token (e.g. `--primitiv-inline-code-font-size:
var(--primitiv-code-md-font-size)`), mirror css↔scss, update `contract.json`'s
`defaultsTo`, and copy the stylesheet into the kitchen-sink. Follow
`registry-stylesheet-conventions` and the hand-sync steps in
`new-registry-component`.

## 4. Verify in the kitchen-sink (the fast loop)

Run `cargo test -p primitiv-cli -p primitiv-emit` and `node
scripts/check-registry-types.mjs`. The kitchen-sink can't be built in-sandbox
(`sandbox-gotchas`) — the human runs it. When the human is verifying live and has
authorised it for the session, **push each visual iteration** (to `main` or their
branch) so they can eyeball it, and iterate on their feedback here — this is
where the look gets dialled in, *before* any Figma write. Run the heavier gates
**once**, after the look is confirmed.

## 5. Mirror the final values into Figma (bridge — last)

Once the values are locked and the kitchen-sink look is confirmed, pair the
bridge and write the **same** numbers into the Figma variables so the two sides
stay in lockstep.

**Pair the Desktop Bridge.** Call `figma_pair_plugin` → it returns a **6-char
code**; the human opens the MCP Bridge plugin in Figma Desktop, toggles **▶ Cloud
Mode**, enters the code, Connect. **It expires in ~5 min** — re-pair freely.

- **Verify with a read**, not `figma_analyze_component_set` (it can throw
  `Cannot unwrap symbol` / lag). Use `figma_execute`:
  `return (await figma.getNodeByIdAsync('601:9607'))?.name;`
- If the relay says **"No plugin connected"** after the human says connected:
  issue a **fresh** code and have them toggle Cloud Mode **off then on** first
  (a stale session won't accept a new code). Don't loop on the same code.

The bridge runs with `documentAccess: dynamic-page`, so the **async** variable
API is mandatory:

```js
const colls = await figma.variables.getLocalVariableCollectionsAsync();
const all   = await figma.variables.getLocalVariablesAsync();
const v     = await figma.variables.getVariableByIdAsync(id);
const coll  = await figma.variables.getVariableCollectionByIdAsync(collId);
```

- **Create** a density/theme variable and alias it to a primitive per mode:
  ```js
  const nv = figma.variables.createVariable("code/md/font-size", coll, "FLOAT");
  nv.scopes = ["FONT_SIZE"];               // GAP for padding/gap
  nv.setValueForMode(modeId, { type: "VARIABLE_ALIAS", id: primitiveVarId });
  ```
- **Update** an existing variable's per-mode alias the same way
  (`setValueForMode`); **bind** a layer property with
  `node.setBoundVariable("fontSize", nv)` (fields: `fontSize`, `lineHeight`,
  `paddingLeft/Right/Top/Bottom`, `itemSpacing`, `topLeftRadius`, `fills`,
  `strokes`, `strokeWeight`). Paint bindings (`fills`/`strokes`) go on the paint,
  not the node: `figma.variables.setBoundVariableForPaint(paint, "color", v)`.
- Find a primitive's id by name (`font-size/13`, `space/space-4`, `size/size-20`).
  Collections & mode IDs (Context = 4 density modes, Intent = Light/Dark) are in
  `figma-variable-architecture`. `boundVariables` may read stale right after a
  write — re-read in a second call to confirm.
- Keep the Figma values **identical** to the DTCG, so a future sync-plugin backup
  produces no diff.
- **Dimension changes ripple to static geometry.** When you retarget a control's
  *size* (box-size, track dimensions), the bound layers reflow — but any
  **static, unbound frame** sized for the old dimensions does **not**. The
  focus-ring frames are the classic trap: they carry fixed sizes, so after a
  size change you must sweep and resize them to hug the new control (gap =
  control **+4** at −2/−2, ring = control **+8** at −4/−4). See the focus-ring
  gotcha in `figma-framed-control-component` → `references/gotchas.md`.

## 6. Commit

Commit the code-side and note in the summary that the Figma variables were set
via the bridge (they aren't in git). Structural Figma component builds (labels,
anatomy) likewise live only in Figma — record what changed in the summary.
