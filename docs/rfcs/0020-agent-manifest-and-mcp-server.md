# RFC 0020 — Agent manifest & MCP server

> **Status:** Draft
> **Author:** simonrevill, with architectural drafting.
> **Date:** 2026-07-26
> **Prompted by:** Meta's Astryx (open-sourced 2026-06, MIT) — a design system
> built ground-up to be machine-readable: a `--json` manifest exposing a
> complete contract for every CLI command, plus an MCP server over the same
> data, so an agent queries a typed API instead of pattern-matching prose.
> **Builds on:** RFC 0004 (styling contract — `contract.json`), RFC 0005 (the
> CLI — §6 the registry, §6.5 stubs "(future) an MCP server wrapping the CLI"),
> RFC 0006 (token pipeline). Does not change any of them; it aggregates and
> exposes what they already produce.

---

## 1. Why this exists

Primitiv already does more agent-facing work than it gets credit for:
`contract.json` per component (root class, modifiers, `data-*` attributes,
`--primitiv-*` custom properties — RFC 0004 §3.4), a static `registry.json`
index, and every CLI command accepting `--json` for structured output (RFC
0005 §5). That's real machine-readability — it just isn't *aggregated* or
*self-describing*. An agent today has to already know the CLI's command
names and flags (there is no single call that enumerates them), fetch
`registry.json` and then a `contract.json` per component of interest
separately, and shell out to the CLI binary rather than call a typed tool.
None of `contract.json`, `primitiv.json`, or `registry.json`'s `$schema` URLs
(`https://primitiv-ui.dev/schema/*.json`) resolve to an actual file in this
repo — they're aspirational today.

Astryx's contribution isn't a new idea so much as naming the gap precisely:
a design system built for agents needs **one queryable, versioned artifact**
that describes the whole surface (commands, components, tokens), plus an
**MCP server** so a tool-preferring agent doesn't have to drive a shell at
all. RFC 0005 §6.5 already flagged the MCP server as a "future" bullet; this
RFC is that follow-through, plus the manifest command that should exist
alongside it.

## 2. Scope

In scope: a `primitiv manifest` command that aggregates the existing
machine-readable surfaces into one artifact; publishing real JSON Schema
files for `primitiv.json` / `registry.json` / `contract.json`; an MCP server
exposing the same data (and the safe subset of CLI actions) as typed tools.

Out of scope: changing the shape of `contract.json`, `registry.json`, or any
existing command's behaviour — this RFC is additive. Re-litigating the CLI
command surface (RFC 0005 §2) is out of scope; `manifest` describes that
surface, it doesn't change it.

## 3. `primitiv manifest`

A new command, config-less (Principle 4, RFC 0005 §1) — it needs no
`primitiv.json` and works from a fresh checkout:

```sh
primitiv manifest [--json]
```

Emits one aggregated document:

- **Commands** — every command (`init`, `add`, `tokens`, `theme`, `list`,
  `manifest` itself), its flags, argument shapes, exit codes, and a
  one-line description — the same information `--help` gives a human,
  structured for a parser instead of prose.
- **Registry** — the full `registry.json` index inlined, each entry carrying
  its `contract.json` inline rather than requiring a second fetch per
  component (today's `registry.json` only points at a filename, §6.2 of RFC
  0005).
- **Tokens** — the category/format matrix `tokens`/`theme` support (css /
  scss / tailwind, RFC 0006), so an agent can pick a format before running
  anything.
- **Schema version** — a `manifestVersion` field, independent of the
  registry's own `version` pin, so the *shape* of the manifest can evolve
  without forcing a registry bump.

`--json` is the only flag; human output is the same data pretty-printed.
Because it's aggregation over data the CLI already has in-process (the
embedded registry, RFC 0005 §6.1/§6.4; the parsed command table), it needs no
network access beyond what `list`/`add` already require, and works offline
against a `--registry <path>` exactly like every other command.

## 4. Real JSON Schema files

