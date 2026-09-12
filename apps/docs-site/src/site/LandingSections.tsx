"use client";

import Link from "next/link";

import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/card";
import { Grid } from "@/components/grid";
import { List } from "@/components/list";
import { InlineCode } from "@/components/inline-code";
import { Stack } from "@/components/stack";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScrollArea,
} from "@/components/table";
import { getDocs } from "@/lib/docs-data";

import { InstallTabs } from "./InstallTabs";
import { LandingSection } from "./LandingSection";
import { label, useMode } from "./preferences";

import { A11yAnimation } from "@/site/A11yAnimation";
import { ThemedImage } from "@/site/ThemedImage";

import "./landing-sections.css";

/* ── Choose your path ─────────────────────────────────────────────────────── */

const PATHS = [
  {
    title: "Headless",
    description:
      "Behaviour, props and a11y only. No CSS — you own the styling. Ships as an npm package.",
    install: { kind: "install", target: "@primitiv-ui/react" },
    link: { title: "Headless docs", href: "/components/" },
  },
  {
    title: "Styled (registry)",
    description:
      "Headless props plus the style-layer contract and CSS variables. Copied into your app.",
    install: { kind: "exec", target: "primitiv add button" },
    link: { title: "Styled docs", href: "/components/button/" },
  },
  {
    title: "Figma",
    description:
      "Spec and redline content — the design library for building in Figma, powered by Harmoni.",
    cta: "Open the Figma library",
    link: { title: "Design in Figma", href: "/figma/" },
  },
] as const;

