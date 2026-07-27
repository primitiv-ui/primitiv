import {
  Fragment,
  useState,
  type CSSProperties,
  type ReactElement,
} from "react";
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionContent,
  AccordionTriggerIcon,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Checkbox,
  CodeBlock,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleTriggerIcon,
  CollapsibleContent,
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuItemIndicator,
  ContextMenuItemLeading,
  ContextMenuItemLabel,
  ContextMenuItemTrailing,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuRadioGroup,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
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
  DropdownItemLeading,
  DropdownItemLabel,
  DropdownItemTrailing,
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
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuTriggerLabel,
  NavigationMenuTriggerIcon,
  NavigationMenuContent,
  NavigationMenuViewport,
  NavigationMenuIndicator,
  NavigationMenuLink,
  NavigationMenuLinkText,
  NavigationMenuLinkTitle,
  NavigationMenuLinkDescription,
  NavigationMenuLinkLeading,
  NavigationMenuLinkTrailing,
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
  Select,
  SelectTrigger,
  SelectValue,
  SelectLeading,
  SelectIcon,
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemLeading,
  SelectItemLabel,
  SelectItemTrailing,
  SelectGroup,
  SelectGroupLabel,
  SelectSeparator,
  SelectPlaceholder,
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
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Close,
  Copy,
  Delete,
  Download,
  File,
  Folder,
  Grid,
  Minus,
  Search,
  Settings,
  Sort,
  User,
} from "@primitiv-ui/icons";
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

/* Select demo fixtures — the same framework marks the Segmented Control uses,
   reused here as the options' leading slot content. */
const FRAMEWORKS = [
  { value: "react", label: "React", Logo: ReactLogo },
  { value: "vue", label: "Vue", Logo: VueLogo },
  { value: "svelte", label: "Svelte", Logo: SvelteLogo },
] as const;

/* Both row slots at once: a leading mark plus a trailing shortcut or "Soon"
   pill. `soon` doubles as the disabled flag, so the unavailable row stays
   visible and unselectable. */
const RUNTIMES = [
  {
    value: "react",
    label: "React",
    Logo: ReactLogo,
    shortcut: "⌘1",
    soon: false,
  },
  { value: "vue", label: "Vue", Logo: VueLogo, shortcut: "⌘2", soon: false },
  {
    value: "svelte",
    label: "Svelte",
    Logo: SvelteLogo,
    shortcut: "",
    soon: true,
  },
] as const;

const REGIONS = [
  {
    label: "Europe",
    options: [
      { value: "lon", name: "London" },
      { value: "fra", name: "Frankfurt" },
    ],
  },
  {
    label: "North America",
    options: [
      { value: "iad", name: "Virginia" },
      { value: "sfo", name: "San Francisco" },
    ],
  },
] as const;

type Release = { pkg: string; status: string; downloads: number; size: number };

