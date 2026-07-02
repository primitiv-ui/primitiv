# Kitchen Sink

A real-consumer testbed for publishing. Every component the registry
carries, installed exactly as an external consumer would — via the
published `primitiv-ui` CLI and the published `@primitiv-ui/react` /
`@primitiv-ui/icons` npm packages — not via the monorepo's local
workspace source. If a release is broken, this app is where it shows up.

`App.tsx` imports every component only from `./components` (the styled
surface the CLI copied in) plus icons from `@primitiv-ui/icons`. Nothing
here imports `@primitiv-ui/react` directly — that would defeat the point.

## You do not need Rust installed

`primitiv-ui` ships a precompiled binary per platform via npm
`optionalDependencies` (see `RELEASING.md` §2). `pnpm install` downloads a
real compiled binary — there is no Rust toolchain involved on the
consumer side, ever. Rust is only needed by whoever *builds* the CLI
(a maintainer, or the `Publish packages` GitHub Actions workflow).

## Why this has its own `pnpm-workspace.yaml`

This app is deliberately excluded from the root `pnpm-workspace.yaml`
(`!apps/kitchen-sink`), so its dependencies resolve from the real
npm/JSR registries instead of being symlinked to the monorepo's local
`packages/react` source — that symlinking is exactly what would hide a
real publishing bug.

That exclusion has a sharp edge: **running `pnpm install` from inside
this directory with no other setup silently does nothing.** pnpm walks
up and finds the repo-root workspace, sees this directory excluded from
it, and no-ops instead of erroring — no `node_modules`, no lockfile, no
warning. The fix is this directory's own `pnpm-workspace.yaml`
(`packages: []`), which makes pnpm treat `apps/kitchen-sink` as its own
independent workspace root and stop walking further up. With that in
place, a plain `pnpm install` run from inside this directory works
exactly as you'd expect anywhere else.

## Updating to a new release

```sh
cd apps/kitchen-sink
pnpm install       # ^0.1.0 ranges always pick up the newest 0.1.x release
pnpm run update    # bump the packages, re-add every component, refresh tokens
```

`pnpm run update` is:

```sh
pnpm update @primitiv-ui/react @primitiv-ui/icons primitiv-ui && pnpm exec primitiv add --all --force && pnpm exec primitiv tokens
```

**The trailing `primitiv tokens` call is not redundant with `add --all
--force`.** `add`'s token-layer step (`ensure_tokens`) only *generates*
`src/styles/primitiv/tokens.css` if it's absent — it never regenerates an
existing one, even with `--force`. Since this app already has a
`tokens.css` from its initial setup, `add --all --force` alone would
refresh every component's styles/recipe/tsx file but silently skip the
token layer. The explicit `primitiv tokens` call is what unconditionally
overwrites it — drop it and a token-layer fix (like the one that
shipped in the PR that added this README) would never show up here.

**A maintainer verifying an unreleased fix locally** must bypass
`node_modules/.bin/primitiv` entirely — `pnpm exec primitiv` always
resolves to whatever's actually published and installed, so it cannot see
a local, not-yet-released source change. Build the CLI from source and
invoke it directly instead:

```sh
cargo build -p primitiv-cli
cd apps/kitchen-sink
/path/to/primitiv/target/debug/primitiv tokens   # or `add --all --force`
```

This is a maintainer-only step for pre-release verification — a normal
consumer (including this app's own `pnpm run update`, once a fix is
actually published) never needs it.

## How this differs from a normal Vite project using `primitiv-ui`

If you're setting up `primitiv-ui` in an ordinary Vite app *outside* this
monorepo (see `apps/docs/guide/cli.md`), none of the pnpm-workspace
gotchas above apply — there's no ambient monorepo workspace for pnpm to
walk up into, so `pnpm install`, `pnpm create primitiv-ui`, and
`pnpm dlx primitiv-ui@latest add <component>` all behave exactly as
documented, with no extra `pnpm-workspace.yaml` needed.

The other differences are deliberate, not gotchas:

- **Every registry component is installed** (`add --all`), not just the
  ones a real app would use — the point here is coverage, not a lean
  bundle.
- **The `^0.1.0` version ranges are loose on purpose**, so `pnpm install`
  always picks up the newest `0.1.x` release rather than staying pinned —
  this app is meant to be a moving target that tracks `main`'s latest
  publish, not a stable dependency snapshot.
- **The `update` script is specific to this app's role as a testbed.** A
  normal consumer project has no equivalent need to re-run `add --all
  --force` + `tokens` on every release; they add components once and
  update `@primitiv-ui/react`/`@primitiv-ui/icons` through their normal
  dependency-update process.
