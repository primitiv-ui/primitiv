"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "@primitiv-ui/icons";

import { Button } from "@/components/button";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { ComponentSpec } from "./types";

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
          caption="Five intents. Primary carries the main action on a view; link reads as text so it keeps the button's hit area and focus ring."
          code={(density) =>
            [
              `<div data-density="${density}">`,
              ...VARIANTS.map(
                (v) =>
                  `  <Button variant="${v}">${v[0].toUpperCase()}${v.slice(1)}</Button>`,
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
          caption="Five sizes — and every one rescales again with the nearest data-density ancestor. Change the density below and watch the whole ramp shift: that is the Context system, not a Button prop."
          code={(density) =>
            [
              `<div data-density="${density}">`,
              ...SIZES.map((s) => `  <Button size="${s}">Button ${s}</Button>`),
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
          caption="Icons are children, not props, so a leading or trailing glyph is just composition — nothing to configure."
          code={() =>
            [
              `<Button>`,
              `  <Plus />`,
              `  Add item`,
              `</Button>`,
              ``,
              `<Button variant="secondary">`,
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
          caption="asChild renders your own element instead of a <button> — here a Next <Link> — merging the button props and styles onto it. The a11y wiring follows, so it stays role=link."
          code={() =>
            [
              `<Button asChild>`,
              `  <Link href="/components">`,
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
          caption="disabled sets the native attribute and exposes data-disabled, so pointer events stop and the focus ring is suppressed — no ARIA needed, because the real attribute is doing the work."
          code={() =>
            [
              `<Button disabled>Save changes</Button>`,
              `<Button variant="secondary" disabled>Cancel</Button>`,
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
    "Space and Enter both activate the button — the native <button> behaviour, kept rather than re-implemented.",
    "A visible focus ring is drawn via :focus-visible, so it appears for keyboard users and not on mouse click.",
    "disabled exposes both the native attribute and data-disabled, so pointer events stop and assistive tech reports the state.",
    "Under asChild the a11y wiring transfers to the element you supply, so a rendered <a> keeps role=link rather than being announced as a button.",
  ],
};
