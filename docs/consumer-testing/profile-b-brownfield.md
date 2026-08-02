## Your starting point

This isn't a blank slate — you're joining an existing project. The client
already has a small React + React Router site (attached alongside this
brief) with a working nav, footer, and home page, built the way this team
has always built things: plain CSS classes, no build-time CSS framework.
Two more routes already exist as empty placeholders (`/services`,
`/about`) — that's where your two remaining pages go. Extend this project;
don't start a new one.

The existing code is deliberately unglamorous. Work with it as you find
it — you're free to restyle what you touch, but you don't need to rewrite
what already works. This app's existing primary brand colour is
`#c1440e`, used throughout the current nav, hero, and footer — keep that
in mind as you bring a new component library into a project that already
has an established look.

## Your toolkit, this time

For this project, only install Primitiv's plain component package (the
one with no bundled styles) via your package manager — not the styled,
copy-in surface. You're building the visual layer yourself, styled to fit
alongside what's already here. You'll still need the design tokens
themselves (colours, spacing, type scale, etc.) as CSS custom properties
to build against — check what the CLI offers for generating just that
layer, separate from any component styling.
