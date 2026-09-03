# Start Here — copy and illustration briefs

> **Status:** Draft for review, 2026-09-02. Written to
> [`voice-and-tone.md`](./voice-and-tone.md); page defined in
> [`docs-site-content-plan.md`](./docs-site-content-plan.md) §3.1.
> **Brief schema:** defined once in
> [`docs-site-home-copy.md`](./docs-site-home-copy.md). Same fifteen fields.
> **Route:** `/start-here` — absorbs the dead `/#installation` anchor.

---

## What this page is for

**Argument:** here is the whole thing in five minutes, and here is which
door is yours.

It is the page a reader lands on after the home page has convinced them,
and the page a colleague is sent to with "have a look at this". It must
work for someone who has read nothing else.

**It is not a tutorial.** `docs-site-planning.md` §1.3 rejected an
onboarding quiz for a technical audience that reads fine, and the same
logic applies to a step-by-step course. State the paths, let them pick.

---

# Section 1 — What Primitiv is

**Heading** — `heading/h1`: `Start here`

**Lede** — `body/lg`:

> Primitiv is a design system you can take in three different ways: as
> accessible behaviour with no styling, as finished components copied
> into your project, or as a Figma library. All three are built from one
> set of design tokens, so they agree with each other.

**Body** — `body/md`:

> There are 63 components. Every interactive one follows its WAI-ARIA
> pattern, with full keyboard support. The colour palette is generated
> rather than picked, so its contrast is correct by construction. And
> the whole system scales between four density settings, which is what
> lets one set of components suit a dense dashboard and a roomy
> marketing page.

---

# Section 2 — Which path is yours

**Heading** — `heading/h2`: `Which path is yours`

**Body** — `body/md`:

> Three ways in. You are not locked into the one you pick, and most
> teams end up using two.

Three blocks, each an `heading/h4` question and a `body/md` answer:

> **You already have a design system, and want the behaviour.**
> Install `@primitiv-ui/react`. You get the keyboard handling, focus
> management and ARIA, with no styling to override. Your existing look
> stays exactly as it is.

> **You want components that already look finished.**
> Use the CLI. `primitiv add button` copies a styled component into your
> project as a file you own and can edit. This is the path most people
> want, and it is the default the docs assume.

> **You are designing rather than building.**
> Open the Figma library. It has the same components, built from the same
> tokens as the code, so what you draw is what gets built.

```yaml
id: START-01
type: diagram
placement: >
  Directly beneath the three blocks, full content width.

rhetorical-job: >
  Answer "which one am I?" in a glance, for a reader who has just read
  three paragraphs and is not sure any of them described them. A short
  decision aid does what the rejected quiz would have done, without
  asking anyone to answer questions.

composition:
  - A single horizontal band split into three routes, read left to right.
  - Each route opens with a question, then resolves to a path name and
    its one command.
  - The questions are the entry points and should be visually dominant.
    The path names are the answer, quieter.
  - No flowchart diamonds, no arrows doubling back. This is three
    parallel routes, not a decision tree with branches.

contents:
  - "Route 1 - question: 'Already have your own styling?' -> HEADLESS ->
    npm install @primitiv-ui/react"
  - "Route 2 - question: 'Want it to look finished out of the box?' ->
    STYLED -> npx primitiv add button"
  - "Route 3 - question: 'Designing, not building yet?' -> FIGMA ->
    Open the library"
  - "A single line beneath all three: 'You can change your mind. The
    styled path is the headless path with a stylesheet on top.'"

assets:
  - Pure diagram. Type and spacing from the system.
  - Commands set in the mono face, not in a code block - a block here
    would add three framed boxes to a diagram that wants to stay light.

tokens:
  questions: heading/h5, content/primary
  path-names: overline, content/secondary
  commands: the mono face at font-size/13, content/muted
  route-separators: border/subtle at 1px
  closing-line: body/sm, content/muted
  route-gap: space/space-32

frame:
  ratio: "4:1"
  width: full content width
  below-48rem: stack the three routes vertically, separators become horizontal

themes:
  light: as described
  dark: same, dark values

alt: >
  Three routes into Primitiv. If you already have your own styling, take
  the headless path. If you want it to look finished, use the CLI. If you
  are designing, open the Figma library.

must-not:
  - Draw it as a flowchart with decision diamonds. Three parallel routes,
    not a tree.
  - Rank the paths, or make the styled route visually dominant because it
    is the default. A headless reader must not feel they chose the lesser
    option.
  - Add a fourth route for a future framework.

craft-notes:
  - The closing line is doing important work. The biggest hesitation at
    this point is fear of picking wrong, and one sentence removes it.
  - Leading with the QUESTION rather than the path name is what makes
    this a decision aid rather than a menu. A reader recognises
    themselves in a question; they have to translate a label.
```

---

# Section 3 — Install it

**Heading** — `heading/h2`: `Install it`

**Body** — `body/md`:

> The fastest way in is a new project with everything already wired up:

```
npm create primitiv-ui@latest
```

> To add it to an app you already have:

```
npm i -D primitiv-ui
npx primitiv add button
```

> That second command does the whole setup the first time you run it. It
> installs what it needs, writes a `primitiv.json` config, generates your
> token layer, and copies the Button component into your project.

> If you only want the headless components, skip the CLI:

```
npm i @primitiv-ui/react
```

**Callout** — an `Alert` at `info` tone:

> The CLI runs a small native binary, so it will not work in StackBlitz
> or other in-browser Node environments. Use a local machine, a
> Codespace, or Docker.

Every command block carries the **npm / pnpm / yarn / bun** tabs, per
`docs-site-planning.md` §1.18.

---

# Section 4 — Your first component

**Heading** — `heading/h2`: `Your first component`

**Body** — `body/md`:

> After `primitiv add button`, you have a real file at
> `src/components/button.tsx`. Import it like anything else you wrote:

```tsx
import { Button } from "@/components/button";

export function Save() {
  return <Button onClick={save}>Save changes</Button>;
}
```

> Open that file. It is ordinary code, and it is yours. Change the
> padding, add a variant, delete a prop you will never use. Nothing
> upstream will overwrite it.

**Second block:**

> The headless version is the same component without the styling:

```tsx
import { Button } from "@primitiv-ui/react";
```

> Same behaviour, same accessibility, no CSS. You bring the look.

---

# Section 5 — Where to go next

**Heading** — `heading/h2`: `Where to go next`

A `DescriptionList`, each term linking:

> **Components** — All 63, with live examples and props.
> **Tokens and theming** — How to change colours, spacing and type.
> **Density** — The four modes, and how to scope them.
> **Composition** — The handful of patterns every component shares.
> **Accessibility** — What we guarantee, and what stays yours.
> **The registry and CLI** — Every command, and why it works this way.
> **Design in Figma** — The library, and how it stays in step.

No illustration. A list of doors does not need a picture of doors.

---

## Notes for review

1. **One illustration only.** This page is short by design and its job is
   to route people onward quickly. More artwork would slow the one page
   that should not be slow.
2. **The install section states what `primitiv add` does on first run**
   because the behaviour genuinely surprises people: a single `add`
   command bootstraps config, tokens and wiring. Burying that makes the
   CLI feel like it did something unrequested.
3. **Section 4 ends on the headless equivalent** so a reader who took the
   styled path still sees what the other one looks like. It costs four
   lines and closes the "what did I not choose?" loop.
4. **The 63 figure is verified** against `registry/registry.json` and
   `roster.json`. Note that `README.md` currently says 62 in two places
   and 48 icons where there are 50 — that drift is a separate finding,
   recorded in the content plan.
