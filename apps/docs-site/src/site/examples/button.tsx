"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "@primitiv-ui/icons";

import { Button } from "@/components/button";
import { contractAttr, contractNote, importBlock } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

/**
 * The import lines for a Button snippet, in the current mode.
 *
 * Only the specifier varies here — Button is a single part, so there are no part
 * names to disagree about (which is why the mode-aware naming Select needs never
 * came up on this page). The line still has to change, because the styled export
 * lives in the file `primitiv add` copied rather than in the package.
 *
 * The PROPS still vary, though, which this page missed for longer: `variant` and
 * `size` are contract props of the copied styled file, so every snippet below
 * routes them through `contractAttr` rather than printing them unconditionally.
 */
const imports = (mode: Mode, icons: readonly string[] = []) =>
  importBlock({ mode, component: "Button", componentId: "button", icons });

const SIZES = ["xs", "sm", "md", "lg", "xl"] as const;
const VARIANTS = ["primary", "secondary", "danger", "ghost", "link"] as const;

/**
 * Button's page content.
 *
 * The example set mirrors the Figma "Component page — Button (desktop)" frame:
 * Variants, Sizes, With icons, As a link (asChild), Disabled.
 */
export const buttonSpec: ComponentSpec = {
  playground: {
    component: "Button",
    snippetChildren: "Save changes",
    snippetPrefix: (mode) => imports(mode),
    render: (values) => (
      <Button
        variant={values.variant as (typeof VARIANTS)[number]}
        size={values.size as (typeof SIZES)[number]}
      >
        Save changes
      </Button>
    ),
  },

  examples: [
    {
      id: "variants",
      title: "Variants",
      render: () => (
        <InteractiveExample
          caption="Five intents. `primary` carries the main action on a view; `link` reads as text so it keeps the button's hit area and focus ring."
          code={(density, mode) =>
            [
              imports(mode),
              ``,
              ...contractNote(mode, "`variant`"),
              `<div data-density="${density}">`,
              ...VARIANTS.map(
                (v) =>
                  `  <Button${contractAttr({ mode, prop: "variant", value: v, headlessClass: `btn-${v}` })}>${v[0].toUpperCase()}${v.slice(1)}</Button>`,
              ),
              `</div>`,
            ].join("\n")
          }
        >
          {() =>
            VARIANTS.map((variant) => (
              <Button key={variant} variant={variant}>
                {variant[0].toUpperCase() + variant.slice(1)}
              </Button>
            ))
          }
        </InteractiveExample>
      ),
    },
    {
      id: "sizes",
      title: "Sizes",
      render: () => (
        <InteractiveExample
          caption="Five sizes — and every one rescales again with the nearest `data-density` ancestor. Change the density above and watch the whole ramp shift: that is the Context system, not a `Button` prop."
          code={(density, mode) =>
            [
              imports(mode),
              ``,
              ...contractNote(mode, "`size`"),
              `<div data-density="${density}">`,
              ...SIZES.map(
                (s) =>
                  `  <Button${contractAttr({ mode, prop: "size", value: s, headlessClass: `btn-${s}` })}>Button ${s}</Button>`,
              ),
              `</div>`,
            ].join("\n")
          }
        >
          {() =>
            SIZES.map((size) => (
              <Button key={size} size={size}>
                Button {size}
              </Button>
            ))
          }
        </InteractiveExample>
      ),
    },
    {
      id: "with-icons",
      title: "With icons",
      render: () => (
        <InteractiveExample
          caption="Icons are `children`, not props, so a leading or trailing glyph is just composition — nothing to configure."
          code={(_density, mode) =>
            [
              imports(mode, ["ArrowRight", "Plus"]),
              ``,
              `<Button>`,
              `  <Plus />`,
              `  Add item`,
              `</Button>`,
              ``,
              /* Incidental to what this example shows, so it just goes in
                 headless mode — no stand-in class. The subject is that icons
                 are children. */
              `<Button${contractAttr({ mode, prop: "variant", value: "secondary" })}>`,
              `  Continue`,
              `  <ArrowRight />`,
              `</Button>`,
            ].join("\n")
          }
        >
          {() => (
            <>
              <Button>
                <Plus />
                Add item
              </Button>
              <Button variant="secondary">
                Continue
                <ArrowRight />
              </Button>
            </>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "as-a-link",
      title: "As a link (asChild)",
      render: () => (
        <InteractiveExample
          caption={
            '`asChild` renders your own element instead of a `<button>` — here a Next `<Link>` — merging the button props and styles onto it. The a11y wiring follows, so it stays `role="link"`.'
          }
          code={(_density, mode) =>
            [
              `import Link from "next/link";`,
              imports(mode, ["ArrowRight"]),
              ``,
              `<Button asChild>`,
              `  <Link href="/components">`,
              /*
               * Plain text in BOTH modes now. The styled snippet used to carry
               * an explicit `primitiv-button__label` span — a class the copied
               * wrapper owns and `contract.json` never declared — because under
               * `asChild` the text sat one level deeper than `wrapTextNodes`
               * reached, so its text-box-trim had to be written by hand
               * (registry-bugs §5). The generator now wraps it, so the two modes
               * read identically here again.
               */
              `    View the docs`,
              `    <ArrowRight />`,
              `  </Link>`,
              `</Button>`,
            ].join("\n")
          }
        >
          {() => (
            <Button asChild>
              <Link href="/components/">
                View the docs
                <ArrowRight />
              </Link>
            </Button>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "disabled",
      title: "Disabled",
      render: () => (
        <InteractiveExample
          caption="`disabled` sets the native attribute and exposes `data-disabled`, so pointer events stop and the focus ring is suppressed — no ARIA needed, because the real attribute is doing the work."
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `<Button disabled>Save changes</Button>`,
              `<Button${contractAttr({ mode, prop: "variant", value: "secondary" })} disabled>Cancel</Button>`,
            ].join("\n")
          }
        >
          {() => (
            <>
              <Button disabled>Save changes</Button>
              <Button variant="secondary" disabled>
                Cancel
              </Button>
            </>
          )}
        </InteractiveExample>
      ),
    },
  ],

  accessibility: [
    "Space and Enter both activate the button — the native `<button>` behaviour, kept rather than re-implemented.",
    "A visible focus ring is drawn via `:focus-visible`, so it appears for keyboard users and not on mouse click.",
    "`disabled` exposes both the native attribute and `data-disabled`, so pointer events stop and assistive tech reports the state.",
    "Under `asChild` the a11y wiring transfers to the element you supply, so a rendered `<a>` keeps `role=\"link\"` rather than being announced as a button.",
  ],
};
