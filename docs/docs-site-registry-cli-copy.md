# The registry and CLI — copy and illustration briefs

> **Status:** Draft for review, 2026-09-02. Written to
> [`voice-and-tone.md`](./voice-and-tone.md); page defined in
> [`docs-site-content-plan.md`](./docs-site-content-plan.md) §3.7.
> **Brief schema:** defined once in
> [`docs-site-home-copy.md`](./docs-site-home-copy.md).
> **Route:** `/registry-cli` — absorbs the dead `/#cli`, `/#cli-add` and
> `/#cli-tokens` anchors.

---

## What this page is for

**Argument:** here is how the code gets into your project, every command
that does it, and why it works this way rather than as a package.

Component pages already carry their own install command, so this page is
not where someone finds out how to add a Button. It is the deep dive: the
config file, the lock file, the commands that are not `add`, and the
reasoning a technical evaluator will want before they commit.

---

# Section 1 — The idea

**Heading** — `heading/h1`: `The registry and CLI`

**Lede** — `body/lg`:

> Styled components are not installed. They are copied into your project
> as files you own, edit and commit. The registry is the catalogue they
> are copied from, and the CLI does the copying.

**Body** — `body/md`:

> This is a deliberate trade. A package is easier to update and harder to
> change. A copied file is the reverse: nothing upstream will overwrite
> it, and nothing upstream will fix it for you either. For the styling
> layer that is the right way round, because styling is the part you most
> want to change and least want changed under you.

**Second block:**

> Behaviour goes the other way. That still comes from
> `@primitiv-ui/react` as a normal dependency, so you get fixes to
> keyboard handling and accessibility without merging anything. You own
> the appearance. You do not have to own the hard part.

```yaml
id: CLI-01
type: diagram
placement: >
  Directly beneath the two opening blocks, full content width.

rhetorical-job: >
  Show the split. "Copy the styling, depend on the behaviour" is the
  central design decision of the whole distribution model, and it is the
  thing readers coming from either a pure package or a pure copy-in
  library get wrong. One picture settles it.

composition:
  - Two vertical zones separated by a clear boundary - "your repository"
    on the left, "installed from npm" on the right.
  - Files appear in the left zone as document shapes; the package appears
    in the right zone as a single block.
  - One connector runs from the package into the copied file, labelled
    with what flows along it.
  - The left zone should be visibly larger, because that is where the
    reader's attention belongs.

contents:
  - "Left zone, headed 'Your repository' - three document shapes:
    button.tsx, button.recipe.ts, styles/primitiv/button.css. Beneath
    them, two more: primitiv.json, primitiv.lock."
  - "A small note under the left zone: 'Committed. Yours to edit.'"
  - "Right zone, headed 'Installed from npm' - one block:
    @primitiv-ui/react. A small note beneath: 'Updates normally.'"
  - "One connector from the package to button.tsx, labelled 'behaviour,
    keyboard, ARIA'."
  - "One sentence beneath the whole diagram: 'The styling is a copy. The
    behaviour is a dependency.'"

assets:
  - Real file names, exactly as the CLI writes them.
  - Pure diagram otherwise.

tokens:
  zone-boundary: border/strong at 1px
  repo-zone: surface/subtle
  npm-zone: surface/default
  file-shapes: surface/raised with border/default
  file-names: the mono face at font-size/12
  zone-headings: label/md, content/primary
  notes: body/sm, content/muted
  connector: border/default at 1px

frame:
  ratio: "2:1"
  width: full content width
  below-48rem: stack the zones vertically, repository above npm

themes:
  light: as described
  dark: same, dark values

alt: >
  A diagram showing which parts live where. The component file, its
  recipe, its stylesheet and the config and lock files sit in your
  repository. The headless package is installed from npm and supplies the
  behaviour, keyboard handling and ARIA.

must-not:
  - Draw arrows in both directions. Nothing flows back to npm, and a
    two-way arrow implies a sync relationship that does not exist.
  - Show the registry itself as a third zone. It is where the files came
    from once, not somewhere they stay connected to.
  - Omit primitiv.json and primitiv.lock. They are the two files readers
    are most surprised to find, and the diagram is where that surprise
    should happen.

craft-notes:
  - The size difference between the zones is a quiet argument: most of
    what you get is yours.
  - Labelling the connector with what actually flows (behaviour, keyboard,
    ARIA) is what stops a reader assuming the package supplies styling.
```

---

# Section 2 — The commands

**Heading** — `heading/h2`: `The commands`

**Body** — `body/md`:

> Five commands. Most days you only use one.

### `primitiv add`

> Copies one or more components into your project.

```
npx primitiv add button
npx primitiv add button select modal
```

