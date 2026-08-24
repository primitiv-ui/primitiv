"use client";

import { Badge } from "@/components/badge";
import { Stack } from "@/components/stack";
import { importBlock } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Tone = "success" | "warning" | "info" | "danger";
type Size = "xs" | "sm" | "md" | "lg" | "xl";

const TONES: readonly Tone[] = ["success", "warning", "info", "danger"];
const SIZES: readonly Size[] = ["xs", "sm", "md", "lg", "xl"];

/**
 * Badge has no headless primitive, so there is no mode to switch: the import is
 * the copied file whichever way you are reading. `importBlock` is still used
 * rather than a literal, so the specifier stays in one place if the convention
 * moves.
 */
const imports = (mode: Mode) =>
  importBlock({ mode: mode === "headless" ? "styled" : mode, component: "Badge", componentId: "badge" });

/**
 * Badge's page content.
 *
 * The first REGISTRY-ONLY page: no `packages/react` source, so its props come
 * from the copied file and its only real API is the contract — `tone`,
 * `variant`, `size` — plus `asChild`. That makes the examples unusually
 * important, because the props table alone says very little about when to reach
 * for which tone.
 *
 * No Anatomy (one part), no Keyboard (a `<span>` is not interactive, and RFC
 * 0021 is explicit that Badge is read-only — never a button, never a link that
 * announces itself as a badge).
 */
export const badgeSpec: ComponentSpec = {
  playground: {
    component: "Badge",
    snippetChildren: "Stable",
    snippetPrefix: (mode) => imports(mode),
    render: (values) => (
      <Badge tone={values.tone as Tone} variant={values.variant as "label" | "counter"} size={values.size as Size}>
        {values.variant === "counter" ? "8" : "Stable"}
      </Badge>
    ),
  },

  examples: [
    {
      id: "tones",
      title: "Tones",
      render: () => (
        <InteractiveExample
          caption="Four tones, and the set is deliberately closed: `success`, `warning`, `info` and `danger` all *mean* something, so a badge cannot be used as decoration. There is no neutral tone — if what you want is a plain label with no status attached, that is `Tag`, which carries the neutral the Badge palette leaves out."
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              ...TONES.map(
                (t) => `<Badge tone="${t}">${t[0].toUpperCase()}${t.slice(1)}</Badge>`,
              ),
            ].join("\n")
          }
        >
          {() =>
            TONES.map((tone) => (
              <Badge key={tone} tone={tone}>
                {tone[0].toUpperCase() + tone.slice(1)}
              </Badge>
            ))
          }
        </InteractiveExample>
      ),
    },
    {
      id: "counter",
      title: "Counter",
      render: () => (
        <InteractiveExample
          caption="`variant=&quot;counter&quot;` is the number form — a pill sized for one or two digits rather than a word, for unread counts and totals beside a heading or an icon. It is the same component, so a count still carries a tone: an unread count is `info`, a failing-checks count is `danger`."
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `<Badge variant="counter" tone="info">8</Badge>`,
              `<Badge variant="counter" tone="danger">3</Badge>`,
            ].join("\n")
          }
        >
          {() => (
            <>
              <Badge variant="counter" tone="info">
                8
              </Badge>
              <Badge variant="counter" tone="danger">
                3
              </Badge>
            </>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "sizes",
      title: "Sizes and density",
      render: () => (
        <InteractiveExample
          caption="Five sizes, and every one rescales again with the nearest `data-density` ancestor — a badge beside a heading wants `lg`, one in a table row wants `xs`. Change the density above and the whole ramp shifts: that is the Context system, not a `Badge` prop."
          code={(density, mode) =>
            [
              imports(mode),
              ``,
              `<div data-density="${density}">`,
              ...SIZES.map((s) => `  <Badge size="${s}">Stable</Badge>`),
              `</div>`,
            ].join("\n")
          }
        >
          {() =>
            SIZES.map((size) => (
              <Badge key={size} size={size}>
                Stable
              </Badge>
            ))
          }
        </InteractiveExample>
      ),
    },
    {
      id: "as-child",
      title: "As another element (asChild)",
      render: () => (
        <InteractiveExample
          caption="`asChild` merges the badge's classes onto your own element instead of wrapping a `<span>` — useful for an `<abbr>` or a `<time>` that should read as a badge. It is **not** a way to make a badge clickable: a badge is read-only by design, and a link or button that looks like one should be a `Chip`, which is built to be interactive."
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `<Badge asChild tone="info">`,
              `  <time dateTime="2026-08-24">Aug 24</time>`,
              `</Badge>`,
            ].join("\n")
          }
        >
          {() => (
            <Badge asChild tone="info">
              <time dateTime="2026-08-24">Aug 24</time>
            </Badge>
          )}
        </InteractiveExample>
      ),
    },
  ],

  accessibility: [
    "A badge is **read-only**. It renders a `<span>`, takes no focus and handles no events — if you need something clickable that looks like this, use `Chip`, which is built for it, rather than putting a handler on a badge.",
    "The tone is not the message. Colour alone carries no meaning for a screen-reader user or anyone who cannot distinguish the hues, so the text has to say it: `Failing` in the danger tone, not a bare red dot.",
    "A counter needs its own words. `8` on its own is announced as \"8\" — give the surrounding control the context, with an `aria-label` like \"8 unread messages\" on the element the badge is attached to.",
    "Under `asChild` the classes merge onto your element and its semantics stay yours — a `<time>` is still a `<time>`. Nothing about the badge overrides the role, which is why it is the right hook for marking up a date or an abbreviation.",
    "`Badge` has no neutral tone by design, so a status is always one of four meanings. Reach for `Tag` when the label is a category rather than a state.",
  ],
};
