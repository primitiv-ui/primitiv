# Reserved npm names (placeholders)

Minimal placeholder packages whose only job is to **reserve the unscoped npm
names** the Primitiv CLI will use (RFC 0005, decisions D20 / D22):

- **`primitiv-ui`** — the CLI package (command: `primitiv`)
- **`create-primitiv-ui`** — the `npm create primitiv-ui` scaffold

The unscoped `primitiv` name is already taken (by an unrelated product, Primitiv
AI), and unscoped names are first-come — so these two are claimed ahead of the
real release. Each placeholder just prints a "coming soon" notice.

They sit **outside the pnpm workspace** (globs: `apps/*`, `packages/*`,
`crates/harmoni-wasm/pkg`), so the monorepo never installs, builds, or tests
them.

## Naming is independent of the GitHub org

The npm names (`@primitiv-ui`, `primitiv-ui`, `create-primitiv-ui`) are
**unrelated to the GitHub org**. Transferring the repo to the `primitiv-ui`
GitHub org changes no package name and requires no re-publish. The only
transfer-coupled field is a `repository` URL — deliberately omitted from these
placeholders, so they are transfer-proof.

## Publishing (to actually claim the names)

npm has no "reserve without publish" — you claim a name by publishing it once,
from the npm account that should own it.

### From a computer

```sh
npm login
( cd reserved/primitiv-ui        && npm publish )
( cd reserved/create-primitiv-ui && npm publish )
```

### From a phone (no computer until later)

You can't run `npm publish` in a normal mobile browser, but you can publish via
GitHub Actions — every step works from your phone's browser:

1. **npmjs.com** (mobile browser) → log in → *Access Tokens* → create a classic
   **Automation** token (it can create brand-new packages).
2. **GitHub** (mobile browser; use "Desktop site" if the menu is hidden) → repo
   *Settings* → *Secrets and variables* → *Actions* → add a secret
   `NPM_TOKEN` = that token.
3. **Actions** tab → run the **"Reserve npm names (placeholders)"** workflow
   (`.github/workflows/reserve-names.yml`).

(Android power users could instead run `npm publish` inside Termux; iOS via iSH.
The Actions route keeps the token out of a phone shell and is the recommended
way.)

Once the real CLI ships, these placeholders are replaced by the actual
`primitiv-ui` / `create-primitiv-ui` builds at a higher version.
