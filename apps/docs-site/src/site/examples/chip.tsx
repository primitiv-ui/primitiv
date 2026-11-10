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
import { glyph, withGlyphs } from "./glyphs";
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
/**
 * A chip as Elements markup. `inline` adds the one-line handler that removes
 * it; the filter bar instead wires every chip from one script, which is also
 * where focus is handed on.
 */
const chipHtml = (
  label: string,
  {
    size = "md",
    leading,
    disabled = false,
    inline = true,
    indent = "",
  }: { size?: string; leading?: string; disabled?: boolean; inline?: boolean; indent?: string } = {},
) =>
  [
    `<span class="primitiv-chip primitiv-chip--${size}">`,
    ...(leading ? [`  <span class="primitiv-chip__leading-icon">${leading}</span>`] : []),
    `  <span class="primitiv-chip__label">${label}</span>`,
    `  <button type="button" class="primitiv-chip__remove" aria-label="Remove ${label}"${disabled ? " disabled" : ""}${inline && !disabled ? ` onclick="this.closest('.primitiv-chip').remove()"` : ""}>${glyph("close")}</button>`,
    `</span>`,
  ]
    .map((l) => indent + l)
    .join("\n");

const ROW =
  '<div class="primitiv-stack primitiv-stack--row primitiv-stack--gap-sm primitiv-stack--align-center primitiv-stack--wrap primitiv-stack--justify-start">';

/** Removing a filter and handing focus on, as the Elements code tab prints it. */
const FILTER_SCRIPT = [
  `<script>`,
  `  const bar = document.getElementById("filters");`,
  `  bar.addEventListener("click", (event) => {`,
  `    const remove = event.target.closest(".primitiv-chip__remove");`,
  `    if (!remove) return;`,
  `    const chip = remove.closest(".primitiv-chip");`,
  `    const next = chip.nextElementSibling ?? chip.previousElementSibling;`,
  `    chip.remove();`,
  `    // Focus would fall to <body> with the button gone, so hand it on.`,
  `    next?.querySelector(".primitiv-chip__remove")?.focus();`,
  `  });`,
  `</script>`,
];

/** The same, scoped to the preview (scripts in injected markup never run). */
const wireFilters = (root: HTMLElement) => {
  const bar = root.querySelector<HTMLElement>("#filters");
  if (!bar) return;
  const onClick = (event: MouseEvent) => {
    const remove = (event.target as Element).closest(".primitiv-chip__remove");
    if (!remove) return;
    const chip = remove.closest(".primitiv-chip");
    if (!chip) return;
    const next = chip.nextElementSibling ?? chip.previousElementSibling;
    chip.remove();
    next?.querySelector<HTMLElement>(".primitiv-chip__remove")?.focus();
  };
  bar.addEventListener("click", onClick);
  return () => bar.removeEventListener("click", onClick);
};

const glyphs = (_density: unknown, code: string) => withGlyphs(code);

