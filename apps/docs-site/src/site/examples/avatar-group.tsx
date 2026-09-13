"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/avatar";
import { AvatarGroup } from "@/components/avatar-group";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const SIZES: readonly Size[] = ["xs", "sm", "md", "lg", "xl"];

/** The kitchen-sink face fixtures, copied into `public/`. */
const FACES = [
  { src: "/avatar-1.png", initials: "AB" },
  { src: "/avatar-2.png", initials: "CD" },
  { src: "/avatar-3.png", initials: "EF" },
  { src: "/avatar-4.png", initials: "GH" },
  { src: "/avatar-5.png", initials: "JK" },
];

/** A team longer than the face set, so `max` has something real to truncate. */
const TEAM = Array.from({ length: 7 }, (_, i) => FACES[i % FACES.length]);

/**
 * Registry-only, so there is no consumption mode to switch — the import is the
 * copied file whichever way you read it. Two lines because every example
 * composes both the group and the `avatar` it wraps.
 */
const imports = () =>
  [
    `import { AvatarGroup } from "@/components/ui/avatar-group";`,
    `import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";`,
  ].join("\n");

/** Live faces. `alt=""` because the picture is decorative beside its initials. */
const faces = (list: typeof FACES, size?: Size) =>
  list.map((f, i) => (
    <Avatar key={i} size={size}>
      <AvatarImage src={f.src} alt="" />
      <AvatarFallback>{f.initials}</AvatarFallback>
    </Avatar>
  ));

/** The same faces as snippet lines — literal blocks, so the tree is visible. */
const faceLines = (list: typeof FACES, { size, indent = "  " }: { size?: Size; indent?: string } = {}) =>
  list.flatMap((f) => [
    `${indent}<Avatar${size ? ` size="${size}"` : ""}>`,
    `${indent}  <AvatarImage src="${f.src}" alt="" />`,
    `${indent}  <AvatarFallback>${f.initials}</AvatarFallback>`,
    `${indent}</Avatar>`,
  ]);

/**
 * AvatarGroup's page content.
 *
 * Registry-only and primitive-less, like `badge` — but where Badge is one leaf,
 * this composes the `avatar` component and adds truncation arithmetic, so the
 * examples carry more than the props table: the counter-is-an-Avatar decision,
 * the size-on-both rule, and the surface-coloured ring that reads as a cutout.
 *
 * `max` and `overflowLabel` are wrapper props with no contract modifier, so they
 * are not playground controls (the playground derives its knobs from the
 * contract) — `size` and `direction` are, and `max` gets its own example.
 */
