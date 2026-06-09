---
description: Scaffold a new headless component in packages/react following the proven layout. Produces only the RED commit (failing test + empty modules); the green and docs commits stay in the human cycle.
argument-hint: <ComponentName>
---

You are scaffolding a new headless component called `$ARGUMENTS`
under `packages/react/src/$ARGUMENTS/`.

This is the **RED commit only**. You do not write implementation,
JSDoc, README, or update `packages/react/README.md`. Those are the
green and docs commits, which are human-driven and not part of this
command.

## Steps

1. **Load the `new-react-component` skill** (Skill tool) and follow
   its playbook. The skill references the generated inventories
   under `.claude/skills/new-react-component/_generated/` — use
   them to decide whether this is a compound, single-element, or
   sub-component-family pattern.

2. **Confirm the component name** is PascalCase and not already
   taken: check `packages/react/src/` for an existing directory of
   the same name. If it exists, stop and tell the user.

3. **Produce the minimum file shape** per the skill's playbook.
   Default to a simple non-compound layout (no `hooks/`, no
   `<Component>Context.ts`); only generate the compound shape if
   the user's intent for the component clearly requires it. Ask
   one question if it's ambiguous.

4. **Add exactly one failing test** at
   `packages/react/src/$ARGUMENTS/__tests__/$ARGUMENTS.basic-rendering.test.tsx`
   that imports from `../$ARGUMENTS` and asserts something trivial
   (e.g. renders with an expected role). The import alone should
   produce a module-not-found / compile failure — that is the
   desired RED state.

5. **Run the scoped test** to verify RED:
   ```sh
   pnpm --filter @primitiv-ui/react exec vitest run src/$ARGUMENTS
   ```
   It must fail. If it passes, the scaffold is wrong — fix and
   re-run before committing.

6. **Stage and commit** with a HEREDOC:
   ```sh
   git add packages/react/src/$ARGUMENTS/
   git commit -m "$(cat <<'EOF'
   test($ARGUMENTS): red — scaffold + initial render

   <one-sentence body explaining the component>

   https://claude.ai/code/session_01VYpfEpqwigi3xdN8MKDiHL
   EOF
   )"
   ```

7. **Stop**. Do not write implementation. Do not write JSDoc. Do
   not write the per-component README. Do not touch
   `packages/react/README.md`. Tell the user the RED commit
   landed and remind them the next step is their own green commit
   for the first specific behaviour.

## Hard rules

- One commit only. RED. Nothing else.
- No speculative props or types ("might need this later").
- No multi-test scaffold — one failing render test is enough.
- Do not add the component to `packages/react/README.md` — the
  table row lands with the eventual docs commit.
- If the user asks you to keep going after the RED commit lands,
  treat that as a separate request and follow the strict TDD cycle
  from CLAUDE.md.
