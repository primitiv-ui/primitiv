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
/**
 * A group as Elements markup. With no component to count the children, the
 * page renders the faces it shows (each in an item with a descending z-index,
 * so the first paints on top) and the `+N` counter itself.
 */
const groupHtml = ({
  list = FACES,
  size = "md",
  direction = "ltr",
  max,
  attrs = "",
}: {
  list?: typeof FACES;
  size?: string;
  direction?: string;
  max?: number;
  attrs?: string;
} = {}) => {
  const shown = max !== undefined && list.length > max ? list.slice(0, max) : list;
  const overflow = list.length - shown.length;
  const avatar = (inner: string, extra = "") =>
    `<span class="primitiv-avatar primitiv-avatar--${size} primitiv-avatar--circle${extra}">${inner}</span>`;
  return [
    `<div class="primitiv-avatar-group primitiv-avatar-group--${size} primitiv-avatar-group--${direction}"${attrs}>`,
    ...shown.flatMap((f, i) => [
      `  <span class="primitiv-avatar-group__item" style="z-index: ${shown.length - i}">`,
      `    ${avatar(`<img class="primitiv-avatar__image" src="${f.src}" alt="" onerror="this.remove()"><span class="primitiv-avatar__fallback"><span class="primitiv-avatar__fallback-label">${f.initials}</span></span>`)}`,
      `  </span>`,
    ]),
    ...(overflow > 0
      ? [
          `  <span class="primitiv-avatar-group__item primitiv-avatar-group__item--counter">`,
          `    ${avatar(`<span class="primitiv-avatar__fallback" aria-label="${overflow} more people"><span class="primitiv-avatar__fallback-label">+${overflow}</span></span>`, " primitiv-avatar-group__counter")}`,
          `  </span>`,
        ]
      : []),
    `</div>`,
  ].join("\n");
};

const column = (code: string) =>
  `<div style="display: flex; flex-direction: column; gap: 1rem; align-items: flex-start">${code}</div>`;

