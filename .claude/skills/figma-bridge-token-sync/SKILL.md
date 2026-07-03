---
name: figma-bridge-token-sync
description: The live loop for changing a design token (or a component's variable bindings) in Figma via the Desktop Bridge plugin and flowing it through to the emitted token layer and the registry styling — pair the bridge, read/edit variables with figma_execute (async API), mirror the change into the DTCG source (packages/tokens/src/*.json), regenerate tokens.css via the local CLI, then rebind the registry stylesheet + kitchen-sink. TRIGGER when a registry styling change originates in or must sync with Figma variables (e.g. "make X density-sensitive", "add a code/* token", "adjust the scale in Figma then update the registry", "sync the Figma variable to the tokens"). SKIP for the sync-PLUGIN backup flow (see figma-token-sync), the variable model itself (see figma-variable-architecture), and pure code-side stylesheet edits (see registry-stylesheet-conventions).

  This is the bridge-driven *edit* loop, distinct from figma-token-sync (the plugin's DTCG *backup*). Keep Figma and the repo DTCG in lockstep by editing both, so a later plugin backup is a no-op.
---

# Figma bridge → tokens → registry sync

The end-to-end loop used to give `inline-code` its `code/*/font-size` scale and
density-scoped `code/inline/padding-*`: change a variable in Figma, mirror it
into the repo's DTCG, re-emit, and rebind the registry stylesheet.

## 1. Pair the Desktop Bridge

Call `figma_pair_plugin` → it returns a **6-char code**; the human opens the MCP
Bridge plugin in Figma Desktop, toggles **▶ Cloud Mode**, enters the code,
Connect. **It expires in ~5 min** — re-pair freely; codes are cheap.

- **Verify with a read**, not `figma_analyze_component_set` (it can throw
  `Cannot unwrap symbol` / lag behind the relay). Use `figma_execute`:
  `return (await figma.getNodeByIdAsync('601:9607'))?.name;`
- If the relay says **"No plugin connected"** after the human says connected:
  issue a **fresh** code and have them toggle Cloud Mode **off then on** first
  (a stale session won't accept a new code). Don't loop on the same code.

## 2. Read / edit variables with `figma_execute` (async API)

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
- **Bind** a layer property to it: `node.setBoundVariable("fontSize", nv)`
  (fields: `fontSize`, `lineHeight`, `paddingLeft/Right/Top/Bottom`,
  `itemSpacing`, `topLeftRadius`, `fills`, `strokes`, `strokeWeight`).
- Find a primitive's id by name (`font-size/13`, `space/space-4`). Collections &
  mode IDs (Context = 4 density modes, Intent = Light/Dark) are in
  `figma-variable-architecture`. `boundVariables` may read stale right after a
  write — re-read in a second call to confirm.

## 3. Mirror into the DTCG source (`packages/tokens/src/*.json`)

The repo's source of truth for emitted tokens is the DTCG JSON — **`context.json`**
for density (`comfortable`/`compact`/`spacious`/`dense` blocks, in that file
order), `intent.json` for Light/Dark, etc. Tokens alias primitives:
`{ "$type": "number", "$value": "{font-size.13}" }`.

**Edit surgically** (regex / text insertion). These files are hand-formatted with
irregular indent; `json.load` + `json.dump` reformats the whole file into a huge
diff. Insert the new leaf next to its siblings and re-validate with `json.loads`.

Keep the DTCG values **identical** to what you set in Figma, so a future
sync-plugin backup produces no diff.

## 4. Regenerate `tokens.css` via the local CLI

`primitiv tokens` `include_str!`s the DTCG at compile time, so a rebuild embeds
your edit:

```sh
cargo run -q -p primitiv-cli -- tokens --format css \
  --out apps/kitchen-sink/src/styles/primitiv/tokens.css
```

The diff should be **only** your new `--primitiv-*` lines (check it). The emit
goldens are **fixture-based** (inline `json!` macros in `*_tests.rs`), so adding
tokens to `context.json` does **not** break them — no golden churn.

## 5. Rebind the registry stylesheet + kitchen-sink

Point the component's knob at the new token (e.g. `--primitiv-inline-code-font-size:
var(--primitiv-code-md-font-size)`), mirror css↔scss, update `contract.json`'s
`defaultsTo`, and copy the stylesheet into the kitchen-sink. Follow
`registry-stylesheet-conventions` and the hand-sync steps in
`new-registry-component`.

## 6. Verify

`cargo test -p primitiv-cli -p primitiv-emit` and `node
scripts/check-registry-types.mjs`. The kitchen-sink can't be built in-sandbox
(`sandbox-gotchas`) — the human runs it. Commit Figma-side and code-side together
in one logical change; note in the summary that the Figma variables were created
via the bridge (they aren't in git).
