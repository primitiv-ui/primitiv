---
name: new-react-component
description: Step-by-step playbook for scaffolding a new headless component in packages/react following the proven layout used by Tabs/Accordion/Carousel/etc. Use to start a new component cycle from scratch — produces only the RED state (failing tests + empty modules), then hands control back for the human-driven green/docs cycle. TRIGGER when the user says "scaffold X", "new component", "add a Y component to packages/react", or starts a cycle for a component that does not yet exist. SKIP for changes to an existing component.
---

# New React component

This skill is the playbook for the **scaffold step** only. It stops at
the RED commit. Implementation (green) and JSDoc + README + package
table row (docs) are the next two commits in the human cycle — see
the top-level CLAUDE.md for the cycle rules.

## Before you scaffold

Read these first (one read each, not re-read every turn):

- `_generated/component-inventory.md` — what already exists. Identify
  the closest analogue (compound? single? roving tabindex?
  controllable?) and mirror its file shape.
- `_generated/shared-hooks.md` — the hooks you'll reuse.
- `_generated/shared-utils.md` — `createStrictContext`, `deriveId`,
  `getKeyToActionMap`.
- `_generated/test-file-taxonomy.md` — name your test files from this
  list when possible; only invent a new suffix if no existing one
  fits.
- `_generated/slot-contract.md` — only if the component will support
  `asChild`.

For deep pattern reference (Slot, controllable state, roving
tabindex, data-* surface, ref-as-prop), load the
`react-component-patterns` skill.

For test layout, userEvent gotchas, fixture conventions, load the
`react-test-conventions` skill.

## File layout to produce

Always at minimum:

```
packages/react/src/<Component>/
├── <Component>.tsx              # sub-components all live in this file
├── types.ts                     # all interfaces and prop types
├── index.ts                     # 3-line re-export
└── __tests__/
    └── <Component>.basic-rendering.test.tsx
```

Add when the component is compound / has shared state:

```
├── <Component>Context.ts        # createStrictContext pair
├── hooks/
│   ├── index.ts
│   ├── use<Component>Root.ts    # state owner
│   ├── use<Component>Context.ts # strict consumer hook re-export
│   ├── use<Component>Trigger.ts # per-item hook (if applicable)
│   └── use<Component>Content.ts # panel hook (if applicable)
```

Add when the component has helpers that don't fit in `<Component>.tsx`:

```
└── utils.ts
```

## The RED commit shape

The scaffold lands as a single RED commit. It contains:

- All the module files above, deliberately empty or stubbed so they
  fail to compile / fail to render. Stubs must not export anything
  real — an empty `export {}` is fine.
- One failing test: `<Component>.basic-rendering.test.tsx` that
  imports `<Component>` from `../<Component>` and asserts something
  trivial (e.g. it renders with `role="..."`). The import alone will
  produce a module-not-found or compile failure — that's RED.
- Commit message: `test(<component>): red — scaffold + initial render`,
  body is one short sentence, footer is the session-id URL.

Do NOT include any implementation in this commit. Do NOT include
JSDoc, README, or a package-level table row — those land in the
docs commit later.

## Verify RED before committing

```sh
pnpm --filter @primitiv-ui/react exec vitest run src/<Component>
```

The run should fail with a module-not-found, a compile error, or an
assertion failure on the trivial render test. If it passes, the
scaffold is wrong — fix it before committing.

## After the RED commit

Hand control back to the user. They will:

1. Add a single failing assertion for a specific behaviour
   (`<Component>.<concern>.test.tsx`) — still RED.
2. Implement the minimum to make it pass — GREEN.
3. Update JSDoc + per-component README + `packages/react/README.md`
   components table — DOCS.

This skill does not run those steps.

## Don't

- Don't scaffold more files than the component needs. If it's not
  compound, don't generate the `hooks/` directory.
- Don't pre-populate types with speculative props ("might need
  these later"). Add types as features land.
- Don't write a multi-test scaffold. One failing test is enough to
  establish RED.
- Don't add the component to `packages/react/README.md` until the
  docs commit at the end of the first real feature cycle.
