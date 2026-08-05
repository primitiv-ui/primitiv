# Consumer testing materials

Operational materials for [RFC 0026](../rfcs/0026-consumer-testing-with-agent-personas.md)
(consumer testing with agent personas). Everything in this folder is either
handed verbatim to a building agent as its literal first message, or used
by the reviewer after a run — never both. Keep that split intact; it's what
keeps the building agent's experience honest (§15 of the RFC).

## Agent-facing (composed into the first message of a fresh, repo-free session)

- **[`brief.md`](brief.md)** — the shared client brief. Identical, word for
  word, across every profile. This is the control variable; never edit it
  per-run.
- **One profile addendum**, concatenated after `brief.md`:
  - [`profile-a-greenfield.md`](profile-a-greenfield.md) — empty Vite
    project, full styled registry (shadcn-style copy-in).
  - [`profile-b-brownfield.md`](profile-b-brownfield.md) — an existing
    React + Router app with its own legacy CSS (fixture:
    [`fixtures/profile-b-existing-app/`](fixtures/profile-b-existing-app/)),
    headless package only.
  - [`profile-c-tailwind.md`](profile-c-tailwind.md) — empty Vite +
    Tailwind project, registry styles + Tailwind or headless + Tailwind
    (the agent's call, logged either way).

To start a run: create a fresh, bare session per §14 of the RFC (no
`primitiv-ui/primitiv` source, no `CLAUDE.md`), then send
`brief.md`'s contents followed immediately by the chosen profile
addendum's contents as one message — script the concatenation, don't
retype it, so the shared portion stays byte-identical across profiles.
Profile B additionally needs its fixture directory copied into that
session before the agent starts (it is *given* the app, never asked to
scaffold it).

## Operator/reviewer-facing (never shown to the building agent)

- **[`report-template.md`](report-template.md)** — filled in after the run
  by a reviewer (a separate, fresh session with no knowledge of how the
  site was built), synthesising the agent's own `NOTES.md`, the
  screenshots it took, and the built site itself.
- **[`reviewer-prompt.md`](reviewer-prompt.md)** — the kickoff message for
  that reviewer session. Unlike the builder, the reviewer session *should*
  attach `primitiv-ui/primitiv` (it needs `ROADMAP.md`/RFC context to tag
  findings `known-gap` vs. `new-finding`) as well as the scratch repo. It
  renders the site cold and screenshots it itself *before* reading the
  builder's `NOTES.md`, so its first impression isn't primed by the
  builder's own account.

## Findings & fixes

- **[`findings-log.md`](findings-log.md)** — a running, append-only log of
  concrete engineering action items surfaced by each run, and their
  status. Lives only here (not mirrored to the scratch repo) since it
  tracks fixes landing in this codebase.

## Live operational copy

Everything here is mirrored at
[`github.com/simonrevill/primitiv-consumer-testing`](https://github.com/simonrevill/primitiv-consumer-testing)
(RFC 0026 §18) — the repo a bare, repo-free run session actually attaches
to (Profile B's fixture, plus any run's `runs/<profile>-<date>/` output:
the built site, `NOTES.md`, screenshots, and the reviewer's filled
`report-template.md`).

**This folder is the source of truth, not that repo.** Edit `brief.md` /
the profile addenda / `report-template.md` here first — they're versioned
alongside this RFC and reviewed the same way any other change in this repo
is — then re-push the updated copy to the scratch repo. Don't edit the
scratch repo's copy directly; it'll drift silently otherwise.

## Why the split

`brief.md` asks the building agent to keep an informal `NOTES.md` as
ordinary delivery hygiene — "note anything you did because the obvious
approach didn't work" — deliberately never framed as an evaluation
instrument. The formal categories (`known-gap` vs. `new-finding` tagging,
escape-hatch tallies, component-coverage counts) only exist in
`report-template.md`, which the building agent never sees. If the agent
saw the formal categories up front it would start performing for them
instead of building a website, which defeats the point (RFC 0026 §11.5).
