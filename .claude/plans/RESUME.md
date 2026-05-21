# Figma integration — session resume brief

Read this first if you're picking this work up cold. The full,
approved plan is in `.claude/plans/figma-integration.md` — read
that immediately after this brief.

## TL;DR

We're integrating Primitiv with a Figma design system file. The
plan is approved. We were on **Phase A** (verify the MCP can read
the file) when the cloud session needed to restart so a new
network-allowlist entry (`api.figma.com`) could take effect.

## What's already done

- **Plan approved** — see `.claude/plans/figma-integration.md`.
- **MCP wiring committed** — `.mcp.json` at the repo root declares
  the `figma-developer-mcp` server, env-var-driven (`FIGMA_API_KEY`,
  `FIGMA_FILE_KEY`).
- **Cloud environment configured** — `FIGMA_API_KEY` and
  `FIGMA_FILE_KEY=1Nh5ffky0lYEw0MzXoqQVy` set as env vars; network
  access set to **Custom** with `api.figma.com` added to the
  Allowed domains list.
- **MCP tools registered** — `mcp__figma__get_figma_data` and
  `mcp__figma__download_figma_images` are available in fresh
  sessions.

## What you need to do first (Phase A smoke test)

1. Run `mcp__figma__get_figma_data` with:
   - `fileKey: "1Nh5ffky0lYEw0MzXoqQVy"`
   - `nodeId: "129:1207"`
2. Confirm a non-error response — pages, components, styles, etc.
3. Briefly report back: number of pages, components, styles
   visible; whether the response surfaces any information about
   Variables / Variable Collections (it probably won't on Starter
   — variables come via the plugin in Phase A step 4).

## Important finding from screenshots (not yet folded into the plan)

The user provided screenshots of the Variables panel. **Typography
is not one collection — it is three**:

- `Typography / Compact` (60 vars)
- `Typography / Comfortable` (60 vars)
- `Typography / Spacious` (60 vars)

All three have the same internal shape:
`{display,heading,body,label,button} / <step> / {font-family,font-weight,font-size,line-height}`.
Each variable aliases a Primitive (e.g. `font-size/40`,
`font-family/sans`).

**Implication for Phase C**: the idiomatic Semantic design is a
single Semantic collection with **three modes** (Compact /
Comfortable / Spacious), not three sub-groups. The migration
collapses three collections into one collection × three modes.
Confirm with the user before encoding this in the plan — they
chose "I'll decide per-variable during migration" earlier, but
the three-collections discovery is new.

## What's blocked / waiting on the user

- Confirmation of the **exact name** for the new Semantic
  collection (`Semantic`? `Semantics`? `Tokens / Semantic`?).
- Confirmation of the modes-vs-subgroups question above.
- Decision on local-vs-cloud workflow for the sync server: the
  plugin runs in Figma desktop on the user's machine, so the
  `packages/tokens/src/server.ts` local dev server needs to run
  on their machine too — they'll need a local checkout, or we
  rely on the "Download JSON" manual mode for cloud-only work.

## Branch & repo state

- Branch: `claude/plan-figma-integration-RfB6H` (push here).
- Repo: `simonrevill/primitiv`.
- No untracked work expected on resume — both this brief and the
  plan should be committed before the session restart.

## What NOT to do

- Don't touch `apps/harmoni-figma-plugin/` — the new sync work
  lives in a **separate** plugin app called
  `apps/primitiv-sync-figma-plugin/` (not yet scaffolded).
- Don't start scaffolding without the user's "go" — they may
  want to interrogate the smoke-read results first.
- Don't paste the PAT anywhere; it's already wired via env vars.

## After the smoke test

If the smoke test succeeds:
1. Report the read back to the user.
2. Ask about the three-Typography-collections → modes question.
3. Ask whether to start scaffolding `apps/primitiv-sync-figma-plugin/`
   (Phase A step 1) or pursue further read-side verification.
