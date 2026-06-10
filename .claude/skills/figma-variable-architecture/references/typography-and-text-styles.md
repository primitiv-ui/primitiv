# Typography variables and text styles

Resolved `label/*` font-size and line-height tables live in
`resolved-values.md`. This file covers the gotchas and the text-style
constraints.

## Font family resolution

`font-family/heading` resolves to **Khand**, `font-family/text` to **Asta
Sans**. *Both are sans faces* — Khand is the condensed display/heading/label
face, Asta Sans the body/UI text face. (Renamed from `sans`/`serif` on
2026-05-31 — `serif` was a misnomer since neither face is a serif.) So:
`label/*` → **Khand SemiBold** (the bold, condensed label/button face), and
`body/*` → **Asta Sans Regular** (the regular value/helper/input text face).
Before setting `characters` on a text node, `loadFontAsync` the *resolved* face
(`{family:"Khand",style:"SemiBold"}` or `{family:"Asta Sans",style:"Regular"}`),
not the variable name. This is why Input value text uses `body/*` (regular) and
Field labels use `label/*` (semibold). Note `font-family/heading` (Khand) backs
not just headings but labels, display, and overline too — the name reflects its
most prominent role, not its only one.

## Typography variable resolvedTypes are mixed

When creating typography variables, `font-family` and `font-style` are
**STRING**, but `font-weight`, `font-size`, and `line-height` are **FLOAT**.
Creating a `font-weight` variable as STRING (then aliasing the FLOAT primitive)
throws `"Mismatched variable resolved type for mode …"`. Pick the resolvedType
per field, not per "it's typography".

## Text styles and mode overrides

Text styles in Figma (`TextStyle`) **do not support
`setExplicitVariableModeForCollection`** — the method does not exist on
`BaseStyle`. This means text style variable bindings always resolve using the
collection's **default mode** (Compact, modeId `369:9`) unless the text node
sits inside a frame with a mode override.

Practical behaviour:
- **Text node in a frame with `Context → Dense` override**: the bound variable
  resolves to the Dense mode value — correct.
- **Text style panel preview**: always shows the default mode (Compact)
  regardless of the style's intended density. This is a Figma limitation, not a
  bug.
- **Canonical text styles** (76 total, 19 per density): `Dense / Label / md`,
  `Comfortable / Body / lg`, etc. All bound to the unified Context collection.
  The density in the style name is the *intended* use context, not an enforced
  mode. (`Body / xl` per density added 2026-05-31 alongside the `body/xl/*`
  variables — Body now runs xs–xl like Label.)

**Critical: all 76 text styles bind to the same underlying variables.**
`Dense / Label / md` and `Comfortable / Label / md` both bind their `fontSize`
to the single `label/md/font-size` variable — there is no separate per-density
variable. The density prefix in the style name is documentation only. In the
Figma style panel, all four density variants of a given role/size will show
identical values (the Compact default). They only render differently when the
text node sits inside a frame that has a mode override applied — at which point
the shared variable resolves to the correct density value.

**Typography variable paths in text styles** follow the same naming as in
component anatomy:
- `label/{xs–xl}/font-family`, `font-style`, `font-size`, `line-height`
- `body/{xs–xl}/…`, `heading/{h1–h6}/…`, `display/{lg,xl}/…`, `overline/…`

**Component label text nodes** (e.g. Button's "Button text") bind directly to
Context collection variables inline — no text style applied. They respond
correctly to frame mode overrides without any text style involvement.

> **Gotcha — text styles silently break density.** Applying a text style to a
> component text node looks correct in the Figma panel but is a density bug:
> `TextStyle` has no `setExplicitVariableModeForCollection` and always resolves
> at the collection's default mode (Compact, `369:9`), regardless of any frame
> mode override. The text will render at Compact values even inside a Dense or
> Spacious frame. **Always bind `fontSize`, `fontStyle`, `fontFamily`, and
> `lineHeight` inline via `node.setBoundVariable`.** This applies to every TEXT
> node in every component — framed-controls, surface components, non-framed
> compositions. If any of the four fields is missing from `node.boundVariables`,
> it is unbound and will not respond to density. Found on Modal/Header title
> (2026-06-04).
