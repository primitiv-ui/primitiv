# EmptyState — Figma design, session handoff

Status as of 2026-08-04: headless compound is done; Figma design has not
started. This session was blocked the entire time on Figma write access
(see "Blocker" below) after settling the open design questions in chat.
Picking this up in a future session should start with re-verifying write
access, then go straight to building — the design decisions below are
pre-approved by the user, not open questions to re-litigate.

## What already exists

`packages/react/src/EmptyState` — headless compound, done, tested, documented:

- `EmptyState.Root` — `<div role="status">` (polite live region; opt out with
  `role={undefined}` for a static empty state)
- `EmptyState.Media` — `<div aria-hidden="true">`, decorative icon/illustration
  slot
- `EmptyState.Title` — `<p>`
- `EmptyState.Description` — `<p>`
- `EmptyState.Actions` — `<div>`, recovery-action grouping (buttons/links)

All parts stateless, optional, no `data-*` attributes — orientation/layout is
a pure presentation concern for Figma + registry CSS, not the headless layer.
`ROADMAP.md` confirms this is a genuine backlog gap (real anatomy, no Figma
yet), same class as Alert/Card before they landed.

**Alert is the structural precedent** — icon + title + description + action,
Context token family per size, a real Button instance for the action. Reuse
its conventions rather than inventing new ones where Alert already answers
the question.

## Design questions — settled in chat, ready to build from

Four open questions were raised, researched against Alert's real Figma
structure and the rest of the system, and approved by the user. Treat these
as decided; only revisit if something looks visually wrong once actually
rendered.

1. **Max-inline-size cap** — yes, needed, so text doesn't stretch full-width
   in a wide/filled container. New Context token family
   `empty-state/{size}/max-inline-size` (doesn't reuse anything existing —
   nothing else in the system caps a text column). No concrete pixel values
   chosen yet — derive and verify visually per size × density when building
   (rough starting shape: smaller end ~240, larger end ~480, to be tuned
   against real text, not treated as final).

2. **Icon size vs. title font-size** — proportional, but via a **new** token
   family, not a reuse of `framed-control/{size}/icon-size`. That family is
   sized for control icons (~16–24px) — too small for an empty-state
   illustration. Precedent for adding a dedicated family instead of forcing a
   reuse: Alert didn't reuse `framed-control/{size}/icon-size` either where
   fit was wrong — it added `alert/{size}/icon-offset-top` alongside it.
   Propose `empty-state/{size}/media-size`, roughly 2–3× the framed-control
   icon scale (rough shape: xs ~32 → xl ~80, tune when building).

3. **Gap rhythm** — **graduated**, not a single uniform gap token. Direct
   precedent, confirmed by inspecting Alert's real live structure via
   `figma_execute` this session: Alert's outer row uses `itemSpacing: 8`
   between Icon Wrapper / Content / Dismiss (distinct regions), but only
   `itemSpacing: 4` between Title and Description inside Content (a tightly
   related pair). Apply the same logic to EmptyState: tight gap
   title→description, larger gap media→title and description→actions.

4. **Vertical direction, multiple actions** — **hug, not stretch**, laid out
   as a horizontal row, centered — regardless of the Root's own Direction
   (horizontal vs. vertical) axis. No precedent anywhere in the system for
   full-width stretched buttons: Card's Footer (Justification axis) and
   Modal/ConfirmDialog's Footer both hug button content and never stretch to
   fill width.

## Proposed Figma structure (not yet built)

One composed `EmptyState` component set:

- Axes: **Size** (xs–xl, md default) × **Direction** (horizontal default |
  vertical)
- `Show media` / `Show actions` booleans
- `Title` / `Description` TEXT properties
- `Media` as an INSTANCE_SWAP defaulting to an Icon placeholder
- `Actions` as a genuine multi-child **SLOT** (preferredValues: Button),
  built via `figma_execute` plugin-API scripting the same way Dropdown's
  Panel slot was built — the dedicated slot MCP tools
  (`figma_add_slot_property` etc.) stay permanently blocked
  (`MCP error -32003`), same failure code as this session's blocker below,
  but that's a separate, already-known limitation, not the same bug.
- Root: vertical auto-layout, `primaryAxisAlignItems` /
  `counterAxisAlignItems` both `CENTER`, meant to be set to Fill container on
  both axes by consumers (the "grows to fill empty space" requirement).

Build it the same way Alert was built: real Icon/Button instances, Context
tokens bound via `setBoundVariable`, not literals.

## Reference IDs gathered this session (Primitiv Design System file)

File key: `1Nh5ffky0lYEw0MzXoqQVy`

| What | Node ID | Notes |
| --- | --- | --- |
| Button component set | `347:14161` | 125 variants. Props: `Leading Icon`/`Trailing Icon` (BOOLEAN), `Label` (TEXT), `Leading Icon Instance`/`Trailing Icon Instance` (INSTANCE_SWAP → Icon set), `Variant` (primary/secondary/link/danger/ghost), `Size` (xs/sm/**md**/lg/xl), `State` (default/hover/active/focus/disabled) |
| Icon component set | `153:1754` | 225 variants. Props: `icon` (variant, ~40 names e.g. search/folder/mail/inbox-adjacent), `size` (xs/sm/**md**/lg/xl) |
| Alert component set | `1400:33113` | 20 variants (Tone × Size). Structural precedent — see below |
| "Button" page | `144:22` | |
| "Icons" page | `153:1753` | |
| "Alert" page | `1400:32926` | |
| Context variable collection | `VariableCollectionId:369:31958` | Modes: Comfortable (`369:10`, default) / Compact (`369:9`) / Spacious (`369:11`) / Dense (`369:8`) |