const RELEASES: Release[] = [
  {
    pkg: "@primitiv-ui/react",
    status: "Stable",
    downloads: 128430,
    size: 84.2,
  },
  {
    pkg: "@primitiv-ui/tokens",
    status: "Stable",
    downloads: 96210,
    size: 12.7,
  },
  { pkg: "@primitiv-ui/icons", status: "Stable", downloads: 74880, size: 41.3 },
  { pkg: "primitiv", status: "Beta", downloads: 18540, size: 5.1 },
  {
    pkg: "@primitiv-ui/harmoni",
    status: "Alpha",
    downloads: 4320,
    size: 156.9,
  },
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

// Drives both the section's own anchor id and the "On this page" nav links —
// one computation, so the two can never drift apart.
function sectionSlug(title: string): string {
  return title.toLowerCase().replace(/\s+/g, "-");
}

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
    <section id={sectionSlug(title)} className="kitchen-sink__section">
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

// The "On this page" nav's grouping — the same taxonomy as ROADMAP.md's
// "Components to build" section, so a category means the same thing in both
// places. The page body itself stays alphabetical (see App.tsx's own
// top-of-file note) — a category home for a new component is a judgement call
// only this nav needs to make, not every section on the page. "Typography"
// isn't one of ROADMAP's categories (Code Block is registry-only, no headless
// entry, so it never appears there) — it's this nav's own addition, grouping
// it with the intro article it's a sibling of.
const PAGE_TOC: { category: string; titles: string[] }[] = [
  { category: "Layout", titles: ["Divider"] },
  { category: "Buttons", titles: ["Button"] },
  {
    category: "Forms",
    titles: [
      "Checkbox",
      "Field",
      "Input Group",
      "Radio",
      "Segmented Control",
      "Switch",
    ],
  },
  { category: "Collections & Selection", titles: ["Select"] },
  { category: "Typography", titles: ["Code Block"] },
  {
    category: "Overlays",
    titles: ["Context Menu", "Drawer", "Dropdown", "Modal", "Popover", "Tooltip"],
  },
  {
    category: "Disclosure",
    titles: ["Accordion", "Breadcrumb", "Collapsible", "Tabs"],
  },
  { category: "Navigation", titles: ["Navigation Menu", "Toggle Group"] },
  { category: "Data Display", titles: ["Avatar", "Table"] },
];

// The GitHub Pages deploy switches the app to a HashRouter (see main.tsx —
// GitHub Pages can't fall back to index.html for path-based SPA routes, so
// deep links need the route to live in the hash instead). That means the "#"
// is HashRouter's own path delimiter: a plain `<a href="#button">` changes
// `location.hash` to "button", which HashRouter reads as "navigate to the
// route /button" — no such route exists, so <Routes> renders nothing and the
// page goes blank. Scrolling by hand instead of letting the browser's native
// hash-jump run means this nav never touches location.hash at all.
function scrollToId(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
  event.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// A static, always-expanded table of contents — every entry is permanently
// visible, so this is deliberately a plain nested list rather than the Tree
// component: nothing here ever collapses, so there is no state to own and no
// need for a styled Tree registry surface (which doesn't exist yet — Tree is
// headless-only, see packages/react/src/Tree) just for this. Fixed to the
// viewport's top-right, desktop only; see .kitchen-sink__toc in App.css for
// the breakpoint and the --kitchen-sink-toc-top offset (a fixed value, not
// measured — see the token there).
function PageToc() {
  return (
    <nav className="kitchen-sink__toc" aria-label="Page sections">
      <p className="kitchen-sink__toc-heading">On this page</p>
      <ul className="kitchen-sink__toc-intro">
        <li>
          <a href="#introduction" onClick={(e) => scrollToId(e, "introduction")}>
            Introduction
          </a>
        </li>
      </ul>
      <ul className="kitchen-sink__toc-categories">
        {PAGE_TOC.map(({ category, titles }) => (
          <li key={category}>
            <span className="kitchen-sink__toc-category">{category}</span>
            <ul>
              {titles.map((title) => {
                const id = sectionSlug(title);
                return (
                  <li key={title}>
                    <a href={`#${id}`} onClick={(e) => scrollToId(e, id)}>
                      {title}
                    </a>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
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

// NavigationMenu demo: the docs-site nav from RFC 0019 — two disclosure entries
// with mega-menu panels, plus a plain bar link. Each panel is two columns of
// title + description rows, the shape the Panel Link placement is built for.
const NAV_SECTIONS = [
  {
    value: "concepts",
    label: "Concepts",
    columns: [
      [
        { title: "Tokens", description: "The three-tier token architecture" },
        {
          title: "Density & theming",
          description: "Four densities, light and dark",
        },
      ],
      [
        { title: "Cascade layers", description: "How the CSS layers stack" },
        { title: "Elevation", description: "Shadow and depth hierarchy" },
      ],
    ],
  },
  {
    value: "components",
    label: "Components",
    columns: [
      [
        { title: "Overview", description: "Every component, per mode" },
        { title: "Forms", description: "Input, Select, Checkbox, Radio" },
      ],
      [
        { title: "Overlays", description: "Modal, Drawer, Popover, Tooltip" },
        { title: "Navigation", description: "Tabs, Breadcrumb, this menu" },
      ],
    ],
  },
] as const;

// A single-column panel — the narrow end of the same layout freedom Concepts /
// Components demonstrate at two columns. --primitiv-navigation-menu-content-columns
// defaults to 1fr, so this panel needs no style override at all.
const RESOURCES_LINKS = [
  { title: "GitHub", description: "Source, issues and discussions" },
  { title: "Releases", description: "Version history and changelog" },
  { title: "RFCs", description: "Design decisions, written down" },
  { title: "Contributing", description: "How to propose a change" },
  { title: "License", description: "MIT, and what that means" },
] as const;

// The wide end: a fixed-width brand callout beside three link columns — the
// same per-panel column override as Concepts / Components, just a different
// track list (Radix's own NavigationMenu example carries an identical brand
// callout beside its link grid).
const EXPLORE_COLUMNS = [
  [
    {
      title: "Installation",
      description: "Add the token layer and your first component",
    },
    {
      title: "Quick start",
      description: "A working page in under five minutes",
    },
    { title: "CLI", description: "add, tokens, theme and list" },
    { title: "Theming", description: "Light, dark, and your own brand colour" },
    { title: "FAQ", description: "Common questions, answered" },
  ],
  [
    {
      title: "Forms & controls",
      description: "Input, Select, Checkbox, Radio",
    },
    { title: "Overlays", description: "Modal, Drawer, Popover, Tooltip" },
    { title: "Navigation", description: "Tabs, Breadcrumb, this menu" },
    { title: "Data display", description: "Table, Accordion, Carousel" },
    { title: "Typography", description: "Prose, Blockquote, Code block" },
  ],
  [
    { title: "Discord", description: "Chat with the community" },
    { title: "Blog", description: "Release notes and deep dives" },
    { title: "Showcase", description: "Real products built on Primitiv" },
    { title: "Sponsors", description: "Support the project" },
    { title: "Roadmap", description: "What's shipping next" },
  ],
] as const;

// The composed mobile presentation (RFC 0019 §3): a Drawer shell holding one
// Collapsible per section, reusing NavigationMenuLink so active-state logic is
// written once across both presentations.
const MOBILE_NAV = [
  { label: "Start Here", links: ["Installation", "Quick start"] },
  {
    label: "Concepts",
    links: ["Tokens", "Density & theming", "Cascade layers"],
  },
  { label: "Registry & CLI", links: ["Adding components", "The lockfile"] },
] as const;

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
  const [sort, setSort] = useState<{ key: keyof Release; dir: "asc" | "desc" }>(
    {
      key: "downloads",
      dir: "desc",
    },
  );
  // Dropdown demo state — controlled so the check / dash / dot indicators reflect
  // real selection as you toggle them (menus stay open via onSelect preventDefault).
  const [ddSidebar, setDdSidebar] = useState(true);
  const [ddStatusBar, setDdStatusBar] = useState(false);
  const [ddPanels, setDdPanels] = useState<boolean | "indeterminate">(
    "indeterminate",
  );
  const [ddSortOrder, setDdSortOrder] = useState("modified");
  // Context Menu demo state — same controlled pattern as Dropdown; this menu is
  // themed as a canvas/shape editor's right-click menu rather than a file menu.
  const [cmShowGrid, setCmShowGrid] = useState(true);
  const [cmSnapToGrid, setCmSnapToGrid] = useState(false);
  const [cmLockAspect, setCmLockAspect] = useState<boolean | "indeterminate">(
    "indeterminate",
  );
  const [cmAlign, setCmAlign] = useState("left");
  const [framework, setFramework] = useState("react");
  // Select demo state — controlled so the trigger's mirrored content and the
  // checkmark indicator both track a real selection.
  const [selFramework, setSelFramework] = useState("");
  const [selRuntime, setSelRuntime] = useState("vue");
  const [selRuntimeHiddenTrailing, setSelRuntimeHiddenTrailing] =
    useState("vue");
  const [selRegion, setSelRegion] = useState("");
  const [selFruit, setSelFruit] = useState("");
  const [readMoreOpen, setReadMoreOpen] = useState(false);

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
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );

  return (
    <>
      <PageToc />
      <div className="kitchen-sink">
      <Prose asChild>
        <article id="introduction">
          <h1>Heading 1 - Primitiv Kitchen Sink</h1>
          <p>
            Every component the registry currently carries, installed exactly as
            a consumer would via <code>primitiv-ui</code>:{" "}
            <code>npm create primitiv-ui</code>, then{" "}
            <code>primitiv add --all</code>, in CSS mode with the default
            settings. Nothing here imports <code>@primitiv-ui/react</code>{" "}
            directly — every component below comes from{" "}
            <code>./components</code>, the styled surface the CLI copied in.
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
            its own spacing — every gap comes from the{" "}
            <code>.primitiv-flow</code> owl, so the rhythm is the demonstration.
          </p>
          <h3>Heading 3 - Inline text-level marks</h3>
          <p>
            Body copy threads a <a href="#inline">hyperlink</a> through{" "}
            <strong>strong importance</strong> and <b>stylistically bold</b>{" "}
            runs, <em>stressed emphasis</em> beside{" "}
            <i>alternate-voice italic</i>, a <mark>highlighted phrase</mark>,
            tracked <del>deleted</del> and <ins>inserted</ins> edits, an{" "}
            <s>obsolete</s> price, an <u>annotated</u> span, an{" "}
            <abbr title="Design Tokens Community Group">DTCG</abbr>{" "}
            abbreviation, some <small>small print</small>, the formula H
            <sub>2</sub>O next to E = mc<sup>2</sup>, an inline{" "}
            <q>quotation with curly marks</q>, a <cite>Cited Work</cite>, a{" "}
            <dfn>defined term</dfn>, the shortcut <kbd>Ctrl</kbd> + <kbd>K</kbd>
            , sample output <samp>Done.</samp>, a variable <var>x</var>, and a{" "}
            <time dateTime="2026-07-03">3 July 2026</time> timestamp.
          </p>
          <h3>Heading 3 - Inline code, sized</h3>
          <p>
            The bare <code>&lt;code&gt;</code> element above is fixed at the md
            step. The <InlineCode size={size}>InlineCode</InlineCode> component
            adds a size axis — these snippets{" "}
            <InlineCode size={size}>npm create primitiv-ui</InlineCode>,{" "}
            <InlineCode size={size}>useState</InlineCode> and{" "}
            <InlineCode size={size}>--primitiv-flow-normal</InlineCode> track
            the Size control above, and every size still densifies with the
            Density control.
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
              <rect
                x="0"
                width="64"
                height="120"
                fill="currentColor"
                opacity="0.6"
              />
              <rect
                x="64"
                width="64"
                height="120"
                fill="currentColor"
                opacity="0.45"
              />
              <rect
                x="128"
                width="64"
                height="120"
                fill="currentColor"
                opacity="0.3"
              />
              <rect
                x="192"
                width="64"
                height="120"
                fill="currentColor"
                opacity="0.18"
              />
              <rect
                x="256"
                width="64"
                height="120"
                fill="currentColor"
                opacity="0.1"
              />
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

      {/* Root is a fixed-size clipping frame; only one of Image/Fallback is ever
          visible. The broken-src avatar demonstrates the error status still
          falling back cleanly (the image stays mounted so its load lifecycle
          isn't lost — see Avatar's README — it's just hidden). */}
      <Section title="Avatar">
        <Avatar size={size}>
          <AvatarImage
            src={`${import.meta.env.BASE_URL}avatar-demo.jpg`}
            alt="Ada Lovelace"
          />
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
        <Avatar size={size} shape="square">
          <AvatarImage
            src={`${import.meta.env.BASE_URL}avatar-demo.jpg`}
            alt="Ada Lovelace"
          />
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
        <Avatar size={size}>
          <AvatarImage
            src={`${import.meta.env.BASE_URL}does-not-exist.jpg`}
            alt="Broken image"
          />
          <AvatarFallback>BI</AvatarFallback>
        </Avatar>
        <Avatar size={size}>
          <AvatarFallback>
            <User aria-hidden="true" />
          </AvatarFallback>
        </Avatar>
      </Section>

      {/* Ancestor Links read muted, the trailing Page reads primary — link
          hover previews that same primary weight via a fading underline
          (the decoration sits transparent at rest, so revealing it on hover
          is a colour transition, not a layout shift). Second trail swaps the
          default "/" separator for a custom chevron icon. */}
      <Section title="Breadcrumb" column>
        <Breadcrumb size={size}>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#home">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#library">Library</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Current article</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Breadcrumb size={size}>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#home">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight aria-hidden="true" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href="#library">Library</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight aria-hidden="true" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>Current article</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Section>

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

      <Section title="Checkbox" column>
        <Checkbox size={size} defaultChecked aria-label="Subscribe">
          Subscribe to updates
        </Checkbox>
        <Checkbox size={size}>Accept terms</Checkbox>
        <Checkbox size={size} disabled>
          Disabled
        </Checkbox>
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
          <CodeBlock.Content
            value="npm"
            language="bash"
            code="npm i @primitiv-ui/react"
          />
          <CodeBlock.Content
            value="pnpm"
            language="bash"
            code="pnpm add @primitiv-ui/react"
          />
          <CodeBlock.Content
            value="yarn"
            language="bash"
            code="yarn add @primitiv-ui/react"
          />
          <CodeBlock.Content
            value="bun"
            language="bash"
            code="bun add @primitiv-ui/react"
          />
        </CodeBlock.Tabs>
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

        <Collapsible
          size={size}
          variant="inline"
          open={readMoreOpen}
          onOpenChange={setReadMoreOpen}
        >
          <CollapsibleTrigger>
            {readMoreOpen ? "Show less" : "Show more"}
            <CollapsibleTriggerIcon>
              <ChevronDown aria-hidden="true" />
            </CollapsibleTriggerIcon>
          </CollapsibleTrigger>
          <CollapsibleContent collapsedHeight={72}>
            <Prose>
              <p>
                Harmoni is the palette generation engine underneath Primitiv — a
                Rust core compiled to WebAssembly that turns a brand colour into
                a full, perceptually even ramp. It handles light and dark modes,
                neutral and soft-neutral ramps, brand-hue tinting, and an OKLCH
                picker for dialling in the exact anchor colours — all from one
                input.
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

      {/* Unlike Dropdown, the panel needs no anchor-name to open in the right
          place — the headless layer places Content at the cursor itself. The
          anchor-name / position-anchor pair wired below is the OPTIONAL escape
          hatch that unlocks the @position-try overflow-flip (see styles.css);
          right-click near an edge of the viewport to see it fold back on-screen.
          The submenu still needs real anchor positioning against its
          SubTrigger, same as Dropdown. */}
      <Section title="Context Menu" column>
        <p className="kitchen-sink__note">
          A canvas/shape-editor right-click menu — items with leading icons and
          shortcuts, a disabled row, checkbox items (including a tri-state
          indeterminate one), a radio group, and a one-level submenu.
          Right-click near the edge of the viewport to see the panel flip back
          on-screen.
        </p>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              className="ks-context-menu-canvas"
              style={{ anchorName: "--ks-cm" }}
            >
              Right-click anywhere in this area
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent size={size} style={{ positionAnchor: "--ks-cm" }}>
            <ContextMenuItem>
              <ContextMenuItemLeading>
                <Copy aria-hidden="true" />
              </ContextMenuItemLeading>
              <ContextMenuItemLabel>Copy</ContextMenuItemLabel>
              <ContextMenuItemTrailing>
                <span className="ks-select-kbd">⌘C</span>
              </ContextMenuItemTrailing>
            </ContextMenuItem>
            <ContextMenuItem>
              <ContextMenuItemLeading>
                <Copy aria-hidden="true" />
              </ContextMenuItemLeading>
              <ContextMenuItemLabel>Duplicate</ContextMenuItemLabel>
              <ContextMenuItemTrailing>
                <span className="ks-select-kbd">⌘D</span>
              </ContextMenuItemTrailing>
            </ContextMenuItem>
            <ContextMenuItem>
              <ContextMenuItemLeading>
                <Delete aria-hidden="true" />
              </ContextMenuItemLeading>
              <ContextMenuItemLabel>Delete</ContextMenuItemLabel>
              <ContextMenuItemTrailing>
                <span className="ks-select-kbd">⌫</span>
              </ContextMenuItemTrailing>
            </ContextMenuItem>

            <ContextMenuSeparator />

            <ContextMenuSub>
              <ContextMenuSubTrigger style={{ anchorName: "--ks-cm-s1" }}>
                Arrange
                <ChevronRight aria-hidden="true" />
              </ContextMenuSubTrigger>
              <ContextMenuSubContent
                size={size}
                style={{ positionAnchor: "--ks-cm-s1" }}
              >
                <ContextMenuItem>Bring to front</ContextMenuItem>
                <ContextMenuItem>Bring forward</ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem>Send backward</ContextMenuItem>
                <ContextMenuItem>Send to back</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSeparator />

            <ContextMenuCheckboxItem
              checked={cmShowGrid}
              onCheckedChange={setCmShowGrid}
              onSelect={(e) => e.preventDefault()}
            >
              <ContextMenuItemIndicator>
                <Check aria-hidden="true" />
              </ContextMenuItemIndicator>
              Show grid
            </ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem
              checked={cmSnapToGrid}
              onCheckedChange={setCmSnapToGrid}
              onSelect={(e) => e.preventDefault()}
            >
              <ContextMenuItemIndicator>
                <Check aria-hidden="true" />
              </ContextMenuItemIndicator>
              Snap to grid
            </ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem
              checked={cmLockAspect}
              onCheckedChange={setCmLockAspect}
              onSelect={(e) => e.preventDefault()}
            >
              <ContextMenuItemIndicator>
                {cmLockAspect === "indeterminate" ? (
                  <Minus aria-hidden="true" />
                ) : (
                  <Check aria-hidden="true" />
                )}
              </ContextMenuItemIndicator>
              Lock aspect ratio
            </ContextMenuCheckboxItem>

            <ContextMenuSeparator />

            <ContextMenuLabel>Align</ContextMenuLabel>
            <ContextMenuRadioGroup value={cmAlign} onValueChange={setCmAlign}>
              {["left", "center", "right"].map((value) => (
                <ContextMenuRadioItem
                  key={value}
                  value={value}
                  onSelect={(e) => e.preventDefault()}
                >
                  <ContextMenuItemIndicator>
                    <span
                      style={{
                        inlineSize: "45%",
                        blockSize: "45%",
                        borderRadius: "var(--primitiv-radii-full, 9999px)",
                        background: "currentColor",
                      }}
                    />
                  </ContextMenuItemIndicator>
                  {value[0].toUpperCase() + value.slice(1)}
                </ContextMenuRadioItem>
              ))}
            </ContextMenuRadioGroup>

            <ContextMenuSeparator />

            <ContextMenuItem>
              <ContextMenuItemLeading>
                <Settings aria-hidden="true" />
              </ContextMenuItemLeading>
              <ContextMenuItemLabel>Layer settings...</ContextMenuItemLabel>
            </ContextMenuItem>
            <ContextMenuItem disabled>
              <ContextMenuItemLeading>
                <Grid aria-hidden="true" />
              </ContextMenuItemLeading>
              <ContextMenuItemLabel>Export as image</ContextMenuItemLabel>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
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
                  <DrawerTitle>
                    {side[0].toUpperCase() + side.slice(1)} drawer
                  </DrawerTitle>
                  <DrawerClose asChild>
                    <Button variant="ghost" size="sm" aria-label="Close">
                      <Close aria-hidden="true" />
                    </Button>
                  </DrawerClose>
                </DrawerHeader>
                <DrawerBody>
                  <DrawerDescription>
                    A dialog that slides in from the {side} edge. It reuses the{" "}
                    <InlineCode size={size}>Modal</InlineCode> machinery — focus
                    trap, <InlineCode size={size}>Esc</InlineCode>, and
                    click-outside — and adds only the{" "}
                    <InlineCode size={size}>side</InlineCode> axis.
                  </DrawerDescription>
                  <p>
                    The body is the region that scrolls when its content
                    overflows, so the header and footer stay pinned to the panel
                    edges.
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

      {/* One menu exercising every part: a labelled Group of Items (with keyboard
          shortcuts via the row's space-between), CheckboxItems (check / dash mixed)
          and a RadioGroup (dot) through ItemIndicators, Separators, and a THREE-level
          nested submenu. Positioning is pure CSS anchor positioning — the trigger and
          every SubTrigger declare a unique `anchor-name`, each panel a matching
          `position-anchor`; logical anchor(start/end) means it flips for RTL for free,
          and position-try-fallbacks fold submenus back on viewport overflow. */}
      <Section title="Dropdown" column>
        <p className="kitchen-sink__note">
          One menu-button dropdown with every part — items, checkbox / radio
          items, labels, separators, and a three-level nested submenu. Open it
          and arrow into <InlineCode size={size}>Open Recent →</InlineCode> to
          watch the submenus anchor and flip.
        </p>
        <Dropdown>
          <DropdownTrigger asChild>
            <Button
              variant="secondary"
              size={size}
              style={{ anchorName: "--ks-dd" }}
            >
              Menu
              <ChevronDown aria-hidden="true" />
            </Button>
          </DropdownTrigger>
          <DropdownContent size={size} style={{ positionAnchor: "--ks-dd" }}>
            {/* The row slots: a leading glyph, a label that takes the free space,
                and a trailing shortcut that keeps its natural width. */}
            <DropdownGroup>
              <DropdownLabel>File</DropdownLabel>
              <DropdownItem>
                <DropdownItemLeading>
                  <File aria-hidden="true" />
                </DropdownItemLeading>
                <DropdownItemLabel>New file</DropdownItemLabel>
                <DropdownItemTrailing>
                  <span className="ks-select-kbd">⌘N</span>
                </DropdownItemTrailing>
              </DropdownItem>
              <DropdownItem>
                <DropdownItemLeading>
                  <Folder aria-hidden="true" />
                </DropdownItemLeading>
                <DropdownItemLabel>Open...</DropdownItemLabel>
                <DropdownItemTrailing>
                  <span className="ks-select-kbd">⌘O</span>
                </DropdownItemTrailing>
              </DropdownItem>
              <DropdownItem>
                <DropdownItemLeading>
                  <Download aria-hidden="true" />
                </DropdownItemLeading>
                <DropdownItemLabel>Save</DropdownItemLabel>
                <DropdownItemTrailing>
                  <span className="ks-select-kbd">⌘S</span>
                </DropdownItemTrailing>
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
            <DropdownRadioGroup
              value={ddSortOrder}
              onValueChange={setDdSortOrder}
            >
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
              <DropdownSubContent
                size={size}
                style={{ positionAnchor: "--ks-dd-s1" }}
              >
                <DropdownItem>project-alpha</DropdownItem>
                <DropdownItem>project-beta</DropdownItem>
                <DropdownSeparator />
                <DropdownSub>
                  <DropdownSubTrigger style={{ anchorName: "--ks-dd-s2" }}>
                    Archived
                    <ChevronRight aria-hidden="true" />
                  </DropdownSubTrigger>
                  <DropdownSubContent
                    size={size}
                    style={{ positionAnchor: "--ks-dd-s2" }}
                  >
                    <DropdownItem>archive-2025</DropdownItem>
                    <DropdownItem>archive-2024</DropdownItem>
                    <DropdownSeparator />
                    <DropdownSub>
                      <DropdownSubTrigger style={{ anchorName: "--ks-dd-s3" }}>
                        Older still
                        <ChevronRight aria-hidden="true" />
                      </DropdownSubTrigger>
                      <DropdownSubContent
                        size={size}
                        style={{ positionAnchor: "--ks-dd-s3" }}
                      >
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
            <Button variant="ghost" size="xs" aria-label="Clear">
              <Close aria-hidden="true" />
            </Button>
          </InputGroupTrailingAdornment>
        </InputGroup>
      </Section>

      <Section title="Modal">
        <Modal>
          <ModalTrigger asChild>
            <Button variant="primary" size={size}>
              Open modal
            </Button>
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
                  This dialog is portalled to{" "}
                  <InlineCode size={size}>document.body</InlineCode>, which is
                  why <InlineCode size={size}>data-theme</InlineCode> lives on{" "}
                  <InlineCode size={size}>&lt;html&gt;</InlineCode> above, not
                  on this page&apos;s wrapper.
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

      {/* Sits high on the page for the same reason Dropdown does: the panel opens
          downward and needs room below it. Unlike Dropdown it is normal-flow — the
          <nav> is the containing block — so there is no anchor-name wiring. */}
      <Section title="Navigation Menu" column>
        {/* Desktop: five disclosure entries — each panel free to arrange itself
            differently via its own --primitiv-navigation-menu-content-columns
            (two columns, a single column, a four-column brand callout + grid) —
            two plain bar links, an arrow marker, and the shared Viewport every
            panel projects into. forceMount on all three so the close can be
            transitioned rather than snapping (the headless applies `hidden`
            without it).

            Gated by viewport width, not just "wrapped" — a mega-menu bar has no
            sane small-screen fallback of its own (five-plus disclosure triggers
            in one flex row, plus panels sized to their own widest content, e.g.
            the Explore panel's 13rem + 3 columns). Below the breakpoint only
            the composed Drawer/Collapsible presentation renders instead.
            ks-nav-desktop-only / ks-nav-mobile-only are kitchen-sink-only
            classes (see App.css for the breakpoint value), not a registry
            pattern. */}
        <div className="ks-nav-desktop-only">
        <NavigationMenu size={size} aria-label="Docs">
          <NavigationMenuList>
            {NAV_SECTIONS.map((section) => (
              <NavigationMenuItem key={section.value} value={section.value}>
                <NavigationMenuTrigger>
                  <NavigationMenuTriggerLabel>
                    {section.label}
                  </NavigationMenuTriggerLabel>
                  <NavigationMenuTriggerIcon>
                    <ChevronDown aria-hidden="true" />
                  </NavigationMenuTriggerIcon>
                </NavigationMenuTrigger>
                {/* The panel's arrangement is the consumer's: Content is a grid whose
                    track list is a single custom property. Two columns here; the
                    default is one. */}
                <NavigationMenuContent
                  forceMount
                  style={
                    {
                      "--primitiv-navigation-menu-content-columns": "1fr 1fr",
                    } as CSSProperties
                  }
                >
                  {section.columns.map((column, columnIndex) => (
                    <div key={columnIndex}>
                      {column.map((row) => (
                        <NavigationMenuLink
                          key={row.title}
                          placement="panel"
                          href="#"
                        >
                          <NavigationMenuLinkText>
                            <NavigationMenuLinkTitle>
                              {row.title}
                            </NavigationMenuLinkTitle>
                            <NavigationMenuLinkDescription>
                              {row.description}
                            </NavigationMenuLinkDescription>
                          </NavigationMenuLinkText>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  ))}
                </NavigationMenuContent>
              </NavigationMenuItem>
            ))}

            {/* A single column of three rows: one with a description, one
                without (collapses to one line), and one using the leading /
                trailing slots (both default off — a row opts in by rendering
                the slot at all). */}
            <NavigationMenuItem value="registry">
              <NavigationMenuTrigger>
                <NavigationMenuTriggerLabel>
                  Registry &amp; CLI
                </NavigationMenuTriggerLabel>
                <NavigationMenuTriggerIcon>
                  <ChevronDown aria-hidden="true" />
                </NavigationMenuTriggerIcon>
              </NavigationMenuTrigger>
              <NavigationMenuContent forceMount>
                <div>
                  <NavigationMenuLink placement="panel" href="#">
                    <NavigationMenuLinkText>
                      <NavigationMenuLinkTitle>
                        Adding components
                      </NavigationMenuLinkTitle>
                      <NavigationMenuLinkDescription>
                        primitiv add, and what it copies
                      </NavigationMenuLinkDescription>
                    </NavigationMenuLinkText>
                  </NavigationMenuLink>
                  <NavigationMenuLink placement="panel" href="#">
                    <NavigationMenuLinkText>
                      <NavigationMenuLinkTitle>
                        The lockfile
                      </NavigationMenuLinkTitle>
                    </NavigationMenuLinkText>
                  </NavigationMenuLink>
                  <NavigationMenuLink placement="panel" href="#">
                    <NavigationMenuLinkLeading>
                      <File aria-hidden="true" />
                    </NavigationMenuLinkLeading>
                    <NavigationMenuLinkText>
                      <NavigationMenuLinkTitle>
                        With row slots
                      </NavigationMenuLinkTitle>
                      <NavigationMenuLinkDescription>
                        Optional leading and trailing content
                      </NavigationMenuLinkDescription>
                    </NavigationMenuLinkText>
                    <NavigationMenuLinkTrailing>
                      <ChevronRight aria-hidden="true" />
                    </NavigationMenuLinkTrailing>
                  </NavigationMenuLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Wide: a fixed-width brand callout (a bespoke kitchen-sink-only
                flourish — see .ks-nav-callout in App.css, not a registry pattern)
                beside three link columns. */}
            <NavigationMenuItem value="explore">
              <NavigationMenuTrigger>
                <NavigationMenuTriggerLabel>Explore</NavigationMenuTriggerLabel>
                <NavigationMenuTriggerIcon>
                  <ChevronDown aria-hidden="true" />
                </NavigationMenuTriggerIcon>
              </NavigationMenuTrigger>
              <NavigationMenuContent
                forceMount
                style={
                  {
                    "--primitiv-navigation-menu-content-columns":
                      "13rem repeat(3, 1fr)",
                  } as CSSProperties
                }
              >
                <a href="#" className="ks-nav-callout">
                  <img
                    className="ks-nav-callout__mark"
                    src={`${import.meta.env.BASE_URL}primitiv-logo.svg`}
                    alt=""
                    aria-hidden="true"
                  />
                  <span className="ks-nav-callout__wordmark">Primitiv</span>
                  <span className="ks-nav-callout__text">
                    A headless, themeable component library
                  </span>
                </a>
                {EXPLORE_COLUMNS.map((column, columnIndex) => (
                  <div key={columnIndex}>
                    {column.map((row) => (
                      <NavigationMenuLink
                        key={row.title}
                        placement="panel"
                        href="#"
                      >
                        <NavigationMenuLinkText>
                          <NavigationMenuLinkTitle>
                            {row.title}
                          </NavigationMenuLinkTitle>
                          <NavigationMenuLinkDescription>
                            {row.description}
                          </NavigationMenuLinkDescription>
                        </NavigationMenuLinkText>
                      </NavigationMenuLink>
                    ))}
                  </div>
                ))}
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Narrow: a single column, no style override — demonstrates the
                default --primitiv-navigation-menu-content-columns (1fr) rather
                than the two/four-column overrides the other panels set. */}
            <NavigationMenuItem value="resources">
              <NavigationMenuTrigger>
                <NavigationMenuTriggerLabel>
                  Resources
                </NavigationMenuTriggerLabel>
                <NavigationMenuTriggerIcon>
                  <ChevronDown aria-hidden="true" />
                </NavigationMenuTriggerIcon>
              </NavigationMenuTrigger>
              <NavigationMenuContent forceMount>
                <div>
                  {RESOURCES_LINKS.map((row) => (
                    <NavigationMenuLink
                      key={row.title}
                      placement="panel"
                      href="#"
                    >
                      <NavigationMenuLinkText>
                        <NavigationMenuLinkTitle>
                          {row.title}
                        </NavigationMenuLinkTitle>
                        <NavigationMenuLinkDescription>
                          {row.description}
                        </NavigationMenuLinkDescription>
                      </NavigationMenuLinkText>
                    </NavigationMenuLink>
                  ))}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Value-less Items are what make these plain links rather than
                disclosures — no Trigger, no panel. */}
            <NavigationMenuItem>
              <NavigationMenuLink href="#" active>
                Changelog
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="#">
                Design in Figma
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>

          <NavigationMenuIndicator forceMount />
          <NavigationMenuViewport forceMount />
        </NavigationMenu>
        </div>

        {/* Mobile, composed rather than a mode of the component: a Drawer shell +
            one Collapsible per section, with the same NavigationMenuLink leaf. The
            nav data and the active-state logic stay single-sourced; only the
            wrapper elements differ (RFC 0019 §4a). */}
        <div className="ks-nav-mobile-only">
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="secondary" size={size}>
              Mobile nav (composed)
            </Button>
          </DrawerTrigger>
          <DrawerPortal forceMount>
            <DrawerContent side="left" width={size}>
              <DrawerHeader>
                <DrawerTitle>Menu</DrawerTitle>
                <DrawerClose asChild>
                  <Button variant="ghost" size="sm" aria-label="Close">
                    <Close aria-hidden="true" />
                  </Button>
                </DrawerClose>
              </DrawerHeader>
              <DrawerBody>
                {/* Root still wraps the mobile tree — it renders the <nav>
                    landmark, and NavigationMenuLink reads its context (a strict
                    one: the Link throws without a Root ancestor). What the mobile
                    presentation drops is List / Item / Trigger / Viewport, which
                    Collapsible replaces. */}
                <NavigationMenu size={size} aria-label="Docs (mobile)">
                  {MOBILE_NAV.map((section) => (
                    <Collapsible
                      key={section.label}
                      size={size}
                      variant="plain"
                    >
                      <CollapsibleTrigger>
                        {section.label}
                        <CollapsibleTriggerIcon>
                          <ChevronDown aria-hidden="true" />
                        </CollapsibleTriggerIcon>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {section.links.map((link) => (
                          <NavigationMenuLink
                            key={link}
                            placement="panel"
                            href="#"
                          >
                            <NavigationMenuLinkText>
                              <NavigationMenuLinkTitle>
                                {link}
                              </NavigationMenuLinkTitle>
                            </NavigationMenuLinkText>
                          </NavigationMenuLink>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </NavigationMenu>
              </DrawerBody>
            </DrawerContent>
          </DrawerPortal>
        </Drawer>
        </div>
      </Section>

      <Section title="Popover" column>
        <p className="kitchen-sink__note">
          Click any trigger to open its placement (one at a time — the panels
          are native{" "}
          <InlineCode size={size}>popover=&quot;auto&quot;</InlineCode>). Panel
          + arrow track the Size and Density controls above.
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

      <Section title="Select" column>
        {/* Rich (the default) — the trigger's content is not written here: it is
            mirrored out of the selected option, so the React mark and the label
            appear in the closed control for free. The checkmark indicator is
            excluded from that mirror. */}
        <div className="ks-select-demo">
          <span className="ks-select-demo__caption">Rich · leading marks</span>
          <Select value={selFramework} onValueChange={setSelFramework}>
            <SelectTrigger
              size={size}
              aria-label="Framework"
              style={{ anchorName: "--ks-sel-framework" } as CSSProperties}
            >
              <SelectValue placeholder="Pick a framework..." />
              <SelectIcon>
                <ChevronDown />
              </SelectIcon>
            </SelectTrigger>
            <SelectContent
              size={size}
              style={{ positionAnchor: "--ks-sel-framework" } as CSSProperties}
            >
              {FRAMEWORKS.map(({ value, label, Logo }) => (
                <SelectItem key={value} value={value}>
                  <SelectItemIndicator>
                    <Check aria-hidden="true" />
                  </SelectItemIndicator>
                  <SelectItemLeading>
                    <Logo />
                  </SelectItemLeading>
                  <SelectItemLabel>{label}</SelectItemLabel>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Both row slots at once: a leading logo and a trailing pill / shortcut.
            The trailing slot keeps its content's natural width, so a "Soon" badge
            sits there as happily as an icon. The disabled row stays visible and
            unselectable. */}
        <div className="ks-select-demo">
          <span className="ks-select-demo__caption">
            Rich · leading + trailing
          </span>
          <Select value={selRuntime} onValueChange={setSelRuntime}>
            <SelectTrigger
              size={size}
              aria-label="Runtime"
              style={{ anchorName: "--ks-sel-runtime" } as CSSProperties}
            >
              <SelectValue placeholder="Pick a runtime…" />
              <SelectIcon>
                <ChevronDown />
              </SelectIcon>
            </SelectTrigger>
            <SelectContent
              size={size}
              style={{ positionAnchor: "--ks-sel-runtime" } as CSSProperties}
            >
              {RUNTIMES.map(({ value, label, Logo, shortcut, soon }) => (
                <SelectItem key={value} value={value} disabled={soon}>
                  <SelectItemIndicator>
                    <Check aria-hidden="true" />
                  </SelectItemIndicator>
                  <SelectItemLeading>
                    <Logo />
                  </SelectItemLeading>
                  <SelectItemLabel>{label}</SelectItemLabel>
                  <SelectItemTrailing>
                    {soon ? (
                      <span className="ks-select-badge">Soon</span>
                    ) : (
                      <span className="ks-select-kbd">{shortcut}</span>
                    )}
                  </SelectItemTrailing>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Same options and the same mirror, but the trigger hides the
            trailing slot — SelectItemIndicator is the only slot excluded
            unconditionally, so suppressing another one (here: the shortcut/
            "Soon" badge, useful while browsing but not once picked) is a
            consumer-scoped CSS rule targeting .primitiv-select__value's
            descendant (see the README's "Hiding a slot from the mirror").
            The row itself is untouched — its own copy lives outside that
            scope. */}
        <div className="ks-select-demo">
          <span className="ks-select-demo__caption">
            Rich · leading + trailing, hidden in trigger
          </span>
          <Select
            value={selRuntimeHiddenTrailing}
            onValueChange={setSelRuntimeHiddenTrailing}
          >
            <SelectTrigger
              size={size}
              className="ks-select-hide-trailing-value"
              aria-label="Runtime, trailing hidden once selected"
              style={
                { anchorName: "--ks-sel-runtime-notrailing" } as CSSProperties
              }
            >
              <SelectValue placeholder="Pick a runtime…" />
              <SelectIcon>
                <ChevronDown />
              </SelectIcon>
            </SelectTrigger>
            <SelectContent
              size={size}
              style={
                {
                  positionAnchor: "--ks-sel-runtime-notrailing",
                } as CSSProperties
              }
            >
              {RUNTIMES.map(({ value, label, Logo, shortcut, soon }) => (
                <SelectItem key={value} value={value} disabled={soon}>
                  <SelectItemIndicator>
                    <Check aria-hidden="true" />
                  </SelectItemIndicator>
                  <SelectItemLeading>
                    <Logo />
                  </SelectItemLeading>
                  <SelectItemLabel>{label}</SelectItemLabel>
                  <SelectItemTrailing>
                    {soon ? (
                      <span className="ks-select-badge">Soon</span>
                    ) : (
                      <span className="ks-select-kbd">{shortcut}</span>
                    )}
                  </SelectItemTrailing>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grouped options. The headless Group exposes `label` as the group's
            accessible name only, so the *visible* heading is a GroupLabel with the
            same text (aria-hidden, so it isn't announced twice). SelectLeading is
            the other kind of trigger glyph: a standing mark that never changes
            with the selection. A SelectSeparator marks the boundary between
            groups — skipped by arrow-key navigation for free, since it carries
            no role="option". */}
        <div className="ks-select-demo">
          <span className="ks-select-demo__caption">
            Rich · groups + standing icon
          </span>
          <Select value={selRegion} onValueChange={setSelRegion}>
            <SelectTrigger
              size={size}
              aria-label="Region"
              style={{ anchorName: "--ks-sel-region" } as CSSProperties}
            >
              <SelectLeading>
                <Search aria-hidden="true" />
              </SelectLeading>
              <SelectValue placeholder="Nearest region..." />
              <SelectIcon>
                <ChevronDown />
              </SelectIcon>
            </SelectTrigger>
            <SelectContent
              size={size}
              style={{ positionAnchor: "--ks-sel-region" } as CSSProperties}
            >
              {REGIONS.map(({ label, options }, index) => (
                <Fragment key={label}>
                  {index > 0 && <SelectSeparator />}
                  <SelectGroup label={label}>
                    <SelectGroupLabel>{label}</SelectGroupLabel>
                    {options.map(({ value, name }) => (
                      <SelectItem key={value} value={value}>
                        <SelectItemIndicator>
                          <Check aria-hidden="true" />
                        </SelectItemIndicator>
                        <SelectItemLabel>{name}</SelectItemLabel>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </Fragment>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Placement — the same panel opening upward, wired through the same
            anchor-name / position-anchor pair. */}
        <div className="ks-select-demo">
          <span className="ks-select-demo__caption">
            Rich · top-end placement
          </span>
          <Select value={selFramework} onValueChange={setSelFramework}>
            <SelectTrigger
              size={size}
              aria-label="Framework, opening upward"
              style={{ anchorName: "--ks-sel-up" } as CSSProperties}
            >
              <SelectValue placeholder="Pick a framework..." />
              <SelectIcon>
                <ChevronDown />
              </SelectIcon>
            </SelectTrigger>
            <SelectContent
              size={size}
              placement="top-end"
              style={{ positionAnchor: "--ks-sel-up" } as CSSProperties}
            >
              {FRAMEWORKS.map(({ value, label, Logo }) => (
                <SelectItem key={value} value={value}>
                  <SelectItemIndicator>
                    <Check aria-hidden="true" />
                  </SelectItemIndicator>
                  <SelectItemLeading>
                    <Logo />
                  </SelectItemLeading>
                  <SelectItemLabel>{label}</SelectItemLabel>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Invalid + disabled, on the rich control. `disabled` on the root reaches
            the hidden form <select>, so the trigger takes its own. */}
        <div className="ks-select-demo">
          <span className="ks-select-demo__caption">Rich · invalid</span>
          <Select value="" onValueChange={() => {}}>
            <SelectTrigger
              size={size}
              aria-invalid
              aria-label="Framework, invalid"
              style={{ anchorName: "--ks-sel-invalid" } as CSSProperties}
            >
              <SelectValue placeholder="Required" />
              <SelectIcon>
                <ChevronDown />
              </SelectIcon>
            </SelectTrigger>
            <SelectContent
              size={size}
              style={{ positionAnchor: "--ks-sel-invalid" } as CSSProperties}
            >
              <SelectItem value="react">
                <SelectItemIndicator>
                  <Check aria-hidden="true" />
                </SelectItemIndicator>
                <SelectItemLabel>React</SelectItemLabel>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="ks-select-demo">
          <span className="ks-select-demo__caption">Rich · disabled</span>
          <Select value="react" onValueChange={() => {}}>
            <SelectTrigger
              size={size}
              disabled
              aria-label="Framework, disabled"
            >
              <SelectValue placeholder="Pick a framework..." />
              <SelectIcon>
                <ChevronDown />
              </SelectIcon>
            </SelectTrigger>
            <SelectContent size={size}>
              <SelectItem value="react">
                <SelectItemLabel>React</SelectItemLabel>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Native — the same component with `native` set. The platform owns the
            popup and the selected text; the frame and the chevron are ours (the
            UA's own arrow is stripped and repainted to match the rich one).
            Element children of an Item are dropped here, so the options are
            plain text and the group is a real <optgroup>. */}
        <div className="ks-select-demo">
          <span className="ks-select-demo__caption">
            Native · placeholder + groups
          </span>
          <Select
            native
            size={size}
            value={selFruit}
            onValueChange={setSelFruit}
            aria-label="Fruit"
          >
            <SelectPlaceholder>Choose a fruit...</SelectPlaceholder>
            <SelectGroup label="Stone fruit">
              <SelectItem value="peach">Peach</SelectItem>
              <SelectItem value="plum">Plum</SelectItem>
            </SelectGroup>
            <SelectGroup label="Citrus">
              <SelectItem value="lemon">Lemon</SelectItem>
              <SelectItem value="orange">Orange</SelectItem>
              <SelectItem value="durian" disabled>
                Durian (sold out)
              </SelectItem>
            </SelectGroup>
          </Select>
        </div>

        <div className="ks-select-demo">
          <span className="ks-select-demo__caption">Native · in a Field</span>
          <Field size={size}>
            <FieldLabel>Deploy target</FieldLabel>
            <Select native size={size} defaultValue="edge">
              <SelectItem value="edge">Edge</SelectItem>
              <SelectItem value="node">Node</SelectItem>
              <SelectItem value="static">Static</SelectItem>
            </Select>
            <FieldDescription>
              Inherits the field's id and description.
            </FieldDescription>
          </Field>
        </div>

        <div className="ks-select-demo">
          <span className="ks-select-demo__caption">Native · disabled</span>
          <Select
            native
            size={size}
            disabled
            defaultValue="edge"
            aria-label="Disabled target"
          >
            <SelectItem value="edge">Edge</SelectItem>
          </Select>
        </div>
      </Section>

      <Section title="Switch" column>
        <Switch size={size} defaultChecked>
          Wi-Fi
        </Switch>
        <Switch size={size}>Bluetooth</Switch>
      </Section>

      <Section title="Table" column>
        {/* Wrapped in TableScrollArea so a wide table scrolls horizontally within
            its own area on narrow viewports instead of forcing the page wider. */}
        <TableScrollArea>
          <Table size={size}>
            <TableCaption>
              Package downloads this month — click a header to sort.
            </TableCaption>
            <TableHead>
              <TableRow>
                {TABLE_COLUMNS.map((col) => {
                  const active = sort.key === col.key;
                  return (
                    <TableHeader
                      key={col.key}
                      className={`ks-table__align-${col.align}`}
                      aria-sort={
                        active
                          ? sort.dir === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
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
                          <Sort
                            className="ks-table__sort-idle"
                            aria-hidden="true"
                          />
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
                    <TableCell
                      key={col.key}
                      className={`ks-table__align-${col.align}`}
                    >
                      {col.numeric
                        ? (r[col.key] as number).toLocaleString()
                        : r[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableScrollArea>
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

      <Section title="Toggle Group">
        <ToggleGroup
          type="single"
          size={size}
          defaultValue="left"
          aria-label="Alignment"
        >
          <ToggleGroupItem value="left">Left</ToggleGroupItem>
          <ToggleGroupItem value="center">Center</ToggleGroupItem>
          <ToggleGroupItem value="right">Right</ToggleGroupItem>
        </ToggleGroup>
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
                  <Button
                    variant="secondary"
                    size={size}
                    style={{ anchorName: anchor }}
                  >
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
    </>
  );
}
