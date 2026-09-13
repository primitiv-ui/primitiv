"use client";

import { useState } from "react";

import { User } from "@primitiv-ui/icons";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/avatar";
import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { Stack } from "@/components/stack";
import { importBlock } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const SIZES: readonly Size[] = ["xs", "sm", "md", "lg", "xl"];
const INITIAL_FILTERS = ["Status: Active", "Owner: You", "Label: Bug"];

const imports = (mode: Mode) =>
  importBlock({ mode: mode === "headless" ? "styled" : mode, component: "Chip", componentId: "chip" });

/** The playground preview: removing actually works, and restores so it repeats. */
function PlaygroundChip({ size }: { size: Size }) {
  const [gone, setGone] = useState(false);
  if (gone) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setGone(false)}>
        Chip removed — restore
      </Button>
    );
  }
  return (
    <Chip size={size} onRemove={() => setGone(true)}>
      Design
    </Chip>
  );
}

/** The headline: a real filter bar whose × actually removes a chip. */
function FilterBar() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  return (
    <Stack direction="row" gap="sm" wrap="wrap" align="center">
      {filters.map((filter) => (
        <Chip key={filter} onRemove={() => setFilters((current) => current.filter((f) => f !== filter))}>
          {filter}
        </Chip>
      ))}
      {filters.length === 0 && (
        <Button variant="secondary" size="sm" onClick={() => setFilters(INITIAL_FILTERS)}>
          Reset filters
        </Button>
      )}
    </Stack>
  );
}

/**
 * Chip's page content — the interactive third of the RFC 0021 trio.
 *
 * Unlike `Badge` and `Tag` (read-only `<span>`s), a Chip carries real
 * behaviour: a required `onRemove` and a trailing remove `<button>`. Two facts
 * lead, both invisible from the props table. **Only the remove button is
 * interactive** — the pill itself is not clickable, which sidesteps the
 * nested-interactive-element problem while the whole pill's hover/active/focus
 * still responds to the button in CSS. And **`onRemove` is required**:
 * removability is the anatomy, not an option — a non-removable label is a `Tag`.
 *
 * No Anatomy block (one registry part), but it DOES get a Keyboard section,
 * unlike its siblings — the remove button is a genuine focus target.
 */
