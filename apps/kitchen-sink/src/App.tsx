import { useState, type ReactElement } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionContent,
  AccordionTriggerIcon,
  Button,
  Checkbox,
  CodeBlock,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleTriggerIcon,
  CollapsibleContent,
  Divider,
  Drawer,
  DrawerTrigger,
  DrawerPortal,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownCheckboxItem,
  DropdownRadioItem,
  DropdownItemIndicator,
  DropdownLabel,
  DropdownSeparator,
  DropdownGroup,
  DropdownRadioGroup,
  DropdownSub,
  DropdownSubTrigger,
  DropdownSubContent,
  Field,
  FieldLabel,
  FieldDescription,
  FieldErrorText,
  InlineCode,
  Input,
  InputGroup,
  InputGroupLeadingAdornment,
  InputGroupTrailingAdornment,
  Modal,
  ModalTrigger,
  ModalPortal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  ModalClose,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
  PopoverDescription,
  PopoverClose,
  Prose,
  Radio,
  Switch,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  TableCaption,
  TableScrollArea,
  SegmentedControl,
  SegmentedControlItem,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
  TooltipArrow,
} from "./components";
import { Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Close, Minus, Search, Sort } from "@primitiv-ui/icons";
import { useChrome } from "./chrome";
import "./App.css";

/* Simplified, monochrome framework marks for the Segmented Control demo. They
   fill with `currentColor`, so each adopts its segment's foreground (white on the
   selected brand pill, dark on the secondary segments) and themes automatically;
   the registry's `svg` rule sizes them to the item's icon-size token, so they
   scale with `size` and `data-density` for free. Swap in official SVGs as needed. */
function ReactLogo(): ReactElement {
  return (
    <svg viewBox="-11.5 -10.23 23 20.46" aria-hidden="true" fill="currentColor">
      <circle r="2.05" />
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </g>
    </svg>
  );
}

function VueLogo(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M19 3l-7 12L5 3H1l11 19L23 3z" />
      <path d="M15 3l-3 5-3-5H6l6 10 6-10z" opacity="0.55" />
    </svg>
  );
}

function SvelteLogo(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M17.6 4.2c-2-2.9-6-3.8-9-2L4 5.1A5.9 5.9 0 0 0 1.4 9a6.2 6.2 0 0 0 .6 4 5.9 5.9 0 0 0-.9 2.2 6.3 6.3 0 0 0 1.1 4.7c2 2.9 6 3.8 9 2l4.6-2.9a5.9 5.9 0 0 0 2.7-3.9 6.2 6.2 0 0 0-.6-4 5.9 5.9 0 0 0 .9-2.2 6.3 6.3 0 0 0-1.1-4.7zM10.3 19.6a3.6 3.6 0 0 1-3.9-1.4 3.8 3.8 0 0 1-.6-2.8 3.5 3.5 0 0 1 .2-.7l.1-.4.4.3a9.6 9.6 0 0 0 2.8 1.4l.3.1v.3a1.1 1.1 0 0 0 .2.7 1.1 1.1 0 0 0 1.2.4 1 1 0 0 0 .3-.1l4.6-3a1 1 0 0 0 .4-.6 1.1 1.1 0 0 0-.2-.8 1.1 1.1 0 0 0-1.2-.4 1 1 0 0 0-.3.1l-1.7 1.1a3.4 3.4 0 0 1-1 .5 3.6 3.6 0 0 1-3.9-1.4 3.4 3.4 0 0 1-.6-2.6 3.2 3.2 0 0 1 1.5-2.2l4.6-2.9a3.4 3.4 0 0 1 1-.4 3.6 3.6 0 0 1 3.9 1.4 3.8 3.8 0 0 1 .6 2.8 3.5 3.5 0 0 1-.2.7l-.1.4-.4-.3a9.6 9.6 0 0 0-2.8-1.4l-.3-.1v-.3a1.1 1.1 0 0 0-.2-.7 1.1 1.1 0 0 0-1.2-.4 1 1 0 0 0-.3.1l-4.6 3a1 1 0 0 0-.4.6 1.1 1.1 0 0 0 .2.8 1.1 1.1 0 0 0 1.2.4 1 1 0 0 0 .3-.1l1.7-1.1a3.4 3.4 0 0 1 1-.5 3.6 3.6 0 0 1 3.9 1.4 3.4 3.4 0 0 1 .6 2.6 3.2 3.2 0 0 1-1.5 2.2l-4.6 2.9a3.4 3.4 0 0 1-1 .4z" />
    </svg>
  );
}

