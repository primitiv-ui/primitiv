"use client";

import { User } from "@primitiv-ui/icons";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/avatar";
import { Stack } from "@/components/stack";
import { contractAttr, importBlock, partNamer, stackImports } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const SIZES: readonly Size[] = ["xs", "sm", "md", "lg", "xl"];

/** The demo portrait, copied from the kitchen-sink's fixtures into `public/`. */
const DEMO_SRC = "/avatar-demo.jpg";

const imports = (mode: Mode, icons: readonly string[] = []) =>
  importBlock({ mode, component: "Avatar", componentId: "avatar", parts: ["Image", "Fallback"], icons });

/**
 * Root + optional Image + Fallback, in the shape of the current mode.
 *
 * Both surfaces carry all three parts, so — unlike Checkbox — nothing is
 * mode-only here; `partNamer` handles the one real difference, the flat styled
 * names (`AvatarImage`) versus the compound headless ones (`Avatar.Image`).
 * `size` / `shape` are the styled contract's, so they go through `contractAttr`
 * and vanish under Headless.
 */
const avatarLines = (
  mode: Mode,
  {
    attrs = "",
    src,
    alt = "Ada Lovelace",
    fallback = "AL",
    indent = "",
  }: { attrs?: string; src?: string; alt?: string; fallback?: string; indent?: string } = {},
): string[] => {
  const p = partNamer(mode, "Avatar");
  return [
    `${indent}<${p("Root")}${attrs}>`,
    ...(src ? [`${indent}  <${p("Image")} src="${src}" alt="${alt}" />`] : []),
    `${indent}  <${p("Fallback")}>${fallback}</${p("Fallback")}>`,
    `${indent}</${p("Root")}>`,
  ];
};

/**
 * Avatar's page content.
 *
 * Two facts lead, and neither is in the props table.
 *
 * First, the **load-state model**: `Avatar.Root` owns a single `data-status`
 * (`idle` → `loading` → `loaded` / `error`); `Avatar.Image` reports its
 * transitions up, and `Avatar.Fallback` reads that status to decide whether to
 * show. Image and fallback both absolutely fill one clipping frame and only one
 * is ever visible, so there is nothing to crossfade — the states layer just
 * toggles the image's `display` off `data-status`, with the fallback showing
 * through underneath.
 *
 * Second, unlike the card siblings, **both surfaces have all three parts** — the
 * styled file is a thin per-part wrapper over the headless compound, adding only
 * `size` / `shape` — so the two modes differ in names, not in shape.
 */
