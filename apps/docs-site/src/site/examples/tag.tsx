"use client";

import { Stack } from "@/components/stack";
import { Tag } from "@/components/tag";
import { importBlock } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Tone = "neutral" | "success" | "warning" | "info" | "danger";
type Size = "xs" | "sm" | "md" | "lg" | "xl";

const TONES: readonly Tone[] = ["neutral", "success", "warning", "info", "danger"];
const SIZES: readonly Size[] = ["xs", "sm", "md", "lg", "xl"];
const TOPICS = ["Design", "Engineering", "Research", "Marketing"];

/**
 * Tag is registry-only, so there is no consumption mode to switch — the import
 * is the copied file whichever way you read it. `importBlock` keeps the specifier
 * in one place all the same.
 */
const imports = (mode: Mode) =>
  importBlock({ mode: mode === "headless" ? "styled" : mode, component: "Tag", componentId: "tag" });

/**
 * Tag's page content — Badge's twin, and the difference IS the page.
 *
 * Both are registry-only `<span>` leaves, read-only, sized xs–xl. Tag adds the
 * `neutral` tone Badge deliberately omits and drops Badge's `variant`, because
 * Tag is a category/topic label (usually one of a group) rather than a status:
 * the default is the plain neutral treatment, and the four semantic tones are
 * the exception, not the rule.
 *
 * No Anatomy (one part), no Keyboard (a `<span>` takes no focus — anything
 * interactive is a `Chip`).
 */
export const tagSpec: ComponentSpec = {
  playground: {
    component: "Tag",
    snippetChildren: "Design",
    snippetPrefix: (mode) => imports(mode),
    render: (values) => (
      <Tag tone={values.tone as Tone} size={values.size as Size}>
        Design
      </Tag>
    ),
  },

  examples: [
    {
      id: "tones",
      title: "Tones",
      render: () => (
        <InteractiveExample
          caption="Five tones, and `neutral` leads for a reason: a tag usually labels a category or topic, which carries no status, so the plain grey treatment is the default and the workhorse. The four semantic tones (`success`, `warning`, `info`, `danger`) are the exception — reach for one only when the tag genuinely signals state. If you want a status pill that is *meant* to stand out, that is `Badge`, whose palette drops the neutral this one keeps."
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              ...TONES.map((t) => `<Tag tone="${t}">${t[0].toUpperCase()}${t.slice(1)}</Tag>`),
            ].join("\n")
          }
        >
          {() => (
            <Stack direction="row" gap="sm" wrap="wrap">
              {TONES.map((tone) => (
                <Tag key={tone} tone={tone}>
                  {tone[0].toUpperCase() + tone.slice(1)}
                </Tag>
              ))}
            </Stack>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "in-a-group",
      title: "A group of tags",
      render: () => (
        <InteractiveExample
          caption="Tags rarely travel alone — the common shape is a group labelling one thing by several categories at once. The group is your own layout (a row-direction `Stack` that wraps here), and the tags inside it stay `neutral`, since a list of topics is not a list of statuses. Give the group an accessible name if the set of tags means something as a whole."
          code={(_density, mode) =>
            [
              imports(mode),
              `import { Stack } from "@/components/ui/stack";`,
              ``,
              `<Stack direction="row" gap="sm" wrap="wrap">`,
              ...TOPICS.map((t) => `  <Tag>${t}</Tag>`),
              `</Stack>`,
            ].join("\n")
          }
        >
          {() => (
            <Stack direction="row" gap="sm" wrap="wrap">
              {TOPICS.map((topic) => (
                <Tag key={topic}>{topic}</Tag>
              ))}
            </Stack>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "sizes",
      title: "Sizes and density",
      render: () => (
        <InteractiveExample
          caption="Five sizes, each rescaling again with the nearest `data-density` ancestor — a tag in a dense table row wants `xs`, one beside a heading `lg`. Change the density above and the whole ramp shifts: that is the Context system, not a `Tag` prop."
          code={(density, mode) =>
            [
              imports(mode),
              ``,
              `<div data-density="${density}">`,
              ...SIZES.map((s) => `  <Tag size="${s}">Design</Tag>`),
              `</div>`,
            ].join("\n")
          }
        >
          {() => (
            <Stack direction="row" gap="sm" align="center" wrap="wrap">
              {SIZES.map((size) => (
                <Tag key={size} size={size}>
                  Design
                </Tag>
              ))}
            </Stack>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "as-child",
      title: "As another element (asChild)",
      render: () => (
        <InteractiveExample
          caption="`asChild` merges the tag's classes onto your own element instead of wrapping a `<span>` — for marking up an `<abbr>` or a list `<li>` that should read as a tag while keeping its own semantics. It is **not** a way to make a tag clickable: a tag is read-only by design, and a filterable, removable, or linked pill is a `Chip`, which is built to be interactive."
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `<Tag asChild tone="info">`,
              `  <abbr title="TypeScript">TS</abbr>`,
              `</Tag>`,
            ].join("\n")
          }
        >
          {() => (
            <Tag asChild tone="info">
              <abbr title="TypeScript">TS</abbr>
            </Tag>
          )}
        </InteractiveExample>
      ),
    },
  ],

  accessibility: [
    "A tag is **read-only**. It renders a `<span>`, takes no focus and handles no events — if you need something clickable, removable, or filterable that looks like this, use `Chip`, which is built for it, rather than putting a handler on a tag.",
    "The tone is not the message. Colour alone carries no meaning for a screen-reader user or anyone who cannot distinguish the hues, so the text has to say it — and because `neutral` is the default, most tags rely on their words entirely, which is the right instinct for a semantic tone too.",
    "A group of tags is your own markup, so its semantics are yours to give: if the set means something as a whole (\"topics\", \"applied filters\"), wrap it in a labelled `<ul>`/`<li>` or a region with an `aria-label` rather than leaving a bare run of `<span>`s.",
    "Under `asChild` the classes merge onto your element and its semantics stay yours — an `<abbr>` is still an `<abbr>`. Nothing about the tag overrides the role, which is why it is the right hook for marking up an abbreviation or a list item.",
    "**Tag or Badge?** Tag carries the `neutral` tone for categories and topics; `Badge` drops neutral so every badge is one of four *statuses*. Choose on whether the label is a category (Tag) or a state (Badge) — and choose `Chip` the moment it needs to be interactive.",
  ],
};