export const avatarGroupSpec: ComponentSpec = {
  playground: {
    component: "AvatarGroup",
    snippet: (values, mode) =>
      mode === "elements"
        ? groupHtml({ size: values.size, direction: values.direction })
        : [
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
          elementsCaption={"A row of avatars the group overlaps and rings. Each face sits in a `__item` with a descending `z-index`, so the first face paints on top — the stack reads as something you count into. Give every avatar the group's size."}
          caption="A row of `Avatar`s the group overlaps and rings. The faces are your own elements — the group lays them out but cannot set their `size`, so pass the same `size` to the group **and** to each `Avatar`. Stacking counts *into* the row: the first face paints on top of the second, and so on. The ring between them is drawn in the surface colour so it reads as a cutout, not a border."
          code={(_density, mode) =>
            mode === "elements"
              ? groupHtml({ list: FACES.slice(0, 4) })
              : [imports(), ``, `<AvatarGroup>`, ...faceLines(FACES.slice(0, 4)), `</AvatarGroup>`].join("\n")
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
          elementsCaption={'Show a few faces and fold the rest into a `+N` counter — itself an avatar, in an item carrying `__item--counter` and the `__counter` class. In markup the page decides how many to show, so render the counter with the real count and give it an `aria-label` a person can use: “3 more people”, not “+3”.'}
          caption="`max` shows at most that many faces and folds the rest into a `+N` counter — the counter is itself an `Avatar`, not a `Badge`, so it inherits the ring, size, shape and radius for free (Badge has no neutral tone, and a status colour on an overflow count would be a lie). Give it a real accessible name with `overflowLabel`, since `&quot;+3&quot;` alone tells a screen-reader user nothing."
          code={(_density, mode) =>
            mode === "elements"
              ? groupHtml({ list: TEAM, max: 4 })
              : [
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
          elementsCaption={"Five sizes, each rescaling again with the nearest `data-density` ancestor. The group's size modifier sets the overlap and the ring; give each avatar inside the matching size."}
          elementsPreview={(_density, code) => column(code.split("\n").slice(1, -1).map((l) => l.slice(2)).join("\n"))}
          caption="Five sizes, each rescaling again with the nearest `data-density` ancestor — the same `framed-control/*` scale the `Avatar` itself uses. `size` sets the overlap and ring width; the reminder bears repeating because it is the one real gotcha here: the group cannot size its children, so `size` goes on the group **and** every `Avatar` inside it."
          code={(density, mode) =>
            mode === "elements"
              ? [
                  `<div data-density="${density}">`,
                  ...SIZES.map((size) => groupHtml({ list: FACES.slice(0, 3), size })).flatMap((g) =>
                    g.split("\n").map((l) => `  ${l}`),
                  ),
                  `</div>`,
                ].join("\n")
              : [
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
          elementsCaption={'`primitiv-avatar-group--ltr` (the default) advances rightward with the first face on top; `--rtl` mirrors it for a right-to-left locale, so the counter lands on the other end.'}
          elementsPreview={(_density, code) => column(code)}
          caption="`direction` decides which way the stack advances and, with `max`, which end the counter lands on. `&quot;ltr&quot;` (the default) advances rightward with the counter trailing on the right; `&quot;rtl&quot;` mirrors it for a right-to-left locale. Set it to match the reading direction of the surrounding content rather than hand-reordering the children."
          code={(_density, mode) =>
            mode === "elements"
              ? [groupHtml({ list: TEAM, max: 4 }), groupHtml({ list: TEAM, max: 4, direction: "rtl" })].join("\n")
              : [
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
          elementsCaption={'The separating ring is the surface colour by default, so it reads as a cutout on a default surface — and is wrong by construction on any other background. Set `--primitiv-avatar-group-ring-color` to the real background, on the group itself.'}
          elementsPreview={(_density, code) => code.replace('<div style="', '<div style="border-radius: 0.5rem; ')}
          caption="The separating ring is the `surface` colour by default, so it reads as a cutout on a default surface. On any other background it will be wrong by construction — set `--primitiv-avatar-group-ring-color` to that background's colour, **on the group itself** (the component re-declares its own default, which shadows a value merely inherited from an ancestor)."
          code={(_density, mode) =>
            mode === "elements"
              ? [
                  `<div style="background: var(--primitiv-surface-sunken); padding: 1rem">`,
                  ...groupHtml({
                    list: FACES.slice(0, 4),
                    attrs: ` style="--primitiv-avatar-group-ring-color: var(--primitiv-surface-sunken)"`,
                  })
                    .split("\n")
                    .map((l) => `  ${l}`),
                  `</div>`,
                ].join("\n")
              : [
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

  elements: {
    description:
      "A row of overlapping avatars: `primitiv-avatar-group` with a size and a direction, each Avatar in a `__item`, and an optional `+N` counter avatar for the faces you leave out.",
    accessibility: [
      "**Name the counter.** Give its fallback an `aria-label` a person can use — “3 more people”, not “+3”.",
      "**Decide what each face announces.** Faces beside their own names are decorative: `alt=\"\"` on each image.",
      "The group is a plain `<div>` with no list semantics. If the collection matters as a list, put the classes on a `<ul>` with each item an `<li>`.",
      "Direction is visual: it mirrors the layout for right-to-left, but the reading order is the source order.",
      "Tooltips are not built in. To name faces on hover, add your own around each avatar.",
      "Set `--primitiv-avatar-group-ring-color` to the real background, or the cutout reads as a coloured outline.",
    ],
  },

  accessibility: [
    "**Name the counter.** The `+N` avatar is decorative by default; pass `overflowLabel` so it announces something a person can use (`&quot;3 more people&quot;`, not `&quot;+3&quot;`). Everything else in the group is your `Avatar`s, whose names you control there.",
    "**Decide what each face announces.** These faces are decorative beside their own initials, so the examples pass `alt=\"\"` — a screen reader then skips the images rather than reading a filename or a duplicate name. If a face must be named, put the name on that `Avatar` (an `alt`, or an `aria-label` on its Root), not on the group.",
    "The group is a plain `<div>` with no list semantics — it is a visual arrangement, not a `list`/`listitem` structure. If the collection is meaningful as a list to assistive technology, wrap it in your own labelled `<ul>`/`<li>` around the avatars.",
    "**`size` and `direction` are visual.** `direction` mirrors the layout for RTL but changes nothing about reading order in the accessibility tree; do not use it to convey meaning.",
    "**Tooltips are not built in.** Naming faces on hover would mean the group owning member data, which no Primitiv composite does. Wrap each `Avatar` in your own `Tooltip` when you need names — and remember a tooltip needs a focusable trigger, so those avatars must become buttons or links.",
    "The `--primitiv-avatar-group-ring-color` must match the real background for the cutout illusion to hold; a mismatched ring reads as a coloured outline, which is a visual bug rather than an accessibility one but is worth catching in the same pass.",
  ],
};