`contract.json` and `primitiv.json` already carry a `"$schema"` field
pointing at `https://primitiv-ui.dev/schema/{contract,primitiv}.json` (RFC
0004 §3.4, RFC 0005 §3.1) — neither resolves today. This RFC proposes
actually authoring those two schemas (plus one for `registry.json`, which
carries no `$schema` field yet) as JSON Schema documents, versioned alongside
the manifest (§3), and served at the URLs already promised. This is small
and overdue: it lets an agent (or an IDE) validate a hand-written
`primitiv.json` or a third-party registry fork without needing the Rust
binary at all, and it's the one piece of "self-describing" that Astryx's
manifest leans on most directly — a manifest that describes commands but
references unresolvable schema URLs for its own data shapes is only half
self-describing.

## 5. MCP server

A server process (packaged as `@primitiv-ui/mcp`, or a `primitiv mcp serve`
subcommand of the existing binary — open question, §7) exposing the same
data as typed MCP tools rather than requiring an agent to shell out and parse
`--json` stdout:

- `list_components` — the registry index (mirrors `list --json`).
- `get_contract(component)` — one component's `contract.json`.
- `get_manifest()` — the full §3 aggregate.
- `get_tokens(format)` — the emitted token layer for a format (mirrors
  `tokens --format <fmt>`, in-memory rather than writing a file).
- `add_component(name, options)` — wraps the `add` flow (RFC 0005 §4)
  end-to-end, including the safe-refresh and project-wiring prompts
  surfaced as structured tool results rather than a TTY interaction, so an
  MCP-driving agent gets the same never-clobber guarantees a human gets
  interactively.

The server is a thin layer over the existing CLI core (RFC 0007's ports &
adapters — the command logic is already pure functions over a `FileSystem`
port, unrelated to how the invocation arrived), so it adds a transport, not
a second implementation of `add`/`tokens`/etc. This mirrors Astryx's
approach: the CLI and the MCP server read from one underlying self-describing
model rather than being two hand-maintained surfaces that can drift.

## 6. Non-goals

- **Not a new install mechanism.** The MCP server calls the same `add`/
  `tokens`/`theme` logic the CLI does; it is a second transport, not a
  parallel path with different guarantees.
- **Not a schema redesign.** `contract.json` and `registry.json` keep their
  existing shape (RFC 0004 §3.4, RFC 0005 §6.2); this RFC only makes that
  shape resolvable and aggregatable.
- **Not codemods.** Astryx also ships agent-drivable version-migration
  codemods; Primitiv has no equivalent today and this RFC doesn't propose
  one — it's a large enough surface to deserve its own RFC if pursued.

## 7. Open questions

1. **MCP packaging** — a separate `@primitiv-ui/mcp` npm package (its own
   release cadence) vs. a `primitiv mcp serve` subcommand on the existing
   Rust binary (one artifact, one version). The CLI is already
   self-contained and network-light (RFC 0005 Principle 5); folding the
   server into the same binary keeps that property, but MCP's ecosystem
   conventions lean toward small dedicated npm packages a client config
   points at directly.
2. **Manifest versioning** — whether `manifestVersion` tracks the registry's
   own `version` field 1:1 or is allowed to move independently (proposed
   above, but not settled) when only the aggregation shape changes and no
   component contract does.
3. **AGENTS.md / llms.txt** — RFC 0005 §6.5 lists these alongside the future
   MCP server as agent affordances; neither exists in the repo yet. Whether
   they stay hand-authored prose or become generated from the same
   manifest (§3) — favoring generated, so they can't drift from the data —
   is worth settling alongside this RFC rather than separately.

## 8. Decision record

| # | Decision | Maps to |
|---|---|---|
| 1 | Add `primitiv manifest [--json]`: one aggregated, config-less artifact covering the command surface, the full registry index with contracts inlined, and the token format matrix, versioned independently via `manifestVersion` | §3 |
| 2 | Author real JSON Schema files for `contract.json`, `primitiv.json`, and `registry.json` and serve them at the URLs already referenced, rather than leaving `$schema` unresolvable | §4 |
| 3 | Build an MCP server as a thin transport over the existing CLI core (ports & adapters, RFC 0007), exposing `list_components` / `get_contract` / `get_manifest` / `get_tokens` / `add_component` as typed tools rather than reimplementing CLI logic | §5 |
| 4 | Scope this RFC to aggregation + a query/typed-tool transport; explicitly defer codemods and any schema redesign | §6 |