export const avatarGroupSpec: ComponentSpec = {
  playground: {
    component: "AvatarGroup",
    snippet: (values) =>
      [
        imports(),
        ``,
        `<AvatarGroup size="${values.size}" direction="${values.direction}">`,
        ...faceLines(FACES, { size: values.size as Size }),
        `</AvatarGroup>`,
      ].join("\n"),
    render: (values) => (
      <AvatarGroup size={values.size as Size} direction={values.direction as "ltr" | "rtl"}>
        {faces(FACES, values.size as Size)}
      </AvatarGroup>
    ),
  },

  examples: [
    {
      id: "overlapping-faces",
      title: "Overlapping faces (the headline)",
      render: () => (
        <InteractiveExample
          caption="A row of `Avatar`s the group overlaps and rings. The faces are your own elements — the group lays them out but cannot set their `size`, so pass the same `size` to the group **and** to each `Avatar`. Stacking counts *into* the row: the first face paints on top of the second, and so on. The ring between them is drawn in the surface colour so it reads as a cutout, not a border."
          code={() =>
            [imports(), ``, `<AvatarGroup>`, ...faceLines(FACES.slice(0, 4)), `</AvatarGroup>`].join("\n")
          }
        >
          {() => <AvatarGroup>{faces(FACES.slice(0, 4))}</AvatarGroup>}
        </InteractiveExample>
      ),
    },
    {
      id: "overflow-counter",
      title: "The overflow counter (max)",
      render: () => (
        <InteractiveExample
          caption="`max` shows at most that many faces and folds the rest into a `+N` counter — the counter is itself an `Avatar`, not a `Badge`, so it inherits the ring, size, shape and radius for free (Badge has no neutral tone, and a status colour on an overflow count would be a lie). Give it a real accessible name with `overflowLabel`, since `&quot;+3&quot;` alone tells a screen-reader user nothing."
          code={() =>
            [
              imports(),
              ``,
              `// members: { id, avatar, initials }[] — 7 people here`,
              `<AvatarGroup max={4} overflowLabel={(n) => \`${"${n}"} more people\`}>`,
              `  {members.map((m) => (`,
              `    <Avatar key={m.id}>`,
              `      <AvatarImage src={m.avatar} alt="" />`,
              `      <AvatarFallback>{m.initials}</AvatarFallback>`,
              `    </Avatar>`,
              `  ))}`,
              `</AvatarGroup>`,
            ].join("\n")
          }
        >
          {() => (
            <AvatarGroup max={4} overflowLabel={(n) => `${n} more people`}>
              {faces(TEAM)}
            </AvatarGroup>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "sizes",
      title: "Sizes and density",
      render: () => (
        <InteractiveExample
          caption="Five sizes, each rescaling again with the nearest `data-density` ancestor — the same `framed-control/*` scale the `Avatar` itself uses. `size` sets the overlap and ring width; the reminder bears repeating because it is the one real gotcha here: the group cannot size its children, so `size` goes on the group **and** every `Avatar` inside it."
          code={() =>
            [
              imports(),
              ``,
              `{["xs", "sm", "md", "lg", "xl"].map((size) => (`,
              `  <AvatarGroup key={size} size={size}>`,
              `    {members.map((m) => (`,
              `      <Avatar key={m.id} size={size}>`,
              `        <AvatarImage src={m.avatar} alt="" />`,
              `        <AvatarFallback>{m.initials}</AvatarFallback>`,
              `      </Avatar>`,
              `    ))}`,
              `  </AvatarGroup>`,
              `))}`,
            ].join("\n")
          }
        >
          {() => (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "flex-start" }}>
              {SIZES.map((size) => (
                <AvatarGroup key={size} size={size}>
                  {faces(FACES.slice(0, 3), size)}
                </AvatarGroup>
              ))}
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "direction",
      title: "Direction",
      render: () => (
        <InteractiveExample
          caption="`direction` decides which way the stack advances and, with `max`, which end the counter lands on. `&quot;ltr&quot;` (the default) advances rightward with the counter trailing on the right; `&quot;rtl&quot;` mirrors it for a right-to-left locale. Set it to match the reading direction of the surrounding content rather than hand-reordering the children."
          code={() =>
            [
              imports(),
              ``,
              `<AvatarGroup direction="rtl" max={4}>`,
              `  {members.map((m) => (`,
              `    <Avatar key={m.id}>`,
              `      <AvatarImage src={m.avatar} alt="" />`,
              `      <AvatarFallback>{m.initials}</AvatarFallback>`,
              `    </Avatar>`,
              `  ))}`,
              `</AvatarGroup>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "flex-start" }}>
              <AvatarGroup direction="ltr" max={4}>
                {faces(TEAM)}
              </AvatarGroup>
              <AvatarGroup direction="rtl" max={4}>
                {faces(TEAM)}
              </AvatarGroup>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "ring-on-tinted",
      title: "The ring on a tinted background",
      render: () => (
        <InteractiveExample
          caption="The separating ring is the `surface` colour by default, so it reads as a cutout on a default surface. On any other background it will be wrong by construction — set `--primitiv-avatar-group-ring-color` to that background's colour, **on the group itself** (the component re-declares its own default, which shadows a value merely inherited from an ancestor)."
          code={() =>
            [
              imports(),
              ``,
              `<div style={{ background: "var(--primitiv-surface-sunken)", padding: "1rem" }}>`,
              `  <AvatarGroup`,
              `    style={{ "--primitiv-avatar-group-ring-color": "var(--primitiv-surface-sunken)" }}`,
              `  >`,
              ...faceLines(FACES.slice(0, 4), { indent: "    " }),
              `  </AvatarGroup>`,
              `</div>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={{ background: "var(--primitiv-surface-sunken)", padding: "1rem", borderRadius: "0.5rem" }}>
              <AvatarGroup
                style={{ ["--primitiv-avatar-group-ring-color" as string]: "var(--primitiv-surface-sunken)" }}
              >
                {faces(FACES.slice(0, 4))}
              </AvatarGroup>
            </div>
          )}
        </InteractiveExample>
      ),
    },
  ],

  accessibility: [
    "**Name the counter.** The `+N` avatar is decorative by default; pass `overflowLabel` so it announces something a person can use (`&quot;3 more people&quot;`, not `&quot;+3&quot;`). Everything else in the group is your `Avatar`s, whose names you control there.",
    "**Decide what each face announces.** These faces are decorative beside their own initials, so the examples pass `alt=\"\"` — a screen reader then skips the images rather than reading a filename or a duplicate name. If a face must be named, put the name on that `Avatar` (an `alt`, or an `aria-label` on its Root), not on the group.",
    "The group is a plain `<div>` with no list semantics — it is a visual arrangement, not a `list`/`listitem` structure. If the collection is meaningful as a list to assistive technology, wrap it in your own labelled `<ul>`/`<li>` around the avatars.",
    "**`size` and `direction` are visual.** `direction` mirrors the layout for RTL but changes nothing about reading order in the accessibility tree; do not use it to convey meaning.",
    "**Tooltips are not built in.** Naming faces on hover would mean the group owning member data, which no Primitiv composite does. Wrap each `Avatar` in your own `Tooltip` when you need names — and remember a tooltip needs a focusable trigger, so those avatars must become buttons or links.",
    "The `--primitiv-avatar-group-ring-color` must match the real background for the cutout illusion to hold; a mismatched ring reads as a coloured outline, which is a visual bug rather than an accessibility one but is worth catching in the same pass.",
  ],
};