> On its first run in a project it also does the setup: installs what it
> needs, writes `primitiv.json`, generates your token layer, and wires the
> stylesheet import. That is intentional, so a new project is one command
> rather than four.

> Useful flags:
> `--force` overwrites files you have changed, without asking.
> `--styles-only` copies the stylesheet and skips the React file.
> `--no-wiring` skips the project wiring, if you prefer to do it yourself.
> `--dry-run` shows what would happen and writes nothing.

### `primitiv init`

> Sets a project up without adding a component. It asks a few questions,
> or takes `--yes` to accept the defaults, and finishes by generating the
> token layer.

```
npx primitiv init
npx primitiv init --yes
```

### `primitiv tokens`

> Regenerates your token layer in the format your config asks for.

```
npx primitiv tokens
npx primitiv tokens --format scss
```

### `primitiv theme`

> Generates a full light and dark palette from one brand colour, with
> every semantic role assigned by contrast.

```
npx primitiv theme --brand "#0a7755"
```

> It writes into its own layer, so it beats the base tokens without
> editing them.

### `primitiv list`

> Shows what is installable, and what you already have.

```
npx primitiv list
npx primitiv list --json
```

---

# Section 3 — The two files

**Heading** — `heading/h2`: `The two files`

**Body** — `body/md`:

> The CLI keeps two files in your project. Both are meant to be
> committed.

**`primitiv.json` — your settings.**

```json
{
  "version": 1,
  "framework": "react",
  "styles": { "enabled": true, "format": "css", "path": "src/styles/primitiv" },
  "tokens": { "format": "css", "path": "src/styles/primitiv/tokens.css" },
  "theme": { "brand": "#0a7755" },
  "aliases": {},
  "registry": { "version": "0.1.0" }
}
```

> Edit it freely. It decides where files land, which format your tokens
> emit in, and which registry version you are pulling from.

**`primitiv.lock` — what you have.**

> A list of the components you have added and a hash of every file. The
> CLI uses it to tell whether you have edited a copied file, so it can
> ask before overwriting your work rather than assuming.

**Callout** — an `Alert` at `info` tone:

> If you edit a copied component and later run `add` for it again, the
> CLI notices and asks. Answering "keep" leaves your version alone. This
> is the whole reason the lock file exists.

---

# Section 4 — Where components come from

**Heading** — `heading/h2`: `Where components come from`

**Body** — `body/md`:

> By default the CLI carries the registry inside itself, so `add` works
> with no network call and no version drift between the tool and the
> catalogue.

> You can point it somewhere else. `--registry` takes a local path, for
> a private registry of your own components, or a URL, to pull a
> specific published version.

```
npx primitiv add button --registry ./my-registry
npx primitiv add button --registry 0.1.0
```

**Second block:**

> One consequence worth knowing: because the registry is baked into the
> binary, a change to a component reaches you when a new CLI version is
> published, not before. If a component looks out of date, update the
> CLI.

---

# Section 5 — Why a registry rather than a package

**Heading** — `heading/h2`: `Why a registry rather than a package`

**Body** — `body/md`:

> The honest answer is that it depends what you are optimising for, and
> this model optimises for change.

> A styled component is where your product's personality lives. You will
> want to adjust its padding, add a variant your designer invented, or
> strip a prop you never use. In a package, each of those is a
> configuration API someone has to design, or an override that fights the
> library. As a file, each is an edit.

**Second block — when a package would be better** — `body/md`:

> If you want the styling to update automatically and you never intend to
> change it, a package would serve you better, and it is fair to say so.
> Primitiv's answer for that case is the headless package plus your own
> stylesheet, which updates normally and never surprises you.

**Links:** `Composition →` · `Tokens and theming →` ·
`Browse components →`

---

## Notes for review

1. **One illustration.** The page is mostly reference, and reference
   wants tables and code rather than pictures. The single diagram earns
   its place because the copy-versus-depend split is the one idea a
   reader must not get wrong.
2. **Section 5 names a case where Primitiv is the wrong choice.** That is
   deliberate. An evaluator who has already thought of the objection
   trusts a page that raises it, and the answer costs nothing to give.
3. **The `primitiv.json` shown is real** — taken from
   `apps/docs-site/primitiv.json`, with the `$schema` line dropped for
   readability. Regenerate it from the real file before publishing rather
   than copying from here.
4. **The flag list is deliberately partial.** `add` accepts more than
   four flags; these are the four a reader will actually reach for. A
   complete reference belongs in `--help`, not on a page someone is
   reading to understand the model.
5. **The embedded-registry consequence in section 4 is a real gotcha**
   recorded in the root `CLAUDE.md`, and this is the only reader-facing
   place it gets explained. Worth keeping even though it exposes an
   implementation detail.
