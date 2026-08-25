# `code-block` — registry entry

The artefacts `primitiv add code-block` resolves and copies into a consumer
repo — a block of source code mirroring the Figma "Code Block" set, plus the
one thing Figma can't express: **syntax highlighting**. Like `prose` and
`inline-code` it has **no headless `@primitiv-ui/react` counterpart**; unlike
them it carries real behaviour (Prism highlighting + copy-to-clipboard), so the
`<CodeBlock>` wrapper is hand-written.

## What it does

A bordered, tinted (`surface/subtle`) surface with mono type on the **`body/*`**
scale — a mono *face* at the body *size*, not the `code/*` ramp — padded on the
density-scoped `code/padding`. Three optional parts:

- **Header** — a filename plus a copy-to-clipboard control. Shown when a
  `filename` is given (or `showHeader`). The copy control **composes the registry
  `Button`** (variant `secondary`), so `code-block` **depends on `button`** — the
  Button wraps its text label for text-box-trim parity with every other button.
- **Gutter** — a line-number column, shown with `showLineNumbers`.
- **Highlighting** — [`prism-react-renderer`](https://github.com/FormidableLabs/prism-react-renderer)
  tags each token with a class; the stylesheet colours those classes from seven
  `--primitiv-code-syntax-*` roles. Prism's own inline theme is disabled, so the
  colours resolve from the tokens — a light set plus a `[data-theme="dark"]`
  override — and **re-colour through the cascade** when the mode flips (no JS).

## Usage

```tsx
import { CodeBlock } from "@/components/code-block";

<CodeBlock
  language="tsx"
  filename="app.tsx"
  showLineNumbers
  code={`export function App() {\n  return <h1>Hi</h1>;\n}`}
/>
```

- `code` (required) — the source string.
- `language` — a Prism language id (`tsx` default; `css`, `json`, `bash`, ...).
- `filename` — shows the header + copy control.
- `showHeader` — force the header (copy-only) without a filename.
- `showLineNumbers` — the gutter.
- `size` — `xs`–`xl` (default `md`); a `[data-density]` ancestor scales the padding.

Retheme the highlighting by overriding any `--primitiv-code-syntax-*` custom
property (they're plain registry CSS, no Figma variable). Beat the surface with
an unlayered rule — the component sits in `primitiv.base`/`primitiv.variants`.

## Tabbed variant

For a block whose panels switch by a tablist — e.g. an install block offering
npm / pnpm / yarn / bun — compose the **compound subcomponents**. `CodeBlock.Tabs`
composes the headless [`@primitiv-ui/react`](https://primitiv-ui.dev) **`Tabs`**
primitive for the behaviour (roving focus, arrow keys, WAI-ARIA `tab`/`tablist`/
`tabpanel` roles) and reuses the **Tabs** component's `.primitiv-tabs__*` classes
for the look. Hence `code-block` **also depends on `@primitiv-ui/react` and the
`tabs` component**.

```tsx
import { CodeBlock } from "@/components/code-block";

<CodeBlock.Tabs defaultValue="npm">
  <CodeBlock.Header>
    <CodeBlock.List label="Install with">
      <CodeBlock.Trigger value="npm">npm</CodeBlock.Trigger>
      <CodeBlock.Trigger value="pnpm">pnpm</CodeBlock.Trigger>
      <CodeBlock.Trigger value="yarn">yarn</CodeBlock.Trigger>
      <CodeBlock.Trigger value="bun">bun</CodeBlock.Trigger>
    </CodeBlock.List>
    <CodeBlock.Copy>Copy</CodeBlock.Copy>
  </CodeBlock.Header>
  <CodeBlock.Content value="npm"  language="bash" code="npm i @primitiv-ui/react" />
  <CodeBlock.Content value="pnpm" language="bash" code="pnpm add @primitiv-ui/react" />
  <CodeBlock.Content value="yarn" language="bash" code="yarn add @primitiv-ui/react" />
  <CodeBlock.Content value="bun"  language="bash" code="bun add @primitiv-ui/react" />
</CodeBlock.Tabs>
```

- **`CodeBlock.Tabs`** — the tabbed root. Takes the headless `Tabs.Root` props
  (`defaultValue`, controlled `value`/`onValueChange`, `orientation`, ...) plus
  `size` (`xs`–`xl`, default `md`). Tracks the active tab so `CodeBlock.Copy`
  copies the right command.
- **`CodeBlock.Header`** — the toolbar row hosting the tablist + copy control.
- **`CodeBlock.List`** — the tablist; requires a `label` (or `ariaLabelledBy`).
- **`CodeBlock.Trigger`** — a tab; its `value` links it to the matching `Content`.
- **`CodeBlock.Content`** — a panel; takes `code` + `language` (+ `showLineNumbers`)
  and renders the highlighted command for its `value`.
- **`CodeBlock.Copy`** — the **shared** copy control. `children` set the button
  content: pass text (`Copy`) for the text form, or omit for the icon form (the
  single block's default). Inside `CodeBlock.Tabs` it copies the active tab's code.

The single-block `<CodeBlock code=... />` form above is unchanged — the
subcomponents are purely additive, and both forms share one `CodeBlock.Copy` and
one Prism highlighting implementation.

## Variants

`variant="inline"` renders the same highlighted source as a **chip** — one line,
sized to its content, sitting on the baseline — instead of a standalone block.

It exists because highlighting cannot cheaply live anywhere else. Prism and the
`--primitiv-code-syntax-*` palette are both here, and the palette is declared on
`.primitiv-code-block` with the Prism `.token.*` mapping scoped to it. Teaching
`inline-code` to highlight would therefore have meant a second copy of the
palette *and* a `prism-react-renderer` dependency on a component that is
otherwise dependency-free and used widely for plain prose chips. Keeping the
class and changing only the presentation costs neither.

The chip borrows Inline Code's geometry tokens (`code/inline/padding-*`,
`radii/4`) rather than inventing its own, since the two sit side by side in prose
and any drift would read as a mistake. `filename`, `showHeader` and
`showLineNumbers` are ignored in this variant — a chip has nowhere to put them.

**It wraps rather than overflowing.** The first version pinned it to a single
line on the theory that anything longer did not belong in a chip; the first real
use was an import statement in a narrow column, which spilled straight out of its
container. It now uses the same `pre-wrap` + `overflow-wrap: anywhere` pair as
the block variant, so a long line reflows and one unbreakable token cannot hold
the chip open. Pick a smaller `size` where the column is tight — the docs site's
import slot uses `xs`.

```tsx
<p>
  Import it with{" "}
  <CodeBlock variant="inline" size="sm" code={`import { Button } from "@/components/ui/button";`} />
</p>
```

## Files

| File | Authored? | Role |
|---|---|---|
| `contract.json` | **authored** | The styling contract — the `.primitiv-code-block` root class, its parts, the `size` modifier, and the `--primitiv-code-block-*` / `--primitiv-code-syntax-*` tokens. |
| `styles.css` | **authored** | The canonical default theme: container/header/gutter + the Prism-class → syntax-token mapping (light, with a `[data-theme="dark"]` override). |
| `styles.scss` | **authored** | Mirror of `styles.css` plus the `$primitiv-code-block-*` / `$primitiv-code-syntax-*` Sass aliases. |
| `code-block.recipe.ts` | **authored** | A `cva("primitiv-code-block", ...)` with the `size` variant. |
| `code-block.tsx` | **authored** | The `<CodeBlock>` wrapper — Prism highlighting, copy button, optional header/gutter — plus the compound subcomponents (`CodeBlock.Tabs`/`Header`/`List`/`Trigger`/`Content`/`Copy`) for the tabbed variant, composing the headless `Tabs`. The Copy/Check glyphs are inlined (house path data) so no icon package is pulled in. |

Because there is no headless primitive, the wrapper is **not** generated by
`primitiv-emit` and carries **no drift-guard test** (contrast the generated
wrappers, D53). It is type-checked in CI by `scripts/check-registry-types.mjs`.

## Dependencies

- **package** `prism-react-renderer` — the tokenizer (declared in the registry
  entry, installed by `add code-block`/`add --all`, nothing else).
- **package** `@primitiv-ui/react` — the headless `Tabs` primitive the tabbed
  variant composes for behaviour + a11y.
- **component** `button` — the copy control composes it (`Button` variant `secondary`).
- **component** `tabs` — the tabbed variant reuses its `.primitiv-tabs__*` classes
  for the look (installed alongside `code-block`).
- **tokens** — `font-family/mono`, `body/*` (font-size + line-height),
  `code/padding`, `surface/subtle`, `content/*`, `border/subtle`, `radii/8`, `space/*`.

### Why `body/*` and not `code/*` — the two code surfaces differ on purpose

An earlier build put this block on the `code/*` ramp, reasoning that both code
surfaces should size alike. That is the one thing the design deliberately does
**not** do. Checked at the binding level against the live Figma "Code Block" set
(`601:9607`) via the Desktop Bridge: the Code, Gutter **and** filename text nodes
each bind `fontSize` → `body.<size>.font-size` and `lineHeight` →
`body.<size>.line-height`, with only `fontFamily` on `font-family/mono`. Nothing
in the set touches `code.<size>`.

The rationale holds up: `inline-code` sits *inside* a run of body text, where a
mono face at the same nominal size reads optically larger, so it steps down a
notch. A **block** is standalone — there is no surrounding text to match — so it
takes the body size straight. `Kbd` binds `body.<size>` for the same reason. So
`code.<size>` is genuinely inline-code's alone.

The old build rendered every block a full step small — 13px against 16px at
`md`/comfortable, 2–4px low across `xs`–`xl`, with line-height 20 against 24. Its
stated justification was also wrong on its facts: it claimed `body/*` is not
density-scoped, and it is (`body.md.font-size` is 16/16/12/16 across
comfortable/compact/dense/spacious).

Note that `font-size: inherit` on `__pre` and `__code` stays load-bearing even
though both now resolve through `body/*`: the reset pins a bare `pre`/`code` to
`body.md` **specifically**, so without it the block would sit at the `md` size on
every `size` — identical at `md`, wrong at the other four steps.