export const chipSpec: ComponentSpec = {
  playground: {
    component: "Chip",
    snippet: (values, mode) =>
      [
        imports(mode),
        ``,
        `<Chip size="${values.size}" onRemove={() => removeFilter()}>`,
        `  Design`,
        `</Chip>`,
      ].join("\n"),
    render: (values) => <PlaygroundChip size={values.size as Size} />,
  },

  examples: [
    {
      id: "removable-filters",
      title: "A removable filter bar (the headline)",
      render: () => (
        <InteractiveExample
          caption="The canonical use: applied filters a user can dismiss one at a time. `onRemove` is **required** — it is what a Chip is for — and here it removes the filter from React state, so the × genuinely takes the chip away. (Remove them all to see the reset.) Note the split of responsibility: the Chip fires `onRemove`, but *what* removal means, and where focus goes afterward, are yours."
          code={(_density, mode) =>
            [
              imports(mode),
              `import { Stack } from "@/components/ui/stack";`,
              `import { useState } from "react";`,
              ``,
              `const [filters, setFilters] = useState(["Status: Active", "Owner: You"]);`,
              ``,
              `<Stack direction="row" gap="sm" wrap="wrap">`,
              `  {filters.map((filter) => (`,
              `    <Chip`,
              `      key={filter}`,
              `      onRemove={() => setFilters((c) => c.filter((f) => f !== filter))}`,
              `    >`,
              `      {filter}`,
              `    </Chip>`,
              `  ))}`,
              `</Stack>`,
            ].join("\n")
          }
        >
          {() => <FilterBar />}
        </InteractiveExample>
      ),
    },
    {
      id: "leading-content",
      title: "A leading icon or avatar",
      render: () => (
        <InteractiveExample
          caption="`leadingIcon` renders any node before the label — an icon for a category, or an `Avatar` for a person (an assignee or attendee chip). Keep it decorative: mark an icon `aria-hidden` and an avatar image `alt=&quot;&quot;`, since the label already carries the name and `removeLabel` names the button."
          code={(_density, mode) =>
            [
              imports(mode),
              `import { User } from "@primitiv-ui/icons";`,
              ``,
              `<Chip leadingIcon={<User aria-hidden="true" />} onRemove={removeAssignee}>`,
              `  Jane Doe`,
              `</Chip>`,
            ].join("\n")
          }
        >
          {() => (
            <Stack direction="row" gap="sm" wrap="wrap" align="center">
              <Chip leadingIcon={<User aria-hidden="true" />} onRemove={() => {}}>
                Jane Doe
              </Chip>
              <Chip
                leadingIcon={
                  <Avatar size="xs">
                    <AvatarImage src="/avatar-1.png" alt="" />
                    <AvatarFallback>AB</AvatarFallback>
                  </Avatar>
                }
                onRemove={() => {}}
              >
                Alex Brand
              </Chip>
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
          caption="Five sizes, each rescaling again with the nearest `data-density` ancestor — chips in a compact filter bar want `xs`/`sm`, one standing alone `lg`. `size` reuses the shared `framed-control/*` scale, so a chip lines up with an Input or Button of the same size. Change the density above and the whole ramp shifts."
          code={(density, mode) =>
            [
              imports(mode),
              ``,
              `<div data-density="${density}">`,
              ...SIZES.map((s) => `  <Chip size="${s}" onRemove={remove}>Design</Chip>`),
              `</div>`,
            ].join("\n")
          }
        >
          {() => (
            <Stack direction="row" gap="sm" align="center" wrap="wrap">
              {SIZES.map((size) => (
                <Chip key={size} size={size} onRemove={() => {}}>
                  Design
                </Chip>
              ))}
            </Stack>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "disabled",
      title: "Disabled",
      render: () => (
        <InteractiveExample
          caption="`disabled` dims the whole pill and disables the remove button, so the chip is shown but cannot be dismissed — a filter locked on by a permission, say. It is the remove `<button>` that carries the `disabled` attribute (the pill is not a control), so it drops out of the tab order like any disabled button."
          code={(_density, mode) =>
            [imports(mode), ``, `<Chip disabled onRemove={remove}>Region: EU (locked)</Chip>`].join("\n")
          }
        >
          {() => (
            <Chip disabled onRemove={() => {}}>
              Region: EU (locked)
            </Chip>
          )}
        </InteractiveExample>
      ),
    },
  ],

  keyboardMeta:
    "A Chip has exactly one interactive element — the trailing remove `<button>` — so its keyboard model is a native button's, nothing more. The label and any leading icon are not focusable.",
  keyboard: [
    {
      keys: ["Tab"],
      behaviour:
        "Move focus to the remove button, showing its `:focus-visible` ring. A `disabled` chip's button is skipped, exactly like any disabled button.",
    },
    {
      keys: ["Enter"],
      behaviour: "Activate the remove button, calling `onRemove` — it is a real `<button>`, so this is native.",
    },
    {
      keys: ["Space"],
      behaviour: "Also activates the remove button, the native second key for a `<button>`.",
    },
  ],

  accessibility: [
    "**Only the remove button is interactive.** The pill's `<span>` is deliberately not clickable — making the whole chip a button *and* nesting a remove button inside it is an invalid nested-interactive structure. If you need the chip's body to do something (open a detail, toggle a filter), that is a different component; a Chip removes, and only its × is a control.",
    "**Name the remove button.** It is icon-only, so it needs an accessible name: `removeLabel` sets it, defaulting to `Remove ${children}` when the label is a string. A bare \"Remove\" with no object (\"remove what?\") is the failure mode when the label is not plain text — pass `removeLabel` explicitly then.",
    "**Manage focus after removal.** Removing a chip unmounts the button that had focus, so focus can be lost to the `<body>`. When you remove a chip, move focus to a sensible neighbour — the next chip, or the filter bar's container — rather than leaving the user stranded. The Chip fires `onRemove`; the focus move is yours to make.",
    "The label text carries the meaning; the tone is neutral and fixed, so unlike `Badge`/`Tag` there is no colour to misread here. Keep the label self-describing (\"Status: Active\", not \"Active\").",
    "**`disabled`** puts the native `disabled` attribute on the remove button, which removes it from the tab order and stops `onRemove` firing — the honest way to show a chip that exists but cannot currently be dismissed.",
    "**Chip, Tag or Badge?** Chip is the interactive, removable one — a `<button>` inside. `Tag` is the read-only category label, `Badge` the read-only status. If nothing can be removed or clicked, you want one of those, not a Chip with a no-op `onRemove`.",
  ],
};
