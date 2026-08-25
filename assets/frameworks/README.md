# Framework marks

Logos for the **frameworks Primitiv targets or intends to target**, used by
the docs-site framework selector (RFC-less; the decision is
`docs/docs-site-planning.md` §1.18 — React active, Vue / Svelte / Solid shown
greyed as future, because v1 is React-only).

```
assets/frameworks/
  mono/    react.svg  vue.svg  svelte.svg  solid.svg     fill="currentColor"
  color/   react.svg  vue.svg  svelte.svg  solid.svg     each brand's own palette
```

## What these are not

- **Not Primitiv brand assets.** Ours live in `logo-concepts/` and on the
  Figma "Logos & Branding" page (`Brand Mark`, `Wordmark`, `Favicon`,
  `Lockup`).
- **Not part of `@primitiv-ui/icons`.** That package is 45 glyphs in the
  house line style, all `currentColor`, all mirrored by a Figma Icon glyph.
  These are other projects' trademarks: they are not ours to redraw in the
  house style, they must not be published in our icon package, and they carry
  no Figma-glyph lockstep obligation. Deliberately kept out — see
  `docs/docs-site-planning.md` §1.17.
- **Not React components.** Plain SVG files. The docs site can inline or
  import them directly; wrap them only if a placement needs it.

## Provenance

| Mark | Geometry source | Colour |
| --- | --- | --- |
| React | [simple-icons] `react.svg`, path verbatim | `#61DAFB` (single-colour mark) |
| Vue | [simple-icons] `vuedotjs.svg`, path verbatim | `#41B883` outer + `#34495E` inner |
| Svelte | [simple-icons] `svelte.svg`, path verbatim | `#FF3E00` (single-colour mark) |
| Solid | mono: [simple-icons] `solid.svg` · colour: [solidjs/solid-site] official artwork | official four-gradient palette |

[simple-icons]: https://github.com/simple-icons/simple-icons
[solidjs/solid-site]: https://github.com/solidjs/solid-site

**Licence.** The simple-icons *files* are CC0-1.0, but the **marks
themselves remain the trademarks of their respective owners** (Meta, the
Vue.js project, the Svelte project, the SolidJS project). They are included
here for nominative use — identifying which framework a docs surface refers
to — under each project's monochrome-or-own-palette, do-not-distort terms.
Do not restyle, restretch, recolour beyond the two treatments here, or use
them in a way that implies endorsement.

## The three things worth knowing

1. **Vue's two-tone is derived, not redrawn.** Its upstream path is a single
   compound path whose two subpaths are exactly the outer chevron and the
   inner notch, so splitting on the subpath boundary yields the official
   two-tone with no reconstruction. (Independently confirmed: the split
   matches the pair hand-authored in
   `scripts/figma/create-v2-docs-landing-wireframe.js` for the wireframe.)

2. **Solid's colour variant is the only mark not on the 24 grid.** Every
   other file is `viewBox="0 0 24 24"`, matching the house icon grid;
   Solid's official artwork is `viewBox="0 0 166 155.3"` and is kept
   verbatim rather than re-fitted, because its four gradients are
   `userSpaceOnUse` and re-fitting would mean recomputing them. Size it by
   its own box.

3. **Solid's gradient ids are namespaced** (`solid-a` ... `solid-d`, upstream
   `a` ... `d`). Inlining two SVGs with `id="a"` into one document collides and
   silently mis-paints one of them. This is the only edit made to the
   upstream artwork.

## Figma counterpart

The same eight marks are a `Framework Mark` component set on the **Logos &
Branding** page (`1812:57496`), axes `Framework=React|Vue|Svelte|Solid ×
Treatment=Mono|Color`, in 100×100 artwork frames. Keep the two in lockstep:
if a mark is updated upstream, update both.

Mono is black-on-transparent in Figma (the page's convention — recolour the
vector per surface) and `currentColor` here (the web equivalent of the same
rule), so a disabled "Soon" row greys the mark with nothing more than a
colour change.
