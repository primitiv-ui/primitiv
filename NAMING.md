# Naming & namespace decisions

A record of why this project publishes the way it does, so the decision
trail isn't lost. See `CLAUDE.md` for the **product vs engine** identity
split (Primitiv = product, Harmoni = engine); this file is specifically
about **published names and namespaces**.

## Summary

| Surface            | Name           | Status                          |
| ------------------ | -------------- | ------------------------------- |
| npm scope          | `@primitiv-ui` | Secured ✅                       |
| JSR scope          | `@primitiv-ui` | Secured ✅                       |
| GitHub org         | `primitiv-ui`  | Secured ✅                       |
| npm bare `primitiv`| —              | **Taken** (not ours)            |
| Trademark clearance| —              | **Pending** (image/design-code) |

Libraries publish as `@primitiv-ui/react`, `@primitiv-ui/icons`,
`@primitiv-ui/tokens`, `@primitiv-ui/docs`. Install reads
`npm i @primitiv-ui/react`.

## Why `@primitiv-ui` and not `@primitiv`

The bare, unscoped npm package **`primitiv` is already taken** — and
notably it's in our space: published April 2026 by user `ghprimitiv`,
described as a *"Spec Driven Development engine for AI-assisted software
development."* That's a same-category developer tool, so it's a closer
collision than anything else found.

Attempting to create the npm org **`primitiv`** returned **Creation
Denied** (npm blocks names too similar to an existing package). So the
exact `@primitiv` scope was unavailable.

`@primitiv-ui` cleared on npm, JSR, and GitHub, and reads naturally for
a UI/design-system library. The **product is still called "Primitiv"** —
only the publish scope carries the `-ui` suffix.

## What the rename touched (and didn't)

A single mechanical commit renamed the scope string `@primitiv/` →
`@primitiv-ui/` across the monorepo: package names, internal workspace
deps, all source imports, tsconfig/vite/vitest paths, the pnpm lockfile,
and all READMEs / docs / skill files / `.claude` config.

Deliberately **left as the bare word "Primitiv"** (identity split — see
`CLAUDE.md`): the README `# Primitiv` heading, root `package.json`
`"name": "primitiv"` (private), the workbench `<title>` and heading, the
`primitiv-sync-figma-plugin` / `harmoni-figma-plugin` app names, and the
**Harmoni** engine name.

## Trademark / prior-use notes

A **text-only** clearance pass was done. Text search finds *names* and
*described* logos, not shape-matches — so "nothing found" means "no
obvious red flag," **not** "clear."

Name occupants already in use (different classes, but worth knowing):

- **Primitiv Studio** (primitiv.studio) — a branding/design studio.
  *Adjacent to our field*, so the most relevant for confusion.
- **Primitiv Group** — cannabis research company, established US brand.
- **HARMONI INC.** — US trademarks (~2020), fruit-juice goods. Plus the
  generic "harmony" field is crowded.

No specific brand surfaced using either of our two **device marks** — a
triangle sliced into parallel diagonal bands (Primitiv), or three
nested/concentric triangles (Harmoni) — but bare geometric triangles are
a crowded category, so lookalikes may exist that text search can't see.

## Still pending — the real clearance pass

Text search can't clear a visual mark. Before relying on either logo
commercially, run the **image / design-code** pass:

1. Export each mark to a clean PNG (white background, 512 + 1024px).
2. Reverse-image search: **Google Lens, TinEye, Yandex, Bing Visual**
   (different indexes — do all four).
3. Figurative-mark search by image upload: **EUIPO eSearch plus**,
   **WIPO Global Brand DB**; by design code on **USPTO** (Design Search
   Code **26.13** "triangles") and **Vienna code 26.3**.
4. Filter to the relevant Nice classes: **9** (software) and **42**
   (SaaS / software services).

This is DIY pre-filing diligence, **not** a legal opinion — for anything
to be registered or commercially relied upon, a trademark attorney runs
the proper availability search.
