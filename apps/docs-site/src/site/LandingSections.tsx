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
    link: { title: "Design in Figma", href: "/#harmoni" },
  },
] as const;

export const ChooseYourPath = () => (
  <LandingSection
    id="choose-your-path"
    overline="Choose your path"
    heading="How you consume Primitiv"
  >
    <Grid columns={3} gap="lg">
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

/* ── Documentation map ────────────────────────────────────────────────────── */

const MAP_LEFT = [
  { title: "Start Here", href: "/" },
  {
    title: "Concepts",
    href: "/#what-primitiv-is",
    children: [
      { title: "What Primitiv is", href: "/#what-primitiv-is" },
      { title: "Tokens & theming model", href: "/#tokens" },
      { title: "Density & the Context system", href: "/#density" },
      { title: "Composition patterns", href: "/#composition" },
      { title: "Accessibility commitments", href: "/#accessibility" },
    ],
  },
  { title: "Components", href: "/components/", modeScoped: true },
  { title: "Registry & CLI", href: "/#cli" },
] as const;

const MAP_RIGHT = [
  { title: "Design in Figma", href: "/#harmoni" },
  { title: "Harmoni", href: "/#harmoni" },
  { title: "Recipes / Guides", href: "/#recipes" },
  { title: "Changelog / Releases", href: "/#changelog" },
] as const;

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
 *    `li + li { margin-block-start: … }` prose rule. That rule is why the
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