type Release = { pkg: string; status: string; downloads: number; size: number };

const RELEASES: Release[] = [
  { pkg: "@primitiv-ui/react", status: "Stable", downloads: 128430, size: 84.2 },
  { pkg: "@primitiv-ui/tokens", status: "Stable", downloads: 96210, size: 12.7 },
  { pkg: "@primitiv-ui/icons", status: "Stable", downloads: 74880, size: 41.3 },
  { pkg: "primitiv", status: "Beta", downloads: 18540, size: 5.1 },
  { pkg: "@primitiv-ui/harmoni", status: "Alpha", downloads: 4320, size: 156.9 },
];

type Align = "start" | "center" | "end";

const TABLE_COLUMNS: {
  key: keyof Release;
  label: string;
  align: Align;
  numeric?: boolean;
}[] = [
  { key: "pkg", label: "Package", align: "start" },
  { key: "status", label: "Status", align: "center" },
  { key: "downloads", label: "Downloads", align: "end", numeric: true },
  { key: "size", label: "Size (kB)", align: "end", numeric: true },
];

function Section({
  title,
  children,
  column = false,
}: {
  title: string;
  children: ReactElement | ReactElement[];
  column?: boolean;
}) {
  return (
    <section className="kitchen-sink__section">
      <h2>{title}</h2>
      <div
        className={
          column
            ? "kitchen-sink__section-body kitchen-sink__section-body--column"
            : "kitchen-sink__section-body"
        }
      >
        {children}
      </div>
    </section>
  );
}

// The twelve Popover placements, grouped by side (three per row in the demo
// grid): top · right · bottom · left, each with start / center / end.
const POPOVER_PLACEMENTS = [
  "top-start",
  "top",
  "top-end",
  "right-start",
  "right",
  "right-end",
  "bottom-start",
  "bottom",
  "bottom-end",
  "left-start",
  "left",
  "left-end",
] as const;

const DRAWER_SIDES = ["left", "right", "top", "bottom"] as const;

// Tooltip demo: one per side (default tone) plus an inverted-tone example.
const TOOLTIP_DEMOS = [
  { placement: "top", tone: "default", label: "Top" },
  { placement: "right", tone: "default", label: "Right" },
  { placement: "bottom", tone: "default", label: "Bottom" },
  { placement: "left", tone: "default", label: "Left" },
  { placement: "top", tone: "inverted", label: "Inverted" },
] as const;