export const ChooseYourPath = () => (
  <LandingSection
    id="choose-your-path"
    overline="Choose your path"
    heading="How you consume Primitiv"
  >
    {/* `columns={3}` was a fixed three at every width. At 768 that gave three
        ~188px cards, and each holds an install block whose four package-manager
        tabs need 213px on their own — so the tab strip overflowed its own card
        header on every tablet. Three columns need the full `xl` container to
        give each card room for that block; at `lg` two still do, and below that
        they stack. Same class of bug as the footer's `columns={4}`. */}
    <Grid columns={{ base: 1, lg: 2, xl: 3 }} gap="lg">
      {PATHS.map((path) => (
        <Card key={path.title} className="docs-path-card">
          {/* CardHeader goes INSIDE CardContent: `.primitiv-card__content` owns
              ALL the padding ("Do not reintroduce per-region padding" — card
              styles.css §1), so a header outside it sits flush to the card edge
              and reads as though it were absolutely positioned. */}
          <CardContent>
            <Stack gap="md">
              <CardHeader>
                <CardTitle>{path.title}</CardTitle>
              </CardHeader>
              <CardDescription>{path.description}</CardDescription>

              {"install" in path ? (
                <InstallTabs
                  kind={path.install.kind}
                  target={path.install.target}
                />
              ) : (
                <Button variant="secondary" size="sm">
                  {path.cta}
                </Button>
              )}

              <Link className="docs-path-link" href={path.link.href}>
                {path.link.title} <span aria-hidden="true">→</span>
              </Link>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Grid>
  </LandingSection>
);



/* ── Section 6 — Figma and code ────────────────────────────────────────────── */

/* Copy verbatim from docs-site-home-copy.md §6. The image is full content
   width rather than a two-column split: its own composition is already a
   Figma half, a token spine and a browser half, so putting it beside text
   would halve the thing the section exists to let you compare. */
export const DesignAndBuild = () => (
  <LandingSection
    id="design-and-build"
    overline="Design and build"
    heading="Your design file and your code are built from the same tokens."
    lede={
      <p className="docs-lede">
        The Figma library is not a drawing of the components. Both are built
        from one set of tokens, so they cannot quietly disagree about a colour
        or a spacing value.
      </p>
    }
    band
  >
    <Stack gap="xl">
      <Stack gap="md">
        <p className="docs-lede">
          Designers work with the real component sets, at every size and
          density. Developers get the same components in code. When a token
          changes, both move.
        </p>
      </Stack>

      {/* No Figure.Caption: the asset already carries "The same three tokens,
          on both sides." baked into the composite, and adding the spec's
          caption here rendered it twice. The alt text carries the description
          for anyone who cannot see it. */}
      <ThemedImage
        base="/illustrations/figma-01"
        ratio="2 / 1"
        alt="The Button component set open in Figma beside the same buttons rendered in a browser, with the three shared token names listed between them. The same three tokens, on both sides."
      />

      <Stack gap="sm">
        <p className="docs-commitment-note">
          Two things the design file cannot match exactly, and it is better to
          know now. Figma cannot express CSS grid inside a component slot, so
          the Grid component is approximated with wrapping. And Aspect Ratio is
          fixed-pixel in Figma rather than fluid. Everything else is the same on
          both sides.
        </p>
        <Link className="docs-path-link" href="/figma/">
          Design in Figma →
        </Link>
      </Stack>
    </Stack>
  </LandingSection>
);

/* ── Section 9 — Accessibility ─────────────────────────────────────────────── */

/* Copy is verbatim from the settled record (docs-site-home-copy.md §9); the
   four commitments are deliberately concrete claims rather than a badge. */
const COMMITMENTS = [
  {
    title: "Every interactive component follows its WAI-ARIA pattern.",
    note: "Not an approximation of it.",
  },
  {
    title: "Keyboard support is part of the component.",
    note: "Arrow keys, Home and End, Escape, type-ahead. Not something you add afterwards.",
  },
  {
    title: "Contrast is guaranteed by the engine that generates the colour.",
    note: "Not spot-checked once the palette is chosen.",
  },
  {
    title: "Focus is always visible.",
    note: "On every control, in both themes.",
  },
] as const;

export const AccessibleByDefault = () => (
  <LandingSection
    id="accessibility"
    overline="Built in"
    heading="Accessible by default, not by audit."
    lede={
      <p className="docs-lede">
        Accessibility is not a pass someone does at the end here. It is a
        property of the components, checked continuously.
      </p>
    }
    band
  >
    <Stack gap="xl">
      {/* The animation sits beside the commitments on desktop and beneath them
          on narrow screens, where a 4:3 video next to text would leave neither
          readable. */}
      <Grid columns={{ base: 1, md: 2 }} gap="xl">
        {/* Measured on the v3 frame: 16 between commitments, 12 from each
            h4 to its note (`flow/tight`). */}
        <Stack gap="md">
          {COMMITMENTS.map((commitment) => (
            <Stack className="docs-commitment" key={commitment.title}>
              <h3 className="docs-commitment-title">{commitment.title}</h3>
              <p className="docs-commitment-note">{commitment.note}</p>
            </Stack>
          ))}
        </Stack>

        <A11yAnimation />
      </Grid>
    </Stack>
  </LandingSection>
);

/* ── Documentation map ────────────────────────────────────────────────────── */

/*
 * The map's own entries, now that the eight content routes exist.
 *
 * Every href here was a `/#anchor` pointing at nothing — not a section of this
 * page, not a page anywhere (docs-site-content-plan.md §4.6), which is exactly
 * what a documentation *map* must not do. Recipes/Guides and Changelog/Releases
 * came out instead of being re-pointed: both are deferred (D3) and neither has a
 * page in any plan, so the right-hand column is Design in Figma alone.
 */
const MAP_LEFT = [
  { title: "Start Here", href: "/start-here/" },
  {
    title: "Concepts",
    href: "/concepts/what-primitiv-is/",
    children: [
      { title: "What Primitiv is", href: "/concepts/what-primitiv-is/" },
      { title: "Tokens & theming model", href: "/concepts/tokens/" },
      { title: "Density & the Context system", href: "/concepts/density/" },
      { title: "Composition patterns", href: "/concepts/composition/" },
      { title: "Accessibility commitments", href: "/concepts/accessibility/" },
    ],
  },
  { title: "Components", href: "/components/", modeScoped: true },
  { title: "Registry & CLI", href: "/registry-cli/" },
] as const;

const MAP_RIGHT = [{ title: "Design in Figma", href: "/figma/" }] as const;

type MapEntry = {
  title: string;
  href: string;
  modeScoped?: boolean;
  children?: readonly { title: string; href: string }[];
};

/*
 * The registry `List`, not a hand-rolled <ul>.
 *
 * Three things it brings that the hand-rolled version had to fake or got wrong:
 *
 * 1. It owns the inter-item rhythm through `--primitiv-list-item-gap`, and
 *    zeroes `margin-block` on its own items to cancel the base layer's
 *    `li + li { margin-block-start: ... }` prose rule. That rule is why the
 *    hand-rolled lists needed a manual override — List already fixes it, and
 *    its stylesheet documents the doubling it caused (gaps rendered at 2x).
 * 2. `marker={false}` is the real `list-style: none` case: the marker box AND
 *    its gap go, but the element stays a `<ul>`, so an unbulleted list is still
 *    announced as a list.
 * 3. The nested list gets its indent from `--primitiv-list-indent` rather than
 *    a `--docs-*` constant I invented.
 *
 * `indent={false}` on the outer list only: the columns are flush to the grid,
 * while the nested list keeps the default indent to show the hierarchy.
 */
const MapList = ({ entries }: { entries: readonly MapEntry[] }) => (
  <List marker={false} indent={false} size="sm">
    {entries.map((entry) => (
      <List.Item key={entry.title}>
        <Link className="docs-map-link" href={entry.href}>
          {entry.title}
        </Link>
        {entry.modeScoped && (
          <>
            {" "}
            <Badge tone="info" size="xs">
              mode-scoped
            </Badge>
          </>
        )}
        {entry.children && (
          <List marker={false} size="sm">
            {entry.children.map((child) => (
              <List.Item key={child.title}>
                <Link className="docs-map-link" href={child.href}>
                  {child.title}
                </Link>
              </List.Item>
            ))}
          </List>
        )}
      </List.Item>
    ))}
  </List>
);

export const DocumentationMap = () => (
  <LandingSection
    id="documentation-map"
    overline="Documentation map"
    heading="Everything in the docs"
    band
  >
    <Grid columns={2} gap="xl">
      <MapList entries={MAP_LEFT} />
      <MapList entries={MAP_RIGHT} />
    </Grid>
  </LandingSection>
);

/* ── Installing a component ───────────────────────────────────────────────── */

export const ComponentBlock = () => {
  const [mode] = useMode();
  const docs = getDocs("button");
  // First four props only — this is a taste of the component page, not a
  // duplicate of it.
  const rows = docs.headless.subComponents[0].props.slice(0, 4);

  return (
    <LandingSection
      id="component-block"
      overline="On every component page"
      heading="Installing a component"
    >
      <Grid columns={2} gap="xl">
        <Stack gap="md">
          <Stack direction="row" gap="sm" align="center">
            <h3 className="docs-block-title">Button</h3>
            <Badge tone="success" size="sm">
              {docs.status}
            </Badge>
          </Stack>

          {/* Reads the same persisted key as the header's switch, so the two
              cannot disagree — that is the point being demonstrated. */}
          <p className="docs-block-note">
            Reflects the global mode switch — currently {label(mode)}:
          </p>

          {mode === "styled" ? (
            <InstallTabs kind="exec" target="primitiv add button" />
          ) : (
            <InstallTabs kind="install" target="@primitiv-ui/react" />
          )}

          <p className="docs-block-meta">
            import path <InlineCode>@primitiv-ui/react</InlineCode>
          </p>
        </Stack>

        <Stack gap="xs">
          <p className="docs-section-overline">Props</p>
          <TableScrollArea>
            <Table size="sm">
              <TableHead>
                <TableRow>
                  <TableHeader scope="col">Prop</TableHeader>
                  <TableHeader scope="col">Type</TableHeader>
                  <TableHeader scope="col">Default</TableHeader>
                  <TableHeader scope="col">Required</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((prop) => (
                  <TableRow key={prop.name}>
                    <TableCell>
                      <span className="docs-prop-name">{prop.name}</span>
                    </TableCell>
                    <TableCell>
                      <InlineCode size="sm">{prop.type}</InlineCode>
                    </TableCell>
                    <TableCell>
                      {prop.default === null ? (
                        "—"
                      ) : (
                        <InlineCode size="sm">{prop.default}</InlineCode>
                      )}
                    </TableCell>
                    <TableCell>{prop.required ? "yes" : "no"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableScrollArea>
        </Stack>
      </Grid>
    </LandingSection>
  );
};