Alert's real structure (walked via `figma_execute`, `Tone=info, Size=md`
variant), the template to mirror for EmptyState:

```
Alert (HORIZONTAL, padding [12,16,12,16] bound to alert/{size}/padding-block
       + framed-control/{size}/padding-inline, itemSpacing 8 bound to
       framed-control/{size}/gap, fill/stroke bound to feedback/{tone}/soft/*)
├─ Icon Wrapper (VERTICAL, paddingTop bound to alert/{size}/icon-offset-top
│  │             — optical alignment against the title's cap-height)
│  └─ Icon (INSTANCE, size bound)
├─ Content (VERTICAL, itemSpacing 4 — tight, no bound variable, just a
│  │        literal — title/description are read as one visual unit)
│  ├─ Title (TEXT, label/{size}/*, Khand SemiBold)
│  └─ Description (TEXT, body/{size}/*, Asta Sans Regular)
└─ Dismiss (detached Icon Button ghost/{size}/default instance, rebound
             per-Tone to feedback/{tone}/soft/foreground)
```

## Registry-phase open question (deferred, not yet decided)

For the `Actions` slot, two options were raised and not yet chosen:

- (a) re-export the registry Button as an aliased "Action Button"
- (b) let the consumer compose the real registry Button directly as children
  (no wrapper) — **currently the leaning choice**, since Actions holds
  arbitrary, open-ended controls unlike ConfirmDialog's fixed Confirm/Cancel
  pair, similar to how Card's Footer treats its buttons.

Whichever is picked, verify the `text-box-trim` styling still works
correctly — same class of bug already fixed once on Avatar's fallback label.
This is a registry-build-time check, not a Figma concern — decide it when
building the registry component, not before.

## Blocker: Figma write access

**Both write-capable Figma paths were down for the entire second half of
this session**, blocking any actual Figma building:

- Desktop Bridge (`mcp__…__figma_execute`, the Figma Console MCP server)
- The official Figma MCP server's `use_figma` tool

Both return `MCP error -32003: MCP tool call requires approval` on every
call, consistently. Read-only tools on both servers work fine throughout
(`whoami`, `get_metadata`, `figma_get_file_data` all succeeded) — this is
specific to write/code-execution calls.

**Notably, the bridge did work at the very start of this session** —
several `figma_execute` calls succeeded (inspecting Alert's live structure,
Context variable values, Button/Icon component property definitions — the
material this doc is built from). The failure began at the exact point an
unrelated session interruption caused the MCP servers to reconnect under new
instance IDs, and it persisted through every subsequent reconnect.

Troubleshooting tried this session, all unsuccessful:

- Re-pairing the Desktop Bridge plugin with a fresh code, four separate
  times across the session
- A full quit-and-reopen of the plugin (not just toggling Cloud Mode)
- Checking for a separate approval/activity-log tab in the plugin UI,
  distinct from the Cloud Mode connect toggle (none exists)
- Checking connector settings (user confirmed these looked fine)
- Reconnecting the Figma tools at the Claude account level

None of these cleared the error. The failure is identical across two
independent servers (Desktop Bridge and the official Figma MCP), which rules
out a Figma-plugin-side pairing problem specifically — it points to a
permission/scope issue sitting above the plugin layer (most likely a
workspace or connector write-scope restriction), not something fixable via
pairing, restarting the plugin, or account-level reconnects.

**A future session should not assume a fresh session clears this** — that
was the expectation carried in from the *previous* session too, and it
didn't hold: the fresh session here worked briefly, then broke again after a
routine reconnect and stayed broken. Verify with a trivial write call (e.g.
`figma_execute` returning `figma.currentPage.name`) before doing anything
else, exactly as this session's own opening steps intended.

## Next steps for a future session

1. Verify both `figma_execute` and `use_figma` actually execute a trivial
   write/read call before assuming anything is fixed.
2. If working: create an "EmptyState — exploration" page (doesn't exist
   yet) and build the four settled decisions above out visually, using
   Alert's real structure as the template. These are pre-approved — build
   first, only escalate back to the user if something looks visually wrong
   once rendered.
3. Build the real composed `EmptyState` component set per "Proposed Figma
   structure" above.
4. Write component descriptions (mandatory last step — see the
   `figma-component-descriptions` skill).
5. Build the registry styling + kitchen-sink example. Decide the deferred
   Actions-slot question (§ above) during this stage; verify `text-box-trim`.
6. Only once EmptyState is fully done (test/JSDoc/README + registry +
   kitchen-sink + roadmap tick, per CLAUDE.md's definition of done) — move to
   MillerColumns. Process for that is to be discussed with the user at that
   point; do not start it speculatively.
