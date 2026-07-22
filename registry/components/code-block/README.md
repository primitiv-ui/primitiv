# `code-block` — registry entry

The artefacts `primitiv add code-block` resolves and copies into a consumer
repo — a block of source code mirroring the Figma "Code Block" set, plus the
one thing Figma can't express: **syntax highlighting**. Like `prose` and
`inline-code` it has **no headless `@primitiv-ui/react` counterpart**; unlike
them it carries real behaviour (Prism highlighting + copy-to-clipboard), so the
`<CodeBlock>` wrapper is hand-written.

## What it does

A bordered, tinted (`surface/subtle`) surface with mono type on the **`code/*`**
scale (shared with `inline-code`, so both code surfaces size the same across size
and density — that ramp is density-scoped, unlike `body/*`), padded on the
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
- `language` — a Prism language id (`tsx` default; `css`, `json`, `bash`, …).
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
  (`defaultValue`, controlled `value`/`onValueChange`, `orientation`, …) plus
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

The single-block `<CodeBlock code=… />` form above is unchanged — the
subcomponents are purely additive, and both forms share one `CodeBlock.Copy` and
one Prism highlighting implementation.

## Files

| File | Authored? | Role |
|---|---|---|
| `contract.json` | **authored** | The styling contract — the `.primitiv-code-block` root class, its parts, the `size` modifier, and the `--primitiv-code-block-*` / `--primitiv-code-syntax-*` tokens. |
| `styles.css` | **authored** | The canonical default theme: container/header/gutter + the Prism-class → syntax-token mapping (light, with a `[data-theme="dark"]` override). |
| `styles.scss` | **authored** | Mirror of `styles.css` plus the `$primitiv-code-block-*` / `$primitiv-code-syntax-*` Sass aliases. |
| `code-block.recipe.ts` | **authored** | A `cva("primitiv-code-block", …)` with the `size` variant. |
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
- **tokens** — `font-family/mono`, `code/*` (font-size + line-height),
  `code/padding`, `surface/subtle`, `content/*`, `border/subtle`, `radii/8`, `space/*`.