export const avatarSpec: ComponentSpec = {
  playground: {
    component: "Avatar",
    /* Hand-written because it is a compound with children: the generated `toJsx`
       renders one tag with a string child, and would print `size`/`shape` in
       headless mode where they are not props. */
    snippet: (values, mode) =>
      [
        imports(mode),
        ``,
        ...avatarLines(mode, {
          src: DEMO_SRC,
          attrs: `${contractAttr({ mode, prop: "size", value: values.size })}${contractAttr({
            mode,
            prop: "shape",
            value: values.shape,
          })}`,
        }),
      ].join("\n"),
    render: (values) => (
      <Avatar size={values.size as Size} shape={values.shape as "circle" | "square"}>
        <AvatarImage src={DEMO_SRC} alt="Ada Lovelace" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
    ),
  },

  anatomyMeta:
    "Three parts, and both surfaces carry all three — the styled `Avatar` / `AvatarImage` / `AvatarFallback` are thin wrappers over the headless `Avatar.Root` / `.Image` / `.Fallback`, so only the names differ between modes. `Avatar.Root` is a fixed-size clipping frame that owns the single `data-status`; `Avatar.Image` and `Avatar.Fallback` both fill it, and only one is ever visible. The Image is optional — a fallback-only avatar is valid — but the Root and a Fallback are not: without a Fallback there is nothing to show while the image is `idle`, `loading` or broken.",

  anatomy: [
    {
      label: "Parts",
      /* The tree only — Image is shown because it is a real part, though an
         Image-less fallback-only avatar is equally valid. */
      code: (mode) => avatarLines(mode, { src: DEMO_SRC }).join("\n"),
    },
  ],

  examples: [
    {
      id: "image-with-a-fallback",
      title: "Image with a fallback (the headline)",
      render: () => (
        <InteractiveExample
          caption="The normal shape: an `Avatar.Image` for the photo and an `Avatar.Fallback` for while it loads, or if it is missing. `Avatar.Root` holds a single `data-status` (`idle` → `loading` → `loaded` / `error`); the Image reports its transitions up and the Fallback shows through until the image is `loaded`. Both fill the same clipping frame and only one is visible, so there is no crossfade — and the `<img>` stays mounted through every status, so its load lifecycle is never lost."
          code={(_density, mode) =>
            [imports(mode), ``, ...avatarLines(mode, { src: DEMO_SRC })].join("\n")
          }
        >
          {() => (
            <Avatar>
              <AvatarImage src={DEMO_SRC} alt="Ada Lovelace" />
              <AvatarFallback>AL</AvatarFallback>
            </Avatar>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "fallback-content",
      title: "Fallback: initials or an icon",
      render: () => (
        <InteractiveExample
          caption="With no `Avatar.Image` — or before one loads — the Fallback is what shows. Initials are the usual choice when you have a name; a neutral icon like `User` covers the case where you do not. The styled Fallback wraps *text* children in a label span so `text-box-trim` can centre the glyphs optically, but passes an element child (the icon) straight through, so an icon sits centred by the flex frame instead. Mind the accessible name either way — see the notes below."
          code={(_density, mode) =>
            [
              imports(mode, ["User"]),
              stackImports(mode),
              ``,
              `<Stack direction="row" gap="sm">`,
              ...avatarLines(mode, { fallback: "AL", indent: "  " }),
              ...avatarLines(mode, {
                attrs: ` aria-label="Ada Lovelace"`,
                fallback: `<User aria-hidden="true" />`,
                indent: "  ",
              }),
              `</Stack>`,
            ].join("\n")
          }
        >
          {() => (
            <Stack direction="row" gap="sm">
              <Avatar>
                <AvatarFallback>AL</AvatarFallback>
              </Avatar>
              <Avatar aria-label="Ada Lovelace">
                <AvatarFallback>
                  <User aria-hidden="true" />
                </AvatarFallback>
              </Avatar>
            </Stack>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "missing-or-broken",
      title: "When the image is missing or broken",
      render: () => (
        <InteractiveExample
          caption="A `src` that 404s (or none at all) never shows a broken-image glyph: the `<img>` is hidden rather than unmounted and the Fallback shows through, so a missing photo degrades to initials. On fast connections a fallback can instead flash before a working image decodes; `delayMs` on the Fallback withholds it for that many milliseconds after mount to avoid the flicker. It is a Fallback prop, listed in the props table below."
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              ...avatarLines(mode, { src: "/does-not-exist.jpg", alt: "Grace Hopper", fallback: "GH" }),
            ].join("\n")
          }
        >
          {() => (
            <Avatar>
              <AvatarImage src="/does-not-exist.jpg" alt="Grace Hopper" />
              <AvatarFallback>GH</AvatarFallback>
            </Avatar>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "shape",
      title: "Shape",
      render: () => (
        <InteractiveExample
          caption="`shape` is `&quot;circle&quot;` by default — fully rounded at any size — or `&quot;square&quot;`, which swaps in size-scaled corners rather than a hard right angle, so a small square avatar and a large one keep the same visual softness. The corner radius is its own `avatar/radius/*` token family, independent of the shared sizing scale."
          code={(_density, mode) =>
            [
              imports(mode),
              stackImports(mode),
              ``,
              `<Stack direction="row" gap="sm">`,
              ...avatarLines(mode, { src: DEMO_SRC, indent: "  " }),
              ...avatarLines(mode, {
                src: DEMO_SRC,
                attrs: contractAttr({ mode, prop: "shape", value: "square" }),
                indent: "  ",
              }),
              `</Stack>`,
            ].join("\n")
          }
        >
          {() => (
            <Stack direction="row" gap="sm">
              <Avatar>
                <AvatarImage src={DEMO_SRC} alt="Ada Lovelace" />
                <AvatarFallback>AL</AvatarFallback>
              </Avatar>
              <Avatar shape="square">
                <AvatarImage src={DEMO_SRC} alt="Ada Lovelace" />
                <AvatarFallback>AL</AvatarFallback>
              </Avatar>
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
          caption="Five sizes, each rescaling again with the nearest `data-density` ancestor. Sizing reuses the shared `framed-control/*` scale directly — the same token an Input or Button of that size uses — so an avatar lines up cleanly beside a control of the matching size rather than needing its own scale."
          code={(density, mode) =>
            [
              imports(mode),
              stackImports(mode),
              ``,
              `<div data-density="${density}">`,
              `  <Stack direction="row" gap="sm">`,
              ...SIZES.flatMap((s) =>
                avatarLines(mode, {
                  src: DEMO_SRC,
                  attrs: contractAttr({ mode, prop: "size", value: s }),
                  indent: "    ",
                }),
              ),
              `  </Stack>`,
              `</div>`,
            ].join("\n")
          }
        >
          {() => (
            <Stack direction="row" gap="sm" align="center">
              {SIZES.map((size) => (
                <Avatar key={size} size={size}>
                  <AvatarImage src={DEMO_SRC} alt="Ada Lovelace" />
                  <AvatarFallback>AL</AvatarFallback>
                </Avatar>
              ))}
            </Stack>
          )}
        </InteractiveExample>
      ),
    },
  ],

  accessibility: [
    "**Give the image a considered `alt`.** If the avatar sits next to the person's name, the picture is decorative — pass `alt=\"\"` so a screen reader does not announce the name twice. If it stands alone (a bare avatar in a toolbar), `alt` should name the person, since it is the only label they get.",
    "**A fallback needs a name too.** Initials render as text and are announced as-is — which is often not much use (\"AL\"). An *icon* fallback should be `aria-hidden` (as the example shows) so it announces nothing, with the name coming from an `aria-label` on `Avatar.Root` or from adjacent text. Decide what the avatar should announce and put the name in one place.",
    "`data-status` (`idle` / `loading` / `loaded` / `error`) is a **styling hook, not a live region** — the component announces no loading state to assistive technology, which is correct: a picture quietly resolving is not news worth interrupting a screen-reader user for.",
    "**`size` and `shape` are purely visual** and change nothing about the accessibility tree — a large square avatar and a small circular one read identically. Do not lean on size to convey meaning.",
    "By default the Root is a non-interactive `<span>`. If you make the avatar a link or button with `asChild`, it becomes a focus target, so it then needs an accessible name and a visible `:focus-visible` ring like any other control — the avatar image alone is not a label.",
    "The default fallback pairs `action/secondary` background and foreground, which meets contrast out of the box. If you recolour it through the `--primitiv-avatar-fallback-bg` / `-fg` custom properties, keep the pair legible — initials at small sizes are already a demanding contrast case.",
  ],
};
