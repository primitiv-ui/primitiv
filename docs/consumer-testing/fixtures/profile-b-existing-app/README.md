# Northfield & Co. (fixture)

The starting point for **Profile B** of
[RFC 0026](../../../rfcs/0026-consumer-testing-with-agent-personas.md)'s
consumer-testing program. This is *not* a real project — it's a small,
deliberately unglamorous pre-existing React + React Router app, standing
in for "a project the building agent is joining, not creating."

## What's real about it

- A working nav, footer, and one fully-built, fully-styled home page.
- Two stub routes (`/services`, `/about`) waiting to be built out — these
  become the building agent's second and third pages.
- Plain, unlayered CSS (`src/styles/legacy.css`): hardcoded hex/px values,
  a loose BEM-ish naming convention, no cascade layers, no design tokens.
  This is what "an existing house style" looks like from the outside —
  the brownfield collision this profile exists to surface (cascade-layer
  interaction, class-name collisions, resets fighting each other) only
  happens if there's real legacy CSS to collide with.
- A baked-in brand colour, `#c1440e`, used throughout the nav/hero/footer
  — stated as fact in `profile-b-brownfield.md`, deliberately not offered
  as something to feed into Primitiv's own theming. Whether the building
  agent tries to reconcile the two brand colours or leaves them separate
  is one of the things this run is meant to observe.

## Using it

Not run or built as part of this repo — it's a template. Copy this
directory into the bare, repo-free environment a Profile B run happens in
(§14 of RFC 0026) before the building agent starts; it should never see
`primitiv-ui/primitiv`'s own source, only this standalone app.

```sh
npm install
npm run dev
```