export const chipSpec: ComponentSpec = {
  playground: {
    component: "Chip",
    snippet: (values, mode) =>
      mode === "elements"
        ? chipHtml("Design", { size: values.size })
        : [
        imports(mode),
        ``,
        `<Chip size="${values.size}" onRemove={() => removeFilter()}>`,
        `  Design`,
        `</Chip>`,
      ].join("\n"),
    elementsPreview: withGlyphs,
    render: (values) => <PlaygroundChip size={values.size as Size} />,
  },

  examples: [
    {
      id: "removable-filters",
      title: "A removable filter bar (the headline)",
      render: () => (
        <InteractiveExample
          elementsCaption={"The canonical use: applied filters a user can dismiss one at a time. One `click` listener on the bar handles every chip's remove button — including chips the server adds later — and hands focus to the neighbouring chip, so a keyboard user is not dropped back to the top of the page."}
          wire={wireFilters}
          elementsPreview={(_density, code) => withGlyphs(code.slice(0, code.indexOf("\n\n<script")))}
          caption="The canonical use: applied filters a user can dismiss one at a time. `onRemove` is **required** — it is what a Chip is for — and here it removes the filter from React state, so the × genuinely takes the chip away. (Remove them all to see the reset.) Note the split of responsibility: the Chip fires `onRemove`, but *what* removal means, and where focus goes afterward, are yours."
          code={(_density, mode) =>
            mode === "elements"
              ? [
                  ROW.replace("<div ", `<div id="filters" `),
                  ...INITIAL_FILTERS.map((f) => chipHtml(f, { inline: false, indent: "  " })),
                  `</div>`,
                  ``,
                  ...FILTER_SCRIPT,
                ].join("\n")
              : [
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
          elementsCaption={'The `__leading-icon` slot holds anything before the label — an icon for a category, or an Avatar for a person. Keep it decorative (`aria-hidden` on an icon, `alt=""` on a photo): the label already names the chip.'}
          elementsPreview={glyphs}
          caption="`leadingIcon` renders any node before the label — an icon for a category, or an `Avatar` for a person (an assignee or attendee chip). Keep it decorative: mark an icon `aria-hidden` and an avatar image `alt=&quot;&quot;`, since the label already carries the name and `removeLabel` names the button."
          code={(_density, mode) =>
            mode === "elements"
              ? [
                  ROW,
                  chipHtml("Jane Doe", { leading: glyph("user"), indent: "  " }),
                  chipHtml("Alex Brand", {
                    leading: `<span class="primitiv-avatar primitiv-avatar--xs primitiv-avatar--circle"><img class="primitiv-avatar__image" src="/avatar-1.png" alt="" onerror="this.remove()"><span class="primitiv-avatar__fallback"><span class="primitiv-avatar__fallback-label">AB</span></span></span>`,
                    indent: "  ",
                  }),
                  `</div>`,
                ].join("\n")
              : [
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
          elementsCaption={'Five sizes, each rescaling again with the nearest `data-density` ancestor — chips in a compact filter bar want `xs` or `sm`, one standing alone `lg`.'}
          elementsPreview={(_density, code) => `${ROW}${withGlyphs(code.split("\n").slice(1, -1).map((l) => l.slice(2)).join("\n"))}</div>`}
          caption="Five sizes, each rescaling again with the nearest `data-density` ancestor — chips in a compact filter bar want `xs`/`sm`, one standing alone `lg`. `size` reuses the shared `framed-control/*` scale, so a chip lines up with an Input or Button of the same size. Change the density above and the whole ramp shifts."
          code={(density, mode) =>
            mode === "elements"
              ? [`<div data-density="${density}">`, ...SIZES.map((size) => chipHtml("Design", { size, indent: "  " })), `</div>`].join("\n")
              : [
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
          elementsCaption={'The native `disabled` attribute on the remove button dims the whole pill and stops it being dismissed — a filter locked on by a permission, say. The stylesheet reads it from the button with `:has()`.'}
          elementsPreview={glyphs}
          caption="`disabled` dims the whole pill and disables the remove button, so the chip is shown but cannot be dismissed — a filter locked on by a permission, say. It is the remove `<button>` that carries the `disabled` attribute (the pill is not a control), so it drops out of the tab order like any disabled button."
          code={(_density, mode) =>
            mode === "elements"
              ? chipHtml("Region: EU (locked)", { disabled: true })
              : [imports(mode), ``, `<Chip disabled onRemove={remove}>Region: EU (locked)</Chip>`].join("\n")
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

  elements: {
    description:
      "A removable token: `primitiv-chip` and a size on a `<span>`, an optional `__leading-icon`, the `__label`, and a `__remove` button whose click handler you write.",
    keyboard: [
      {
        keys: ["Tab"],
        behaviour: "Move focus to the remove button, showing its focus ring. A disabled chip's button is skipped.",
      },
      { keys: ["Enter"], behaviour: "Activate the remove button, running your click handler — it is a real `<button>`." },
      { keys: ["Space"], behaviour: "Also activates the remove button." },
    ],
    accessibility: [
      "**Only the remove button is interactive.** The pill itself is not clickable — a button inside a button is invalid and confusing.",
      "**Name the remove button.** It is icon-only, so give it an `aria-label` that says what it removes — “Remove Design”, not “Remove”.",
      "**Manage focus after removal.** Removing a chip removes the button that had focus, so hand focus to a neighbouring chip, as the filter bar's script does.",
      "Keep the label self-describing (“Status: Active”), since it is all a screen reader hears.",
      "The native `disabled` attribute on the remove button takes it out of the tab order and stops the click.",
    ],
  },

  accessibility: [
    "**Only the remove button is interactive.** The pill's `<span>` is deliberately not clickable — making the whole chip a button *and* nesting a remove button inside it is an invalid nested-interactive structure. If you need the chip's body to do something (open a detail, toggle a filter), that is a different component; a Chip removes, and only its × is a control.",
    "**Name the remove button.** It is icon-only, so it needs an accessible name: `removeLabel` sets it, defaulting to `Remove ${children}` when the label is a string. A bare \"Remove\" with no object (\"remove what?\") is the failure mode when the label is not plain text — pass `removeLabel` explicitly then.",
    "**Manage focus after removal.** Removing a chip unmounts the button that had focus, so focus can be lost to the `<body>`. When you remove a chip, move focus to a sensible neighbour — the next chip, or the filter bar's container — rather than leaving the user stranded. The Chip fires `onRemove`; the focus move is yours to make.",
    "The label text carries the meaning; the tone is neutral and fixed, so unlike `Badge`/`Tag` there is no colour to misread here. Keep the label self-describing (\"Status: Active\", not \"Active\").",
    "**`disabled`** puts the native `disabled` attribute on the remove button, which removes it from the tab order and stops `onRemove` firing — the honest way to show a chip that exists but cannot currently be dismissed.",
    "**Chip, Tag or Badge?** Chip is the interactive, removable one — a `<button>` inside. `Tag` is the read-only category label, `Badge` the read-only status. If nothing can be removed or clicked, you want one of those, not a Chip with a no-op `onRemove`.",
  ],
};