export function App(): ReactElement {
  // Density and theme are ambient (applied on <html> by the shell's
  // ChromeProvider); this page only needs `size`, which it threads as a prop to
  // the components that expose a size axis.
  const { size } = useChrome();
  // Popover and Modal panels have no `xs` size (they start at `sm`), so clamp the
  // shared control's `xs` down to `sm` for those overlay surfaces.
  const overlaySize = size === "xs" ? "sm" : size;
  const [sort, setSort] = useState<{ key: keyof Release; dir: "asc" | "desc" }>({
    key: "downloads",
    dir: "desc",
  });
  // Dropdown demo state — controlled so the check / dash / dot indicators reflect
  // real selection as you toggle them (menus stay open via onSelect preventDefault).
  const [ddSidebar, setDdSidebar] = useState(true);
  const [ddStatusBar, setDdStatusBar] = useState(false);
  const [ddPanels, setDdPanels] = useState<boolean | "indeterminate">("indeterminate");
  const [ddSortOrder, setDdSortOrder] = useState("modified");
  const [framework, setFramework] = useState("react");

  const sortedReleases = [...RELEASES].sort((a, b) => {
    const av = a[sort.key];
    const bv = b[sort.key];
    const cmp =
      typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv));
    return sort.dir === "asc" ? cmp : -cmp;
  });

  const toggleSort = (key: keyof Release) =>
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" },
    );

  return (
    <div className="kitchen-sink">
      <Prose asChild>
        <article>
          <h1>Heading 1 - Primitiv Kitchen Sink</h1>
          <p>
            Every component the registry currently carries, installed exactly
            as a consumer would via <code>primitiv-ui</code>: <code>npm
              create primitiv-ui</code>, then <code>primitiv add --all</code>,
            in CSS mode with the default settings. Nothing here imports{" "}
            <code>@primitiv-ui/react</code> directly — every component below
            comes from <code>./components</code>, the styled surface the CLI
            copied in.
          </p>
          <h2>Heading 2 - Typography</h2>
          <p>
            This paragraph, and the headings around it, are wrapped in{" "}
            <Prose asChild>
              <span>a nested inline note</span>
            </Prose>{" "}
            just to show <strong>strong</strong>, <em>emphasis</em>, and{" "}
            <code>inline code</code> together. The flow rhythm gives tighter
            spacing below a heading than above it. Nothing in this article sets
            its own spacing — every gap comes from the <code>.primitiv-flow</code>{" "}
            owl, so the rhythm is the demonstration.
          </p>
          <h3>Heading 3 - Inline text-level marks</h3>
          <p>
            Body copy threads a <a href="#inline">hyperlink</a> through{" "}
            <strong>strong importance</strong> and <b>stylistically bold</b>{" "}
            runs, <em>stressed emphasis</em> beside <i>alternate-voice italic</i>,
            a <mark>highlighted phrase</mark>, tracked{" "}
            <del>deleted</del> and <ins>inserted</ins> edits, an{" "}
            <s>obsolete</s> price, an <u>annotated</u> span, an{" "}
            <abbr title="Design Tokens Community Group">DTCG</abbr>{" "}
            abbreviation, some <small>small print</small>, the formula
            H<sub>2</sub>O next to E = mc<sup>2</sup>, an inline{" "}
            <q>quotation with curly marks</q>, a <cite>Cited Work</cite>, a{" "}
            <dfn>defined term</dfn>, the shortcut <kbd>Ctrl</kbd> +{" "}
            <kbd>K</kbd>, sample output <samp>Done.</samp>, a variable{" "}
            <var>x</var>, and a <time dateTime="2026-07-03">3 July 2026</time>{" "}
            timestamp.
          </p>
          <h3>Heading 3 - Inline code, sized</h3>
          <p>
            The bare <code>&lt;code&gt;</code> element above is fixed at the md
            step. The <InlineCode size={size}>InlineCode</InlineCode> component adds a size
            axis — these snippets{" "}
            <InlineCode size={size}>npm create primitiv-ui</InlineCode>,{" "}
            <InlineCode size={size}>useState</InlineCode> and{" "}
            <InlineCode size={size}>--primitiv-flow-normal</InlineCode> track the
            Size control above, and every size still densifies with the Density
            control.
          </p>
          <h3>Heading 3 - An unordered list</h3>
          <ul>
            <li>Hairline rows, no boxes</li>
            <li>Semantic tokens only</li>
            <li>Density scales every control further</li>
          </ul>
          <h3>Heading 3 - An ordered list</h3>
          <ol>
            <li>Install the CLI</li>
            <li>Add every component</li>
            <li>Flip the switches above</li>
          </ol>
          <h3>Heading 3 - A description list</h3>
          <dl>
            <dt>Primitiv</dt>
            <dd>The product — the design system a consumer installs.</dd>
            <dt>Harmoni</dt>
            <dd>The palette-generation engine underneath it.</dd>
          </dl>
          <h3>Heading 3 - A code block</h3>
          <pre>
            <code>{`npm create primitiv-ui@latest
cd my-app
primitiv add --all`}</code>
          </pre>
          <h4>Heading 4 - A blockquote</h4>
          <blockquote>
            <p>The stable surface is the contract, not the values.</p>
          </blockquote>
          <h4>Heading 4 - A figure</h4>
          <figure>
            <svg
              viewBox="0 0 320 120"
              role="img"
              aria-label="A stepped band of the current text colour"
              style={{
                display: "block",
                inlineSize: "50%",
                blockSize: "auto",
                borderRadius: "var(--primitiv-radii-8)",
              }}
            >
              <rect x="0" width="64" height="120" fill="currentColor" opacity="0.6" />
              <rect x="64" width="64" height="120" fill="currentColor" opacity="0.45" />
              <rect x="128" width="64" height="120" fill="currentColor" opacity="0.3" />
              <rect x="192" width="64" height="120" fill="currentColor" opacity="0.18" />
              <rect x="256" width="64" height="120" fill="currentColor" opacity="0.1" />
            </svg>
            <figcaption>
              Figure 1 - the caption sits below its media in the muted body-sm
              face.
            </figcaption>
          </figure>
          <h4>Heading 4 - An address</h4>
          <address>
            Primitiv UI
            <br />
            Contact:{" "}
            <a href="mailto:hello@primitiv-ui.dev">hello@primitiv-ui.dev</a>
          </address>
          <hr />
          <h5>Heading level 5</h5>
          <h6>Heading level 6</h6>
        </article>
      </Prose>

      <Section title="Button">
        <Button variant="primary" size={size}>
          <ChevronLeft />
          Primary
          <ChevronRight />
        </Button>
        <Button variant="secondary" size={size}>
          <ChevronLeft />
          Secondary
          <ChevronRight />
        </Button>
        <Button variant="ghost" size={size}>
          <ChevronLeft />
          Ghost
          <ChevronRight />
        </Button>
        <Button variant="danger" size={size}>
          <ChevronLeft />
          Danger
          <ChevronRight />
        </Button>
        <Button variant="link" size={size}>
          <ChevronLeft />
          Link
          <ChevronRight />
        </Button>
      </Section>

      {/* One menu exercising every part: a labelled Group of Items (with keyboard
          shortcuts via the row's space-between), CheckboxItems (check / dash mixed)
          and a RadioGroup (dot) through ItemIndicators, Separators, and a THREE-level
          nested submenu. Positioning is pure CSS anchor positioning — the trigger and
          every SubTrigger declare a unique `anchor-name`, each panel a matching
          `position-anchor`; logical anchor(start/end) means it flips for RTL for free,
          and position-try-fallbacks fold submenus back on viewport overflow. */}
      <Section title="Dropdown" column>
        <p className="kitchen-sink__note">
          One menu-button dropdown with every part — items, checkbox / radio items,
          labels, separators, and a three-level nested submenu. Open it and arrow
          into <InlineCode size={size}>Open Recent →</InlineCode> to watch the
          submenus anchor and flip.
        </p>
        <Dropdown>
          <DropdownTrigger asChild>
            <Button variant="secondary" size={size} style={{ anchorName: "--ks-dd" }}>
              Menu
              <ChevronDown aria-hidden="true" />
            </Button>
          </DropdownTrigger>
          <DropdownContent size={size} style={{ positionAnchor: "--ks-dd" }}>
            <DropdownGroup>
              <DropdownLabel>File</DropdownLabel>
              <DropdownItem>
                New file
                <span style={{ color: "var(--primitiv-content-muted)" }}>⌘N</span>
              </DropdownItem>
              <DropdownItem>
                Open…
                <span style={{ color: "var(--primitiv-content-muted)" }}>⌘O</span>
              </DropdownItem>
              <DropdownItem>
                Save
                <span style={{ color: "var(--primitiv-content-muted)" }}>⌘S</span>
              </DropdownItem>
            </DropdownGroup>

            <DropdownSeparator />

            <DropdownLabel>View</DropdownLabel>
            <DropdownCheckboxItem
              checked={ddSidebar}
              onCheckedChange={setDdSidebar}
              onSelect={(e) => e.preventDefault()}
            >
              <DropdownItemIndicator>
                <Check aria-hidden="true" />
              </DropdownItemIndicator>
              Show sidebar
            </DropdownCheckboxItem>
            <DropdownCheckboxItem
              checked={ddStatusBar}
              onCheckedChange={setDdStatusBar}
              onSelect={(e) => e.preventDefault()}
            >
              <DropdownItemIndicator>
                <Check aria-hidden="true" />
              </DropdownItemIndicator>
              Show status bar
            </DropdownCheckboxItem>
            <DropdownCheckboxItem
              checked={ddPanels}
              onCheckedChange={setDdPanels}
              onSelect={(e) => e.preventDefault()}
            >
              <DropdownItemIndicator>
                {ddPanels === "indeterminate" ? (
                  <Minus aria-hidden="true" />
                ) : (
                  <Check aria-hidden="true" />
                )}
              </DropdownItemIndicator>
              Show all panels
            </DropdownCheckboxItem>

            <DropdownSeparator />

            <DropdownLabel>Sort by</DropdownLabel>
            <DropdownRadioGroup value={ddSortOrder} onValueChange={setDdSortOrder}>
              {["name", "modified", "size"].map((value) => (
                <DropdownRadioItem
                  key={value}
                  value={value}
                  onSelect={(e) => e.preventDefault()}
                >
                  <DropdownItemIndicator>
                    <span
                      style={{
                        inlineSize: "45%",
                        blockSize: "45%",
                        borderRadius: "var(--primitiv-radii-full, 9999px)",
                        background: "currentColor",
                      }}
                    />
                  </DropdownItemIndicator>
                  {value[0].toUpperCase() + value.slice(1)}
                </DropdownRadioItem>
              ))}
            </DropdownRadioGroup>

            <DropdownSeparator />

            <DropdownSub>
              <DropdownSubTrigger style={{ anchorName: "--ks-dd-s1" }}>
                Open Recent
                <ChevronRight aria-hidden="true" />
              </DropdownSubTrigger>
              <DropdownSubContent size={size} style={{ positionAnchor: "--ks-dd-s1" }}>
                <DropdownItem>project-alpha</DropdownItem>
                <DropdownItem>project-beta</DropdownItem>
                <DropdownSeparator />
                <DropdownSub>
                  <DropdownSubTrigger style={{ anchorName: "--ks-dd-s2" }}>
                    Archived
                    <ChevronRight aria-hidden="true" />
                  </DropdownSubTrigger>
                  <DropdownSubContent size={size} style={{ positionAnchor: "--ks-dd-s2" }}>
                    <DropdownItem>archive-2025</DropdownItem>
                    <DropdownItem>archive-2024</DropdownItem>
                    <DropdownSeparator />
                    <DropdownSub>
                      <DropdownSubTrigger style={{ anchorName: "--ks-dd-s3" }}>
                        Older still
                        <ChevronRight aria-hidden="true" />
                      </DropdownSubTrigger>
                      <DropdownSubContent size={size} style={{ positionAnchor: "--ks-dd-s3" }}>
                        <DropdownItem>archive-2023</DropdownItem>
                        <DropdownItem>archive-2022</DropdownItem>
                      </DropdownSubContent>
                    </DropdownSub>
                  </DropdownSubContent>
                </DropdownSub>
              </DropdownSubContent>
            </DropdownSub>

            <DropdownSeparator />

            <DropdownItem disabled>Archive project</DropdownItem>
          </DropdownContent>
        </Dropdown>
      </Section>

      <Section title="Checkbox" column>
        <Checkbox size={size} defaultChecked aria-label="Subscribe">
          Subscribe to updates
        </Checkbox>
        <Checkbox size={size}>Accept terms</Checkbox>
        <Checkbox size={size} disabled>
          Disabled
        </Checkbox>
      </Section>

      <Section title="Radio" column>
        <Radio name="kitchen-sink-radio" value="a" size={size} defaultChecked>
          Option A
        </Radio>
        <Radio name="kitchen-sink-radio" value="b" size={size}>
          Option B
        </Radio>
        <Radio name="kitchen-sink-radio" value="c" size={size} disabled>
          Disabled option
        </Radio>
      </Section>

      <Section title="Switch" column>
        <Switch size={size} defaultChecked>Wi-Fi</Switch>
        <Switch size={size}>Bluetooth</Switch>
      </Section>

      <Section title="Divider" column>
        <p>Above the horizontal divider.</p>
        <Divider />
        <p>Below the horizontal divider.</p>
        <div className="kitchen-sink__divider-row">
          <p>Left of the vertical divider</p>
          <Divider orientation="vertical" />
          <p>Right of the vertical divider</p>
        </div>
      </Section>

      <Section title="Field" column>
        <Field size={size}>
          <FieldLabel>Email</FieldLabel>
          <Input type="email" size={size} placeholder="you@example.com" />
          <FieldDescription>We won't share it.</FieldDescription>
        </Field>
        <Field size={size}>
          <FieldLabel>Username</FieldLabel>
          <Input type="text" size={size} defaultValue="taken" aria-invalid />
          <FieldErrorText>That username is already taken.</FieldErrorText>
        </Field>
      </Section>

      <Section title="Input Group" column>
        <InputGroup size={size}>
          <InputGroupLeadingAdornment>
            <Search aria-hidden="true" />
          </InputGroupLeadingAdornment>
          <Input aria-label="Search" type="search" placeholder="Search..." />
          <InputGroupTrailingAdornment asChild>
            <Button variant="ghost" size='xs' aria-label="Clear">
              <Close aria-hidden="true" />
            </Button>
          </InputGroupTrailingAdornment>
        </InputGroup>
      </Section>

      <Section title="Tabs" column>
        <Tabs defaultValue="overview" size={size}>
          <TabsList label="Sections">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <p>Overview panel content.</p>
          </TabsContent>
          <TabsContent value="settings">
            <p>Settings panel content.</p>
          </TabsContent>
          <TabsContent value="history">
            <p>History panel content.</p>
          </TabsContent>
        </Tabs>
      </Section>

      <Section title="Accordion" column>
        <Accordion size={size} defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionHeader>
              <AccordionTrigger>
                What is Primitiv?
                <AccordionTriggerIcon>
                  <ChevronDown aria-hidden="true" />
                </AccordionTriggerIcon>
              </AccordionTrigger>
            </AccordionHeader>
            <AccordionContent>
              <Prose>
                <p>
                  Primitiv is a headless component library paired with a styled
                  surface you own outright. The behaviour — focus management,
                  keyboard navigation, ARIA wiring — lives in the headless
                  layer, while the look is a copied stylesheet you are free to
                  re-theme.
                </p>
                <p>
                  Every value is a design token, so a single set of custom
                  properties re-skins the whole system across size, density and
                  colour mode.
                </p>
              </Prose>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionHeader>
              <AccordionTrigger>
                What is Harmoni?
                <AccordionTriggerIcon>
                  <ChevronDown aria-hidden="true" />
                </AccordionTriggerIcon>
              </AccordionTrigger>
            </AccordionHeader>
            <AccordionContent>
              <Prose>
                <p>
                  Harmoni is the palette generation engine underneath Primitiv —
                  a Rust core compiled to WebAssembly that turns a brand colour
                  into a full, perceptually even ramp.
                </p>
                <p>
                  It handles light and dark modes, neutral and soft-neutral
                  ramps, brand-hue tinting, and an OKLCH picker for dialling in
                  the exact anchor colours — all from one input.
                </p>
                <p>
                  Because the panels above are different lengths, opening each
                  one animates the grid to its own natural height.
                </p>
              </Prose>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Section>

      <Section title="Collapsible" column>
        {/* Three visual dressings sharing one open/close mechanism (RFC 0019 dep):
            plain (bare row), card (bordered box, its own seam divider once open),
            and inline (link-styled trigger + collapsedHeight read-more, complete
            with the bottom fade that disappears once fully open). */}
        <Collapsible size={size} variant="plain" defaultOpen>
          <CollapsibleTrigger>
            What is Primitiv?
            <CollapsibleTriggerIcon>
              <ChevronDown aria-hidden="true" />
            </CollapsibleTriggerIcon>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Prose>
              <p>
                Primitiv is a headless component library paired with a styled
                surface you own outright — the same behaviour Accordion uses,
                for a single panel instead of a stacked list.
              </p>
            </Prose>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible size={size} variant="card">
          <CollapsibleTrigger>
            Advanced settings
            <CollapsibleTriggerIcon>
              <ChevronDown aria-hidden="true" />
            </CollapsibleTriggerIcon>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Prose>
              <p>
                The card dressing encloses the trigger and panel in one
                bordered, radiused box — opening it reveals a hairline seam in
                place of the whitespace gap the other two dressings use.
              </p>
            </Prose>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible size={size} variant="inline">
          <CollapsibleTrigger>
            Read more
            <CollapsibleTriggerIcon>
              <ChevronDown aria-hidden="true" />
            </CollapsibleTriggerIcon>
          </CollapsibleTrigger>
          <CollapsibleContent collapsedHeight={72}>
            <Prose>
              <p>
                Harmoni is the palette generation engine underneath Primitiv —
                a Rust core compiled to WebAssembly that turns a brand colour
                into a full, perceptually even ramp. It handles light and dark
                modes, neutral and soft-neutral ramps, brand-hue tinting, and
                an OKLCH picker for dialling in the exact anchor colours — all
                from one input.
              </p>
              <p>
                Because a fixed <code>collapsedHeight</code> is set, this panel
                stays visible while closed — clamped to a short preview with a
                bottom fade — instead of hiding completely. Opening it reveals
                the rest of the passage and the fade disappears.
              </p>
            </Prose>
          </CollapsibleContent>
        </Collapsible>
      </Section>

      <Section title="Toggle Group">
        <ToggleGroup type="single" size={size} defaultValue="left" aria-label="Alignment">
          <ToggleGroupItem value="left">Left</ToggleGroupItem>
          <ToggleGroupItem value="center">Center</ToggleGroupItem>
          <ToggleGroupItem value="right">Right</ToggleGroupItem>
        </ToggleGroup>
      </Section>

      <Section title="Segmented Control" column>
        {/* Single-select value picker (RadioGroup semantics): exactly one segment
            is always selected — the brand-filled one — the rest secondary. The
            leading logos are plain SVG children — the registry sizes them to the
            item's icon-size token, so they scale with `size` + density. */}
        <SegmentedControl
          size={size}
          value={framework}
          onValueChange={setFramework}
          aria-label="Framework"
        >
          <SegmentedControlItem value="react">
            <ReactLogo />
            React
          </SegmentedControlItem>
          <SegmentedControlItem value="vue">
            <VueLogo />
            Vue
          </SegmentedControlItem>
          <SegmentedControlItem value="svelte">
            <SvelteLogo />
            Svelte
          </SegmentedControlItem>
        </SegmentedControl>
        {/* Justified — segments share the track width equally. */}
        <SegmentedControl
          size={size}
          justify="justified"
          defaultValue="week"
          aria-label="Range"
        >
          <SegmentedControlItem value="day">Day</SegmentedControlItem>
          <SegmentedControlItem value="week">Week</SegmentedControlItem>
          <SegmentedControlItem value="month">Month</SegmentedControlItem>
        </SegmentedControl>
      </Section>

      <Section title="Table" column>
        {/* Wrapped in TableScrollArea so a wide table scrolls horizontally within
            its own area on narrow viewports instead of forcing the page wider. */}
        <TableScrollArea>
          <Table size={size}>
            <TableCaption>Package downloads this month — click a header to sort.</TableCaption>
            <TableHead>
              <TableRow>
                {TABLE_COLUMNS.map((col) => {
                  const active = sort.key === col.key;
                  return (
                    <TableHeader
                      key={col.key}
                      className={`ks-table__align-${col.align}`}
                      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                    >
                      <button
                        type="button"
                        className="ks-table__sort"
                        onClick={() => toggleSort(col.key)}
                      >
                        <span>{col.label}</span>
                        {active ? (
                          sort.dir === "asc" ? (
                            <ChevronUp aria-hidden="true" />
                          ) : (
                            <ChevronDown aria-hidden="true" />
                          )
                        ) : (
                          <Sort className="ks-table__sort-idle" aria-hidden="true" />
                        )}
                      </button>
                    </TableHeader>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedReleases.map((r) => (
                <TableRow key={r.pkg}>
                  {TABLE_COLUMNS.map((col) => (
                    <TableCell key={col.key} className={`ks-table__align-${col.align}`}>
                      {col.numeric ? (r[col.key] as number).toLocaleString() : r[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableScrollArea>
      </Section>

      <Section title="Code Block" column>
        <CodeBlock
          size={size}
          language="tsx"
          filename="ramp.ts"
          showLineNumbers
          code={`import { generate } from "@primitiv-ui/harmoni";

const STEPS = 11;

export function ramp(hue: number, chroma = 0.12) {
  return generate({ hue, chroma, steps: STEPS })
    .filter((s) => s.inGamut)
    .map((s) => s.hex);
}`}
        />

        <CodeBlock.Tabs defaultValue="npm" size={size}>
          <CodeBlock.Header>
            <CodeBlock.List label="Install with">
              <CodeBlock.Trigger value="npm">npm</CodeBlock.Trigger>
              <CodeBlock.Trigger value="pnpm">pnpm</CodeBlock.Trigger>
              <CodeBlock.Trigger value="yarn">yarn</CodeBlock.Trigger>
              <CodeBlock.Trigger value="bun">bun</CodeBlock.Trigger>
            </CodeBlock.List>
            <CodeBlock.Copy>Copy</CodeBlock.Copy>
          </CodeBlock.Header>
          <CodeBlock.Content value="npm" language="bash" code="npm i @primitiv-ui/react" />
          <CodeBlock.Content value="pnpm" language="bash" code="pnpm add @primitiv-ui/react" />
          <CodeBlock.Content value="yarn" language="bash" code="yarn add @primitiv-ui/react" />
          <CodeBlock.Content value="bun" language="bash" code="bun add @primitiv-ui/react" />
        </CodeBlock.Tabs>
      </Section>

      <Section title="Modal">
        <Modal>
          <ModalTrigger asChild>
            <Button variant="primary" size={size}>Open modal</Button>
          </ModalTrigger>
          <ModalPortal forceMount>
            <ModalContent size={overlaySize}>
              <ModalHeader>
                <ModalTitle>Confirm</ModalTitle>
                <ModalClose asChild>
                  <Button variant="ghost" size="sm" aria-label="Close">
                    <Close aria-hidden="true" />
                  </Button>
                </ModalClose>
              </ModalHeader>
              <ModalBody>
                  <ModalDescription>
                    This dialog is portalled to <InlineCode size={size}>document.body</InlineCode>,
                    which is why <InlineCode size={size}>data-theme</InlineCode> lives on{" "}
                    <InlineCode size={size}>&lt;html&gt;</InlineCode> above, not on this page&apos;s
                    wrapper.
                  </ModalDescription>
              </ModalBody>
              <ModalFooter>
                <ModalClose asChild>
                  <Button variant="secondary">Cancel</Button>
                </ModalClose>
                <Button variant="primary">Confirm</Button>
              </ModalFooter>
            </ModalContent>
          </ModalPortal>
        </Modal>
      </Section>

      {/* One uncontrolled drawer per edge. Triggers take the raw `size`; the panels
          take `width` (the drawer's own xs–xl cross-axis, off the size/* scale),
          threaded from the same control — it has an xs step, so no clamp needed. */}
      <Section title="Drawer">
        {DRAWER_SIDES.map((side) => (
          <Drawer key={side}>
            <DrawerTrigger asChild>
              <Button variant="secondary" size={size}>
                From {side}
              </Button>
            </DrawerTrigger>
            <DrawerPortal forceMount>
              <DrawerContent side={side} width={size}>
                <DrawerHeader>
                  <DrawerTitle>{side[0].toUpperCase() + side.slice(1)} drawer</DrawerTitle>
                  <DrawerClose asChild>
                    <Button variant="ghost" size="sm" aria-label="Close">
                      <Close aria-hidden="true" />
                    </Button>
                  </DrawerClose>
                </DrawerHeader>
                <DrawerBody>
                  <DrawerDescription>
                    A dialog that slides in from the {side} edge. It reuses the{" "}
                    <InlineCode size={size}>Modal</InlineCode> machinery — focus trap,{" "}
                    <InlineCode size={size}>Esc</InlineCode>, and click-outside — and adds
                    only the <InlineCode size={size}>side</InlineCode> axis.
                  </DrawerDescription>
                  <p>
                    The body is the region that scrolls when its content overflows, so the
                    header and footer stay pinned to the panel edges.
                  </p>
                </DrawerBody>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button variant="secondary">Cancel</Button>
                  </DrawerClose>
                  <Button variant="primary">Save</Button>
                </DrawerFooter>
              </DrawerContent>
            </DrawerPortal>
          </Drawer>
        ))}
      </Section>

      <Section title="Popover" column>
        <p className="kitchen-sink__note">
          Click any trigger to open its placement (one at a time — the panels are
          native <InlineCode size={size}>popover=&quot;auto&quot;</InlineCode>). Panel + arrow
          track the Size and Density controls above.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, max-content)",
            gap: "2rem 1.5rem",
            justifyContent: "start",
          }}
        >
          {POPOVER_PLACEMENTS.map((placement) => (
            <Popover key={placement}>
              <PopoverTrigger asChild>
                <Button
                  variant="secondary"
                  size={size}
                  style={{ anchorName: `--ks-pop-${placement}` }}
                >
                  {placement}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                placement={placement}
                size={overlaySize}
                style={{ positionAnchor: `--ks-pop-${placement}` }}
              >
                <PopoverTitle>{placement}</PopoverTitle>
                <PopoverDescription>
                  Placement <InlineCode size={size}>{placement}</InlineCode>.
                </PopoverDescription>
                <PopoverClose asChild>
                  <Button variant="ghost" size="sm" aria-label="Close">
                    <Close aria-hidden="true" />
                  </Button>
                </PopoverClose>
              </PopoverContent>
            </Popover>
          ))}
        </div>
      </Section>

      {/* Hover / focus a trigger to show its tooltip. Each is anchor-wired
          (unique anchor-name ↔ position-anchor) like the popovers; the Portal AND
          the Content are force-mounted (both gate on it independently) so the exit
          animation can play. A TooltipProvider ancestor is REQUIRED — it holds the
          shared hover-delay context. */}
      <Section title="Tooltip">
        <TooltipProvider delayDuration={200}>
          {TOOLTIP_DEMOS.map(({ placement, tone, label }) => {
          const anchor = `--ks-tip-${tone}-${placement}`;
          return (
            <Tooltip key={`${tone}-${placement}`}>
              <TooltipTrigger asChild>
                <Button variant="secondary" size={size} style={{ anchorName: anchor }}>
                  {label}
                </Button>
              </TooltipTrigger>
              <TooltipPortal forceMount>
                <TooltipContent
                  forceMount
                  placement={placement}
                  tone={tone}
                  size={overlaySize}
                  style={{ positionAnchor: anchor }}
                >
                  {label} tooltip
                  <TooltipArrow />
                </TooltipContent>
              </TooltipPortal>
            </Tooltip>
          );
          })}
        </TooltipProvider>
      </Section>
    </div>
  );
}
