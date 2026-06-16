# @primitiv-ui/cli-darwin-arm64

The Primitiv UI CLI binary for **macOS Apple Silicon (arm64)** — one of the per-platform
packages behind the [`primitiv-ui`](https://www.npmjs.com/package/primitiv-ui)
command.

**You don't install this directly.** Install the `primitiv-ui` wrapper; it
lists every platform package as an `optionalDependency`, and your package
manager installs only the one matching your OS/CPU (`darwin` / `arm64`),
skipping the rest. The wrapper's launcher then resolves the binary from
whichever platform package landed and runs it.

```sh
npm i -D primitiv-ui
npx primitiv add button
```

If your platform isn't packaged, install from source instead:

```sh
cargo install primitiv-cli
```

Part of the [Primitiv](https://github.com/primitiv-ui/primitiv) design system.
