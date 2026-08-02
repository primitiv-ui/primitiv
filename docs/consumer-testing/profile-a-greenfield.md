## Your starting point

Nothing exists yet. Scaffold a fresh Vite + React + TypeScript project
yourself (`npm create vite@latest`, or your preferred equivalent) and set
up Primitiv from there — you're free to use its styled components as-is,
and to modify the copied styles however you like once they're in your own
project; that's the point of a copy-in component library rather than a
compiled black box.

## Brand

Your client has one hard requirement: their brand colour is `#0a7755`.
Make sure the site actually reflects it. Before you start hand-picking
individual shades yourself, check what your tooling offers for setting a
project-wide brand colour — it would be surprising for a component library
this size not to have *some* answer for "generate a theme from one colour."

Once you've set it up, give the site's light/dark toggle (if the library's
theming produces one) at least one real check — you don't need to build a
whole preference-switching UI, but confirm the dark-mode result looks
right before you move on, not just the light one.
