/*
 * Docs-site content pages — the Figma builder.
 *
 * Paste this whole file into `figma_execute` (Desktop Bridge) and finish the
 * call with, for example:
 *
 *     return await build(['tokens'], { mobile: true, desktop: true });
 *     return await build(ALL);                    // every page, both breakpoints
 *     return await sizeGaps();                    // ALWAYS a separate call — see below
 *
 * A page is DATA. Everything below `PAGES` is the renderer, and adding or
 * editing a page means editing its entry there, not the renderer. That is the
 * whole point: the copy docs are the source of truth, a page's Figma shape is
 * one object, and a rebuild is one call.
 *
 * Where the content comes from:
 *   docs/docs-site-start-here-copy.md · docs-site-concepts-copy.md ·
 *   docs-site-registry-cli-copy.md · docs-site-figma-copy.md
 * Section order and arguments: docs/docs-site-content-plan.md §3.
 * Voice rules: docs/voice-and-tone.md — read it before editing any string.
 *
 * ── Conventions this file encodes, all load-bearing ─────────────────────────
 *
 * - Mobile (390) is built first and the desktop frame CLONES its sections into
 *   the docs shell, so the copy cannot diverge between breakpoints. Rebuild a
 *   page by rebuilding its mobile frame and re-deriving.
 * - Type binds inline to the Context variables. Never a text style — a text
 *   style silently breaks density.
 * - Frames set Intent=Dark and Context=Comfortable and leave
 *   `Primitives / Palette` ON LIGHT. Pinning the dark ramp renders near-black
 *   text on a near-black surface (docs/dark-intent-figma-drift.md).
 * - These are docs pages, not landing pages. The home page's 120px gutters and
 *   alternating grounds are landing devices; a reading page uses the shell
 *   `apps/docs-site/src/site/shell.css` implements — 1280 in 1440, 32px
 *   gutters, 260 / 632 / 260, one continuous ground, no rails below 64rem.
 *
 * ── Two traps ───────────────────────────────────────────────────────────────
 *
 * - A gap re-parented into a wider column DOES NOT REFLOW inside the same
 *   `figma_execute` call, so a resize straight afterwards lands against the old
 *   content height. `sizeGaps()` is therefore always a separate call.
 * - A hidden node keeps its master width — a Code Block header hidden by
 *   `Show Header` still reads 440 wide inside a 632 instance — so
 *   `overflowAudit()` skips invisible children.
 */

/* ═══════════════════════════════════════════════════════════════════════════
   THE PAGES
   ═══════════════════════════════════════════════════════════════════════════

   Block forms:
     ['h2'|'h3'|'h4', text]
     ['p', text, frags?]                 frags → real Inline Code instances
     ['block', heading, body, frags?]    an h4 and its paragraph, tight
     ['code', text, opts?]               opts: { tabbed, lineNumbers, size }
     ['alert', tone, text]
     ['defs', [[term, description], …]]
     ['links', ['Something →', …]]
     ['gap', id, mobileHeight, label, job]
     ['group', gapVar, [ …blocks ] ]     a nested flow group

   Page fields:
     eyebrow · title · lede · head[] · sections[] · toc[] · current · pairs[]
     `current` is the sidebar entry to mark as the page you are on.
     `pairs` is desktop only: [{ id, count }] wraps a gap and the `count`
     blocks above it into a two-column row, for briefs that ask for half the
     content width beside their prose.                                       */

const PAGES = {
  'start-here': {
    name: 'Start Here',
    eyebrow: 'GET STARTED',
    title: 'Start here',
    lede: 'Primitiv is a design system you can take in three different ways: as accessible behaviour with no styling, as finished components copied into your project, or as a Figma library. All three are built from one set of design tokens, so they agree with each other.',
    head: [
      ['p', 'There are 63 components. Every interactive one follows its WAI-ARIA pattern, with full keyboard support. The colour palette is generated rather than picked, so its contrast is correct by construction. And the whole system scales between four density settings, which is what lets one set of components suit a dense dashboard and a roomy marketing page.'],
    ],
    current: 'Introduction',
    toc: ['Which path is yours', 'Install it', 'Your first component', 'Where to go next'],
    sections: [
      { name: '02 — Which path is yours', blocks: [
        ['h2', 'Which path is yours'],
        ['p', 'Three ways in. You are not locked into the one you pick, and most teams end up using two.'],
        ['group', 'flow/section', [
          ['block', 'You already have a design system, and want the behaviour.', 'Install @primitiv-ui/react. You get the keyboard handling, focus management and ARIA, with no styling to override. Your existing look stays exactly as it is.', ['@primitiv-ui/react']],
          ['block', 'You want components that already look finished.', 'Use the CLI. primitiv add button copies a styled component into your project as a file you own and can edit. This is the path most people want, and it is the default the docs assume.', ['primitiv add button']],
          ['block', 'You are designing rather than building.', 'Open the Figma library. It has the same components, built from the same tokens as the code, so what you draw is what gets built.'],
        ]],
        ['gap', 'START-01', 420, '4:1 → stacked on mobile  ·  342×420', 'Three parallel routes, each opening with a question and resolving to a path name and one command. Not a flowchart. Closing line: you can change your mind.'],
      ]},
      { name: '03 — Install it', blocks: [
        ['h2', 'Install it'],
        ['p', 'The fastest way in is a new project with everything already wired up:'],
        ['code', '$ npm create primitiv-ui@latest', { tabbed: true }],
        ['p', 'To add it to an app you already have:'],
        ['code', '$ npm i -D primitiv-ui\n$ npx primitiv add button', { tabbed: true }],
        ['p', 'That second command does the whole setup the first time you run it. It installs what it needs, writes a primitiv.json config, generates your token layer, and copies the Button component into your project.', ['primitiv.json']],
        ['p', 'If you only want the headless components, skip the CLI:'],
        ['code', '$ npm i @primitiv-ui/react', { tabbed: true }],
        ['alert', 'info', 'The CLI runs a small native binary, so it will not work in StackBlitz or other in-browser Node environments. Use a local machine, a Codespace, or Docker.'],
      ]},
      { name: '04 — Your first component', blocks: [
        ['h2', 'Your first component'],
        ['p', 'After primitiv add button, you have a real file at src/components/button.tsx. Import it like anything else you wrote:', ['primitiv add button', 'src/components/button.tsx']],
        ['code', 'import { Button } from "@/components/button";\n\nexport function Save() {\n  return <Button onClick={save}>Save changes</Button>;\n}', { lineNumbers: true }],
        ['p', 'Open that file. It is ordinary code, and it is yours. Change the padding, add a variant, delete a prop you will never use. Nothing upstream will overwrite it.'],
        ['p', 'The headless version is the same component without the styling:'],
        ['code', 'import { Button } from "@primitiv-ui/react";'],
        ['p', 'Same behaviour, same accessibility, no CSS. You bring the look.'],
      ]},
      { name: '05 — Where to go next', blocks: [
        ['h2', 'Where to go next'],
        ['doors', [
          ['Components', 'All 63, with live examples and props.'],
          ['Tokens and theming', 'How to change colours, spacing and type.'],
          ['Density', 'The four modes, and how to scope them.'],
          ['Composition', 'The handful of patterns every component shares.'],
          ['Accessibility', 'What we guarantee, and what stays yours.'],
          ['The registry and CLI', 'Every command, and why it works this way.'],
          ['Design in Figma', 'The library, and how it stays in step.'],
        ]],
      ]},
    ],
  },

  'what-primitiv-is': {
    name: 'What Primitiv is',
    eyebrow: 'CONCEPTS',
    title: 'What Primitiv is',
    lede: 'Primitiv is four things that share one name, built on one set of design tokens. Most people only ever need two of them.',
    current: 'What Primitiv is',
    toc: ['The four parts', 'What you actually need'],
    sections: [
      { name: '02 — The four parts', blocks: [
        ['h2', 'The four parts'],
        ['group', 'flow/section', [
          ['block', 'Primitiv — the design system.', 'The components themselves, and the tokens underneath them. When someone says "we use Primitiv", this is what they mean.'],
          ['block', 'Harmoni — the colour engine.', 'It generates every colour in the system. Give it one colour and it builds a full scale around it, choosing the text colour for each step and checking the contrast as it goes. It is also a Figma plugin you can buy separately, but you do not need it: Primitiv ships the palettes it produced.'],
          ['block', 'The registry and the CLI — how you get the code.', 'primitiv add button copies a component into your project. Not a dependency, a file. The registry is the catalogue it copies from.', ['primitiv add button']],
          ['block', 'The Figma library — the same components, to design with.', 'Built from the same tokens as the code, so a mockup and a build cannot quietly disagree about a colour or a spacing value.'],
        ]],
        ['gap', 'FAMILY-01', 460, '3:2 → stacked on mobile  ·  342×460', 'Three surface blocks over one full-width token band, with Harmoni feeding the band from the side. Caption names what is open source and what is paid.'],
      ]},
      { name: '03 — What you actually need', blocks: [
        ['h2', 'What you actually need'],
        ['p', 'Most teams use two parts: the Figma library to design with, and the registry to build with. Everything else is optional.'],
        ['p', 'You do not need Harmoni to use Primitiv. The palette it generated already ships with the system. You would only want the plugin if you intend to generate your own palettes from your own brand colour.'],
        ['links', ['Tokens and theming →', 'The registry and CLI →', 'Design in Figma →']],
      ]},
    ],
  },

  tokens: {
    name: 'Tokens and theming',
    eyebrow: 'CONCEPTS',
    title: 'Tokens and theming',
    lede: 'A token is a named design decision. Instead of writing a colour into forty stylesheets, you name it once and point at the name.',
    head: [
      ['p', 'That sounds like a variable, and technically it is one. What makes tokens worth a page of their own is how they are layered. Primitiv has three tiers, and each one only ever points at the tier below it.'],
    ],
    current: 'Tokens & theming',
    toc: ['The three tiers', 'Why the layering matters', 'Changing your tokens', 'What is in the token layer'],
    sections: [
      { name: '02 — The three tiers', blocks: [
        ['h2', 'The three tiers'],
        ['group', 'flow/section', [
          ['block', 'Palette — the raw colours.', 'Six scales of ten steps: neutral, brand, success, warning, danger and info. This is the only tier that holds an actual colour value. Harmoni generates it. A larger set of standard ramps is available too, for colour the semantic roles do not own — see below.'],
          ['block', 'Intent — what a colour is for.', 'surface/default is the page background. content/primary is body text. border/subtle is a hairline. None of them holds a value. Each points at a Palette step. Light and dark are two modes of this tier, which is why switching theme is a mode swap rather than a second stylesheet.', ['surface/default', 'content/primary', 'border/subtle']],
          ['block', 'Context — how big things are.', 'Control heights, padding, gaps, corner radius, type size. This tier has four modes, one per density setting. That is the whole density system.'],
        ]],
        ['gap', 'TOKENS-01', 440, '4:3 → stacked on mobile  ·  342×440', 'Trace one primary-button background up from a raw palette colour, through the intent role pointing at it, to the rendered component. Only the palette tier holds a value.'],
      ]},
      { name: '03 — Why the layering matters', blocks: [
        ['h2', 'Why the layering matters'],
        ['p', 'Because only the bottom tier holds a value, a rebrand is a change to one tier. Every role above it keeps pointing where it pointed, and the new colour arrives everywhere at once.'],
        ['p', 'The same rule gives you dark mode. surface/default means "the page background" in both themes and resolves to a different palette step in each, so a theme is a set of values rather than a set of overrides.', ['surface/default']],
      ]},
      { name: '04 — Changing your tokens', blocks: [
        ['h2', 'Changing your tokens'],
        ['p', 'To change the brand colour, regenerate the theme:'],
        ['code', '$ npx primitiv theme --brand "#0a7755"', { tabbed: true }],
        ['p', 'That produces a full light and dark palette from your colour, with every semantic role reassigned by contrast. It writes into its own layer, so it beats the base tokens without you editing them. The standard ramps are fixed and are not touched by this.'],
        ['p', 'To change something the generator does not own, such as a spacing value or a font, override the custom property in your own stylesheet. Token names are the contract, and they do not change under you.'],
        ['p', 'Tokens emit in three formats. Set it once in primitiv.json:', ['primitiv.json']],
        ['defs', [
          ['CSS', 'Custom properties. The default, and what the rest of the docs assume.'],
          ['SCSS', 'The same values as SCSS variables.'],
          ['Tailwind', 'A theme extension.'],
        ]],
      ]},
      { name: '05 — What is in the token layer', blocks: [
        ['h2', 'What is in the token layer'],
        ['p', 'Colour is the tier most people meet first, but it is not the only one. The system also tokenises spacing, type, corner radius, shadows, motion, breakpoints and interaction states. All of it emits together.'],
        ['group', 'flow/normal', [
          ['h3', 'The standard ramps'],
          ['p', 'The six palette scales exist to be pointed at. Every one of them has a job in the Intent tier — a surface, a border, a status — and that is why there are six rather than twenty.'],
          ['p', 'Plenty of colour has no job like that. A chart with nine series, a set of project tags, an illustration: none of it is a surface or a status, and none of it should be your brand colour stretched to cover a shortage. For that there is a standard palette — a wider set of fixed ramps, generated the same way and holding the same contrast, that no semantic role points at.'],
          ['p', 'It is off by default. Switch it on in primitiv.json:', ['primitiv.json']],
          ['code', '{ "palette": { "standard": true } }'],
          ['p', 'Two things follow from it being fixed. Regenerating your theme does not change it, so a chart keeps its colours when your brand colour moves. And nothing in the components uses it, so leaving it off costs you nothing.'],
          ['alert', 'warning', 'PENDING — this block describes work that is planned, not shipped. Do not publish it until the standard ramps are in packages/tokens and the primitiv.json key exists. The config key above is a placeholder and must be checked against config::resolve first.'],
        ]],
        ['links', ['Density and the Context tier →', 'Design in Figma →']],
      ]},
    ],
  },

  density: {
    name: 'Density',
    eyebrow: 'CONCEPTS',
    title: 'Density',
    lede: 'Density is how tightly the interface is packed. Primitiv has four settings, and changing one attribute reflows everything beneath it.',
    head: [
      ['p', 'Most component libraries are tuned for one kind of product. Use them for something denser and everything feels bloated. Use them for something roomier and it feels cramped. Four settings is a statement that proportional control is a feature rather than an afterthought.'],
    ],
    current: 'Density',
    toc: ['The four modes', 'How to set it', 'Why radius follows', 'What density does not change'],
    pairs: [{ id: 'DENSITY-C02', count: 5 }],
    sections: [
      { name: '02 — The four modes', blocks: [
        ['h2', 'The four modes'],
        ['defs', [
          ['Dense', 'For data-heavy screens where fitting more on screen is the point: admin tables, trading screens, dashboards.'],
          ['Compact', 'For productive application UI.'],
          ['Comfortable', 'The default, and suits most product interfaces.'],
          ['Spacious', 'For marketing pages and editorial content, where room to breathe is the point.'],
        ]],
        ['gap', 'DENSITY-C01', 420, '16:9 → two columns of two on mobile  ·  342×420', 'The same panel rendered at all four densities side by side, identical content, with the measured control height under each column.'],
      ]},
      { name: '03 — How to set it', blocks: [
        ['h2', 'How to set it'],
        ['p', 'Density is one attribute, and it is inherited. Set it high up for the whole application:'],
        ['code', '<body data-density="comfortable">'],
        ['p', 'Or set it on any part of a page that needs to be different:'],
        ['code', '<div data-density="dense">\n  <!-- a packed table inside an otherwise roomy page -->\n</div>'],
        ['p', 'Anything inside picks it up. That is the whole API.'],
        ['gap', 'DENSITY-C02', 256, '4:3 → full width on mobile  ·  342×256', 'Nested page boxes showing density scoped by containment: a dense region inside an otherwise comfortable page.'],
      ]},
      { name: '04 — Why radius follows', blocks: [
        ['h2', 'Why radius follows'],
        ['p', "Corner radius is not a value assigned per size. It is a fraction of the control's height, so when density changes the height, the radius follows on its own:"],
        ['code', 'radius = height × 0.1875'],
        ['p', 'That fraction is fixed across the whole system, and the result snaps to the nearest step on the radius scale \u2014 which is why Comfortable and Spacious, 8px apart in height, share a radius of 8. Controls stay in proportion at every density without a fourth table of values for someone to keep in step.'],
      ]},
      { name: '05 — What density does not change', blocks: [
        ['h2', 'What density does not change'],
        ['p', 'Density changes proportion, not identity. Colours do not move. Font families do not change. Component behaviour is untouched, so a keyboard shortcut works the same at every setting.'],
        ['p', "It is also separate from a component's own size prop. Size picks which slot on the scale a component uses. Density scales the whole scale. A medium button in Dense is smaller than a medium button in Spacious, and both are still medium.", ['size']],
        ['links', ['Tokens and theming →', 'Browse components →']],
      ]},
    ],
  },

  composition: {
    name: 'Composition',
    eyebrow: 'CONCEPTS',
    title: 'Composition',
    lede: 'Four patterns turn up in nearly every Primitiv component. Learning them once means every component page afterwards reads faster.',
    current: 'Composition',
    toc: ['Rendering as something else', 'Who holds the value', 'Components made of parts', 'Styling against state'],
    pairs: [{ id: 'COMPOSE-01', count: 4 }],
    sections: [
      { name: '02 — Rendering as something else', blocks: [
        ['h2', 'Rendering as something else'],
        ['p', 'Sometimes you want a button that is really a link. Not a link that looks like a button, an actual <a> that carries the button’s styling and behaviour. Every component takes asChild for this:', ['<a>', 'asChild']],
        ['code', '<Button asChild>\n  <Link href="/pricing">See pricing</Link>\n</Button>'],
        ['p', 'The Button renders nothing of its own. It hands its props, classes and behaviour to the child you gave it, and that child is what appears in the page.'],
        ['p', 'This matters more than it looks. It is what lets Primitiv work with your router, your analytics wrapper, or any component you already have, without the library needing to know they exist.'],
        ['gap', 'COMPOSE-01', 256, '4:3 → full width on mobile  ·  342×256', 'Two DOM columns: without asChild a button wrapping a link (valid JSX, invalid HTML), with asChild a single anchor carrying the button’s props. Make the upper column visibly taller.'],
      ]},
      { name: '03 — Who holds the value', blocks: [
        ['h2', 'Who holds the value'],
        ['p', 'Any component with a value can work two ways, and you pick per instance.'],
        ['p', 'Let the component hold it. Pass defaultValue and forget about it. The component tracks its own state and tells you when it changes.', ['defaultValue']],
        ['code', '<Tabs defaultValue="account" />'],
        ['p', 'Hold it yourself. Pass value and onValueChange, and the component renders whatever you give it.', ['value', 'onValueChange']],
        ['code', '<Tabs value={tab} onValueChange={setTab} />'],
        ['p', 'Use the first unless you need the second. You need the second when something outside the component has to change the value, or when the value belongs in a URL or a form you already manage.'],
        ['alert', 'info', 'Pass one or the other, not both. defaultValue is the starting value for a component managing itself; value is a value you are managing. Supplying both is contradictory, and the props tables cannot show that constraint because it flattens into a plain list.'],
      ]},
      { name: '04 — Components made of parts', blocks: [
        ['h2', 'Components made of parts'],
        ['p', 'Simple components are one element. Anything with structure is several, and you assemble them:'],
        ['code', '<Tabs.Root defaultValue="account">\n  <Tabs.List>\n    <Tabs.Trigger value="account">Account</Tabs.Trigger>\n    <Tabs.Trigger value="billing">Billing</Tabs.Trigger>\n  </Tabs.List>\n  <Tabs.Content value="account">...</Tabs.Content>\n</Tabs.Root>', { lineNumbers: true }],
        ['p', 'That is more typing than a single component taking an array of tabs, and it is deliberate. You can put anything between the parts, style each one, and reorder them, without the library having anticipated it.'],
        ['p', 'The parts share state through React context, so Tabs.Trigger knows which tab is open without you passing anything down.', ['Tabs.Trigger']],
        ['p', 'Part names differ slightly between the two paths, and the docs follow whichever you are reading. Headless gives you one export with parts hanging off it (Tabs.Trigger). The copied styled file gives you flat exports (TabsTrigger).', ['Tabs.Trigger', 'TabsTrigger']],
      ]},
      { name: '05 — Styling against state', blocks: [
        ['h2', 'Styling against state'],
        ['p', 'Components describe their own state in the DOM, as data attributes. An open panel carries data-state="open". A disabled control carries data-disabled. You style against those:', ['data-state="open"', 'data-disabled']],
        ['code', '.my-trigger[data-state="open"] .chevron {\n  transform: rotate(180deg);\n}'],
        ['p', 'This is why the styled layer needs no JavaScript to know what to look like, and why you can restyle any component without touching its behaviour. Every component page lists the attributes it publishes.'],
        ['links', ['Browse components →', 'Accessibility →']],
      ]},
    ],
  },

  accessibility: {
    name: 'Accessibility',
    eyebrow: 'CONCEPTS',
    title: 'Accessibility',
    lede: 'Accessibility is not a pass someone does at the end here. It is a property of the components, checked continuously.',
    head: [
      ['alert', 'warning', 'PUBLICATION GATE — do not ship this page before the deferred accessibility pass has run. Every commitment below is believed true and none has been audited end to end. Verify each, then publish. An accessibility page that overclaims is worse than no page.'],
      ['p', 'That claim is worth being precise about, because "accessible" is claimed by nearly every component library and means different things. Here is what we guarantee, and what remains yours.'],
    ],
    current: 'Accessibility',
    toc: ['What we guarantee', 'What stays yours', 'How the guarantees are kept', 'Checking your own work'],
    sections: [
      { name: '02 — What we guarantee', blocks: [
        ['h2', 'What we guarantee'],
        ['group', 'flow/section', [
          ['block', 'Every interactive component follows its WAI-ARIA pattern.', 'Not an approximation. Tabs behave like the tabs pattern, a tree like the tree view, a combobox like a combobox. Roles, states and properties are set for you.'],
          ['block', 'Keyboard support is built in.', 'Arrow keys, Home and End, Escape, type-ahead, and correct focus movement when things open and close. It is part of the component, not something you add.'],
          ['block', 'Contrast is guaranteed by the engine that generates the colour.', 'Every step of every generated scale has a text colour that clears its minimum, and the semantic roles are derived by contrast rather than chosen by eye.'],
          ['block', 'Focus is always visible.', 'On every control, in both themes.'],
        ]],
      ]},
      { name: '03 — What stays yours', blocks: [
        ['h2', 'What stays yours'],
        ['p', 'A component library cannot make a product accessible on its own. These are yours, and no library can do them for you:'],
        ['defs', [
          ['Labels', 'We cannot know what your field is called. An input with no label is inaccessible however good the input is.'],
          ['Reading order and headings', 'The structure of your page, and picking heading levels that nest properly.'],
          ['Alternative text', 'For your images and icons.'],
          ['Colour choice', 'The generated palette holds its contrast, but you can still put text on a background it was never paired with.'],
          ['Content', 'Plain language, sensible link text, error messages that say what to do.'],
        ]],
        ['gap', 'A11Y-C01', 380, '3:1 → stacked on mobile  ·  342×380', 'Two regions of equal weight either side of a line: what the component handles, what you handle. No ticks and crosses — both sides are required work.'],
      ]},
      { name: '04 — How the guarantees are kept', blocks: [
        ['h2', 'How the guarantees are kept'],
        ['p', 'The behaviour layer is tested to full coverage, and then mutation-tested. Mutation testing changes the code deliberately and checks that a test fails. It is the difference between a keyboard model that is merely covered and one that is actually asserted on.'],
        ['p', 'Colour is checked at the source. The contrast floors live in the engine that generates the palette, and the semantic roles are pinned to what that engine derives, so they cannot drift quietly.'],
      ]},
      { name: '05 — Checking your own work', blocks: [
        ['h2', 'Checking your own work'],
        ['p', 'Three checks catch most of what matters, and none needs a specialist:'],
        ['defs', [
          ['Unplug your mouse', 'Tab through the page. If you cannot reach something, or you lose track of where you are, that is a real bug.'],
          ['Zoom to 200%', 'Text should reflow rather than clip.'],
          ['Read your labels aloud', 'If a link says "click here", it says nothing useful out of context.'],
        ]],
        ['links', ['Composition →', 'Browse components →']],
      ]},
    ],
  },

  'registry-cli': {
    name: 'The registry and CLI',
    eyebrow: 'BUILD',
    title: 'The registry and CLI',
    lede: 'Styled components are not installed. They are copied into your project as files you own, edit and commit. The registry is the catalogue they are copied from, and the CLI does the copying.',
    head: [
      ['p', 'This is a deliberate trade. A package is easier to update and harder to change. A copied file is the reverse: nothing upstream will overwrite it, and nothing upstream will fix it for you either. For the styling layer that is the right way round, because styling is the part you most want to change and least want changed under you.'],
      ['p', 'Behaviour goes the other way. That still comes from @primitiv-ui/react as a normal dependency, so you get fixes to keyboard handling and accessibility without merging anything. You own the appearance. You do not have to own the hard part.', ['@primitiv-ui/react']],
      ['gap', 'CLI-01', 360, '2:1 → stacked on mobile  ·  342×360', 'Two zones: your repository (the copied files, primitiv.json, primitiv.lock) and installed from npm (one package), with a single one-way connector labelled behaviour, keyboard, ARIA.'],
    ],
    current: 'primitiv add',
    toc: ['The commands', 'The two files', 'Where components come from', 'Why a registry rather than a package'],
    sections: [
      { name: '02 — The commands', blocks: [
        ['h2', 'The commands'],
        ['p', 'Five commands. Most days you only use one.'],
        ['group', 'flow/section', [
          ['h4', 'primitiv add'],
          ['p', 'Copies one or more components into your project.'],
          ['code', '$ npx primitiv add button\n$ npx primitiv add button select modal'],
          ['flags', [
            ['--force', 'overwrites files you have changed, without asking.'],
            ['--styles-only', 'copies the stylesheet and skips the React file.'],
            ['--no-wiring', 'skips the project wiring, if you prefer to do it yourself.'],
            ['--dry-run', 'shows what would happen and writes nothing.'],
          ]],
          ['p', 'On its first run in a project it also does the setup: installs what it needs, writes primitiv.json, generates your token layer, and wires the stylesheet import. That is intentional, so a new project is one command rather than four.', ['primitiv.json']],
          ['h4', 'primitiv init'],
          ['p', 'Sets a project up without adding a component. It asks a few questions, or takes --yes to accept the defaults, and finishes by generating the token layer.', ['--yes']],
          ['code', '$ npx primitiv init\n$ npx primitiv init --yes'],
          ['h4', 'primitiv tokens'],
          ['p', 'Regenerates your token layer in the format your config asks for.'],
          ['code', '$ npx primitiv tokens\n$ npx primitiv tokens --format scss'],
          ['h4', 'primitiv theme'],
          ['p', 'Generates a full light and dark palette from one brand colour, with every semantic role assigned by contrast. It writes into its own layer, so it beats the base tokens without editing them.'],
          ['code', '$ npx primitiv theme --brand "#0a7755"'],
          ['h4', 'primitiv list'],
          ['p', 'Shows what is installable, and what you already have.'],
          ['code', '$ npx primitiv list\n$ npx primitiv list --json'],
        ]],
      ]},
      { name: '03 — The two files', blocks: [
        ['h2', 'The two files'],
        ['p', 'The CLI keeps two files in your project. Both are meant to be committed.'],
        ['p', 'primitiv.json — your settings.', ['primitiv.json']],
        ['code', '{\n  "version": 1,\n  "framework": "react",\n  "styles": { "enabled": true, "format": "css",\n              "path": "src/styles/primitiv" },\n  "tokens": { "format": "css",\n              "path": "src/styles/primitiv/tokens.css" },\n  "theme": { "brand": "#0a7755" },\n  "aliases": {},\n  "registry": { "version": "0.1.0" }\n}', { lineNumbers: true }],
        ['p', 'Edit it freely. It decides where files land, which format your tokens emit in, and which registry version you are pulling from.'],
        ['p', 'primitiv.lock — what you have.', ['primitiv.lock']],
        ['p', 'A list of the components you have added and a hash of every file. The CLI uses it to tell whether you have edited a copied file, so it can ask before overwriting your work rather than assuming.'],
        ['alert', 'info', 'If you edit a copied component and later run add for it again, the CLI notices and asks. Answering "keep" leaves your version alone. This is the whole reason the lock file exists.'],
      ]},
      { name: '04 — Where components come from', blocks: [
        ['h2', 'Where components come from'],
        ['p', 'By default the CLI carries the registry inside itself, so add works with no network call and no version drift between the tool and the catalogue.', ['add']],
        ['p', 'You can point it somewhere else. --registry takes a local path, for a private registry of your own components, or a URL, to pull a specific published version.', ['--registry']],
        ['code', '$ npx primitiv add button --registry ./my-registry\n$ npx primitiv add button --registry 0.1.0'],
        ['p', 'One consequence worth knowing: because the registry is baked into the binary, a change to a component reaches you when a new CLI version is published, not before. If a component looks out of date, update the CLI.'],
      ]},
      { name: '05 — Why a registry rather than a package', blocks: [
        ['h2', 'Why a registry rather than a package'],
        ['p', 'The honest answer is that it depends what you are optimising for, and this model optimises for change.'],
        ['p', "A styled component is where your product's personality lives. You will want to adjust its padding, add a variant your designer invented, or strip a prop you never use. In a package, each of those is a configuration API someone has to design, or an override that fights the library. As a file, each is an edit."],
        ['p', "If you want the styling to update automatically and you never intend to change it, a package would serve you better, and it is fair to say so. Primitiv's answer for that case is the headless package plus your own stylesheet, which updates normally and never surprises you."],
        ['links', ['Composition →', 'Tokens and theming →', 'Browse components →']],
      ]},
    ],
  },

  figma: {
    name: 'Design in Figma',
    eyebrow: 'DESIGN',
    title: 'Design in Figma',
    lede: 'The Figma library holds the same components as the code, built from the same tokens. What you draw is what gets built.',
    head: [
      ['p', 'That is a stronger claim than most design systems can make, so it is worth saying what it rests on. The colours, spacing, type sizes and corner radii in the file are not values someone typed in. They are Figma variables generated from the same source as the CSS. When a token changes, both sides move together.'],
    ],
    current: 'The library',
    toc: ['What is in the library', 'How it stays in step', 'Two things the file cannot match', 'Working with a developer', 'Where the colour comes from'],
    pairs: [{ id: 'FIGMA-P02', count: 2 }],
    sections: [
      { name: '02 — What is in the library', blocks: [
        ['h2', 'What is in the library'],
        ['p', 'Component sets covering the same ground as the code: framed controls like Button, Input and Select; content components like Table, Blockquote and List; and full compositions like Card, Navigation Menu and Confirm Dialog.'],
        ['p', 'Every set carries the axes you would expect. Size runs xs to xl. Variants cover the states a component genuinely has, and interaction states are drawn rather than implied. Layout primitives are there too, so a page can be built from real components rather than anonymous frames.', ['xs', 'xl']],
        ['p', 'The variables come in modes. Colour has Light and Dark. Sizing has the four density modes, so you can switch a frame from Comfortable to Dense and watch it reproportion, exactly as the code does.'],
        ['gap', 'FIGMA-P01', 420, '16:10 → crop to the grid alone on mobile  ·  342×420', 'GENUINE screenshot, never a recreation: the Button component set as its full variant grid with the generated row and column labels, layers panel left, variant properties right.'],
      ]},
      { name: '03 — How it stays in step', blocks: [
        ['h2', 'How it stays in step'],
        ['p', 'The token values are the shared source. They live in one place, emit to CSS for the code, and sync to Figma variables for the file. Neither side is copied from the other by hand.'],
        ['p', 'That is what keeps a colour honest. A designer picking action/primary/default in Figma and a developer writing --primitiv-action-primary-default in CSS are naming the same value, not two values that were once the same.', ['action/primary/default', '--primitiv-action-primary-default']],
        ['gap', 'FIGMA-P02', 256, '4:3 → full width on mobile  ·  342×256', 'One source at the top, two arms of identical weight: Figma variables on one side, CSS custom properties on the other, each showing the same token name. No arrow between the two outputs.'],
      ]},
      { name: '04 — Two things the file cannot match', blocks: [
        ['h2', 'Two things the file cannot match'],
        ['p', 'Two components genuinely differ between Figma and the browser, and it is better to know now than to find out during handoff.'],
        ['defs', [
          ['Grid is an approximation', 'Figma cannot apply CSS grid layout inside a component slot, so the Grid component is built with wrapping instead. It looks right in most layouts and it will not behave identically to the real thing in every case.'],
          ['Aspect Ratio is fixed, not fluid', 'In the browser the component holds a ratio at any width. In Figma it holds specific pixel dimensions.'],
        ]],
        ['p', "Everything else matches. Both limits are Figma's rather than choices, and both are recorded in the components' own descriptions in the file, so a designer who never reads this page still finds out."],
      ]},
      { name: '05 — Working with a developer', blocks: [
        ['h2', 'Working with a developer'],
        ['p', 'Handoff is lighter than usual here, because most of what you would normally write down is already shared.'],
        ['defs', [
          ['Name components as they are named', 'If you used Select, say Select. The developer has a component with that name and the same variants.'],
          ['Say the token, not the value', '"Surface, subtle" survives a theme change and a dark mode. #f4f4f5 does not.'],
          ['Say which density', 'It is a real setting on their side, and it changes every measurement you might otherwise be asked for.'],
          ['Do not redline spacing', 'The spacing is a token. Naming it is enough, and measuring it invites a number that will drift.'],
        ]],
      ]},
      { name: '06 — Where the colour comes from', blocks: [
        ['h2', 'Where the colour comes from'],
        ['p', 'The palette in the file is generated rather than picked. A colour engine called Harmoni builds each scale from one seed colour, choosing the text colour that pairs with every step and checking contrast as it goes.'],
        ['p', 'Harmoni is also a Figma plugin, for teams who want to generate their own palettes this way. You do not need it to use the library — the palette it produced is already in the file.'],
        ['alert', 'warning', 'OPEN QUESTION, decide before this page publishes — whether the planned standard ramps appear in the Figma file at all. "The same tokens as the code" is a claim this page makes, and twenty ramps no component binds to may be clutter rather than parity.'],
      ]},
    ],
  },
};

const ALL = Object.keys(PAGES);

/* ═══════════════════════════════════════════════════════════════════════════
   THE RENDERER — below here is machinery, not content
   ═══════════════════════════════════════════════════════════════════════════ */

const PAGE_ID = '2229:25998';                 // Figma page "Docs Site — Content pages (v3)"
const INTENT = 'VariableCollectionId:346:4407';
const CONTEXT = 'VariableCollectionId:369:31958';
const MODE_DARK = '372:1';
const MODE_COMFORTABLE = '369:10';
const SRC = {                                  // cloned chrome, from Home (v3)
  homePage: '2180:91839',
  headerMobile: '2187:93215',
  headerDesktop: '2183:92069',
  footerMobile: '2183:92534',
  footerDesktop: '2183:92155',
};
const SETS = { inlineCode: '601:9492', codeBlock: '601:9607', alert: '1400:33113', divider: '401:18380' };

for (const f of [
  { family: 'Khand', style: 'Medium' },
  { family: 'Khand', style: 'SemiBold' },
  { family: 'Asta Sans', style: 'Regular' },
  { family: 'JetBrains Mono', style: 'Regular' },
]) await figma.loadFontAsync(f);

const vs = await figma.variables.getLocalVariablesAsync();
const VAR = {};
vs.forEach((v) => (VAR[v.name] = v));
const V = (n) => { const v = VAR[n]; if (!v) throw new Error('missing var: ' + n); return v; };
const paint = (role) =>
  figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 1 }, 'color', V(role));

const FACE = {
  'heading/h1': ['Khand', 'SemiBold'], 'heading/h2': ['Khand', 'SemiBold'],
  'heading/h3': ['Khand', 'SemiBold'], 'heading/h4': ['Khand', 'SemiBold'],
  'heading/h5': ['Khand', 'SemiBold'], 'label/md': ['Khand', 'SemiBold'],
  overline: ['Khand', 'Medium'],
  'body/lg': ['Asta Sans', 'Regular'], 'body/md': ['Asta Sans', 'Regular'], 'body/sm': ['Asta Sans', 'Regular'],
};
const FIELDS = { fontFamily: 'font-family', fontStyle: 'font-style', fontSize: 'font-size', lineHeight: 'line-height', letterSpacing: 'letter-spacing' };

function T(role, chars, colorRole, align) {
  const t = figma.createText();
  t.name = role;
  t.fontName = { family: FACE[role][0], style: FACE[role][1] };
  t.characters = chars;
  t.textAutoResize = 'HEIGHT';
  for (const k of Object.keys(FIELDS)) { const v = VAR[role + '/' + FIELDS[k]]; if (v) t.setBoundVariable(k, v); }
  t.fills = [paint(colorRole)];
  if (align) t.textAlignHorizontal = align;
  return t;
}
/** One word of body/md, auto-width — the atom a rich paragraph is built from. */
function Wd(chars, colorRole) {
  const t = figma.createText();
  t.name = 'w';
  t.fontName = { family: 'Asta Sans', style: 'Regular' };
  t.characters = chars;
  t.textAutoResize = 'WIDTH_AND_HEIGHT';
  for (const k of Object.keys(FIELDS)) { const v = VAR['body/md/' + FIELDS[k]]; if (v) t.setBoundVariable(k, v); }
  t.fills = [paint(colorRole)];
  return t;
}
function F(name, dir, gapVar, pad) {
  const f = figma.createFrame();
  f.name = name; f.layoutMode = dir;
  f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO';
  f.paddingTop = pad[0]; f.paddingRight = pad[1]; f.paddingBottom = pad[2]; f.paddingLeft = pad[3];
  f.itemSpacing = 0;
  if (gapVar) f.setBoundVariable('itemSpacing', V(gapVar));
  f.fills = [];
  return f;
}
/* Set FILL only after appending, and do not touch primary/counterAxisSizingMode
   afterwards — on a HORIZONTAL frame `primaryAxisSizingMode = "AUTO"` silently
   cancels a FILL set immediately before it (content-plan §5.2 finding 1). */
const fh = (n) => { n.layoutSizingHorizontal = 'FILL'; return n; };

const INLINE_MD = (await figma.getNodeByIdAsync(SETS.inlineCode)).children.find((c) => c.name === 'Size=md');
const CODEBLOCK = await figma.getNodeByIdAsync(SETS.codeBlock);
const ALERT = await figma.getNodeByIdAsync(SETS.alert);
const DIVIDER = (await figma.getNodeByIdAsync(SETS.divider)).children.find((c) => c.name === 'Orientation=horizontal');
const SENT = String.fromCharCode(1);
const WORD_SPACE = 4; // the measured space advance of body/md at Comfortable

/*
 * A paragraph carrying real `Inline Code` instances.
 *
 * A Figma text node cannot contain a component, so the paragraph becomes a
 * wrapping horizontal auto-layout: one node per word, chips among them.
 *
 * Two details that took a rebuild to get right:
 *   1. An auto-width text node TRIMS its trailing space, so "You " renders at
 *      the width of "You" and the sentence closes up into one run. Spacing is
 *      `itemSpacing` instead, set to the measured space advance.
 *   2. Uniform itemSpacing would then put a gap between a chip and the full
 *      stop after it. Atoms with no space between them are grouped into one
 *      zero-gap frame, which is a single flex item, so punctuation hugs it.
 *
 * The source string goes on the frame's pluginData, so a paragraph can be
 * rebuilt at a new width without retyping it.
 */
function rich(parent, chars, fragments, colorRole) {
  let s = chars;
  const codes = [];
  for (const f of fragments.slice().sort((x, y) => y.length - x.length)) {
    let i;
    while ((i = s.indexOf(f)) !== -1) { const k = codes.push(f) - 1; s = s.slice(0, i) + SENT + k + SENT + s.slice(i + f.length); }
  }
  const row = figma.createFrame();
  row.name = 'body/md · rich';
  row.layoutMode = 'HORIZONTAL'; row.layoutWrap = 'WRAP';
  row.primaryAxisSizingMode = 'FIXED'; row.counterAxisSizingMode = 'AUTO';
  row.counterAxisAlignItems = 'CENTER';
  row.itemSpacing = WORD_SPACE; row.counterAxisSpacing = 0;
  row.fills = [];
  row.setPluginData('source', chars);
  row.setPluginData('fragments', JSON.stringify(fragments));
  parent.appendChild(row);
  row.layoutSizingHorizontal = 'FILL';
  const chip = (f) => { const i = INLINE_MD.createInstance(); i.setProperties({ 'Code#612:474': f }); return i; };
  for (const chunk of s.split(' ')) {
    if (!chunk.length) continue;
    const atoms = [];
    let rest = chunk;
    while (rest.length) {
      const p = rest.indexOf(SENT);
      if (p === -1) { atoms.push({ text: rest }); break; }
      if (p > 0) atoms.push({ text: rest.slice(0, p) });
      const q = rest.indexOf(SENT, p + 1);
      atoms.push({ code: codes[Number(rest.slice(p + 1, q))] });
      rest = rest.slice(q + 1);
    }
    if (atoms.length === 1) {
      row.appendChild(atoms[0].code ? chip(atoms[0].code) : Wd(atoms[0].text, colorRole));
    } else {
      const g = figma.createFrame();
      g.name = 'group'; g.layoutMode = 'HORIZONTAL';
      g.primaryAxisSizingMode = 'AUTO'; g.counterAxisSizingMode = 'AUTO';
      g.counterAxisAlignItems = 'CENTER'; g.itemSpacing = 0; g.fills = [];
      row.appendChild(g);
      for (const at of atoms) g.appendChild(at.code ? chip(at.code) : Wd(at.text, colorRole));
    }
  }
  return row;
}

/*
 * A Code Block carrying real content. The code text is a plain sublayer with no
 * TEXT property, so it is set directly — a legitimate instance override that
 * sticks. (The warning about silent failures applies to property-BOUND text.)
 * `tabbed` gives the npm/pnpm/yarn/bun header the install commands want.
 */
function codeBlock(parent, code, o) {
  o = o || {};
  const tabbed = o.tabbed === true;
  const size = o.size || 'sm';
  const v = CODEBLOCK.children.find((c) => c.name === 'Size=' + size + ', Type=' + (tabbed ? 'tabbed' : 'default'));
  const inst = v.createInstance();
  parent.appendChild(inst);
  inst.setProperties({ 'Show Line Numbers#601:158': !!o.lineNumbers });
  if (!tabbed) inst.setProperties({ 'Show Header#601:152': false });
  inst.findOne((n) => n.type === 'TEXT' && n.name === 'Code').characters = code;
  inst.layoutSizingHorizontal = 'FILL';
  return inst;
}
/** A callout. Title off, dismiss off — a docs callout is not dismissible. */
function alertBlock(parent, tone, text) {
  const v = ALERT.children.find((c) => c.name === 'Tone=' + tone + ', Size=sm');
  const i = v.createInstance();
  parent.appendChild(i);
  i.setProperties({ 'Show title#1400:254': false, 'Show dismiss#1400:275': false, 'Description#1400:233': text });
  i.layoutSizingHorizontal = 'FILL';
  return i;
}
/*
 * A deliberate gap where an illustration goes, carrying its id, size and
 * rhetorical job. Keep the id in the layer name — that is how finished artwork
 * is matched back to its brief.
 */
function gapFrame(parent, id, h, label, job) {
  const g = figma.createFrame();
  g.name = '⟦ ILLUSTRATION GAP · ' + id + ' ⟧';
  g.layoutMode = 'VERTICAL'; g.itemSpacing = 8;
  g.paddingTop = 20; g.paddingRight = 20; g.paddingBottom = 20; g.paddingLeft = 20;
  g.primaryAxisAlignItems = 'CENTER'; g.counterAxisAlignItems = 'CENTER';
  g.cornerRadius = 8;
  g.fills = [paint('surface/subtle')];
  g.strokes = [paint('border/strong')]; g.strokeWeight = 1; g.dashPattern = [8, 6];
  parent.appendChild(g);
  const a = T('label/md', id, 'content/primary', 'CENTER'); g.appendChild(a); fh(a);
  const b = T('body/sm', label, 'content/muted', 'CENTER'); b.name = 'size'; g.appendChild(b); fh(b);
  const c = T('body/sm', job, 'content/secondary', 'CENTER'); g.appendChild(c); fh(c);
  g.layoutSizingHorizontal = 'FILL'; g.layoutSizingVertical = 'FIXED'; g.resize(g.width, h);
  return g;
}

/** Render one block form into `parent`. The whole content DSL lives here. */
function renderBlock(parent, b) {
  const [kind] = b;
  if (kind === 'h2' || kind === 'h3' || kind === 'h4' || kind === 'h5') {
    const t = T('heading/' + kind, b[1], 'content/primary');
    parent.appendChild(t); return fh(t);
  }
  if (kind === 'p') {
    if (b[2] && b[2].length) return rich(parent, b[1], b[2], 'content/secondary');
    const t = T('body/md', b[1], 'content/secondary'); parent.appendChild(t); return fh(t);
  }
  if (kind === 'block') {
    const f = F('flow · tight', 'VERTICAL', 'flow/tight', [0, 0, 0, 0]);
    parent.appendChild(f); fh(f);
    const h = T('heading/h4', b[1], 'content/primary'); f.appendChild(h); fh(h);
    renderBlock(f, ['p', b[2], b[3]]);
    return f;
  }
  if (kind === 'code') return codeBlock(parent, b[1], b[2]);
  if (kind === 'alert') return alertBlock(parent, b[1], b[2]);
  if (kind === 'gap') return gapFrame(parent, b[1], b[2], b[3], b[4]);
  if (kind === 'defs') {
    const f = F('definitions', 'VERTICAL', 'flow/tight', [0, 0, 0, 0]);
    parent.appendChild(f); fh(f);
    for (const [term, desc] of b[1]) {
      const r = F('row', 'VERTICAL', null, [0, 0, 0, 0]); r.itemSpacing = 2;
      f.appendChild(r); fh(r);
      const a = T('label/md', term, 'content/primary'); r.appendChild(a); fh(a);
      const c = T('body/md', desc, 'content/secondary'); r.appendChild(c); fh(c);
    }
    return f;
  }
  if (kind === 'flags') {
    const f = F('flags', 'VERTICAL', 'flow/tight', [0, 0, 0, 0]);
    parent.appendChild(f); fh(f);
    renderBlock(f, ['p', 'Useful flags:']);
    for (const [flag, desc] of b[1]) renderBlock(f, ['p', flag + ' ' + desc, [flag]]);
    return f;
  }
  if (kind === 'links') {
    const f = F('links', 'VERTICAL', 'flow/tight', [0, 0, 0, 0]);
    parent.appendChild(f); fh(f);
    for (const l of b[1]) { const a = T('label/md', l, 'action/link/foreground/default'); f.appendChild(a); fh(a); }
    return f;
  }
  if (kind === 'doors') {
    const f = F('doors', 'VERTICAL', null, [0, 0, 0, 0]); f.itemSpacing = 0;
    parent.appendChild(f); fh(f);
    b[1].forEach(([term, desc], i) => {
      if (i > 0) { const d = DIVIDER.createInstance(); f.appendChild(d); d.layoutSizingHorizontal = 'FILL'; }
      const r = F('door', 'VERTICAL', 'flow/tight', [16, 0, 16, 0]); f.appendChild(r); fh(r);
      const a = T('label/md', term, 'action/link/foreground/default'); r.appendChild(a); fh(a);
      const c = T('body/md', desc, 'content/secondary'); r.appendChild(c); fh(c);
    });
    return f;
  }
  if (kind === 'group') {
    const f = F('group', 'VERTICAL', b[1], [0, 0, 0, 0]);
    parent.appendChild(f); fh(f);
    for (const inner of b[2]) renderBlock(f, inner);
    return f;
  }
  throw new Error('unknown block: ' + kind);
}

/** The mobile frame: 390 wide, 24px gutters, no rails (shell.css below 64rem). */
async function buildMobile(key, x, y) {
  const spec = PAGES[key];
  const page = await figma.getNodeByIdAsync(PAGE_ID); await page.loadAsync();
  const home = await figma.getNodeByIdAsync(SRC.homePage); await home.loadAsync();

  const root = figma.createFrame();
  root.name = spec.name + ' — mobile';
  root.resize(390, 800);
  root.layoutMode = 'VERTICAL'; root.itemSpacing = 0;
  root.primaryAxisSizingMode = 'AUTO'; root.counterAxisSizingMode = 'FIXED';
  root.fills = [paint('surface/default')];
  page.appendChild(root); root.x = x; root.y = y;
  root.setExplicitVariableModeForCollection(await figma.variables.getVariableCollectionByIdAsync(INTENT), MODE_DARK);
  root.setExplicitVariableModeForCollection(await figma.variables.getVariableCollectionByIdAsync(CONTEXT), MODE_COMFORTABLE);

  const header = (await figma.getNodeByIdAsync(SRC.headerMobile)).clone();
  root.appendChild(header); fh(header);

  const head = F('01 — Page head', 'VERTICAL', 'flow/section', [40, 24, 0, 24]);
  root.appendChild(head); fh(head);
  const eyebrow = T('overline', spec.eyebrow, 'content/muted'); head.appendChild(eyebrow); fh(eyebrow);
  const title = F('flow · tight', 'VERTICAL', 'flow/tight', [0, 0, 0, 0]);
  head.appendChild(title); fh(title);
  const h1 = T('heading/h1', spec.title, 'content/primary'); title.appendChild(h1); fh(h1);
  const lede = T('body/lg', spec.lede, 'content/secondary'); title.appendChild(lede); fh(lede);
  for (const b of spec.head || []) renderBlock(head, b);

  spec.sections.forEach((s, i) => {
    const band = F(s.name, 'VERTICAL', 'flow/section', [48, 24, 0, 24]);
    root.appendChild(band); fh(band);
    if (i === spec.sections.length - 1) band.setBoundVariable('paddingBottom', V('space/space-56'));
    for (const b of s.blocks) renderBlock(band, b);
  });

  const footer = (await figma.getNodeByIdAsync(SRC.footerMobile)).clone();
  footer.name = '99 — Footer';
  root.appendChild(footer); fh(footer);
  return root;
}

/* The settled nav. Not `src/lib/nav.ts`, which still carries the dead anchors
   this round of pages replaces — see content-plan §3.

   No Harmoni entry: the page is deliberately not built (2026-09-07), because
   Harmoni is getting its own website. Naming the engine in prose is fine and
   several pages do it; what must not exist is a link to a page that does not.
   Add the entry back as an external link when that site is live. */
const NAV = [
  ['Start Here', ['Introduction', 'Install it', 'Your first component']],
  ['Concepts', ['What Primitiv is', 'Tokens & theming', 'Density', 'Composition', 'Accessibility']],
  ['Components', ['Overview', 'Layout', 'Typography', 'Forms', 'Navigation', '… 63 total']],
  ['Registry & CLI', ['primitiv add', 'primitiv tokens', 'primitiv theme', 'primitiv list']],
  ['Design in Figma', ['The library']],
];

/* Wrap a gap and the `count` blocks above it into a two-column desktop row. */
function pairWithPrevious(gap, count) {
  const section = gap.parent;
  const idx = section.children.indexOf(gap);
  const left = section.children.slice(idx - count, idx);
  const row = F('two columns', 'HORIZONTAL', 'grid/gap/xl', [0, 0, 0, 0]);
  row.counterAxisAlignItems = 'MIN';
  section.insertChild(idx - count, row);
  row.layoutSizingHorizontal = 'FILL';
  const lcol = F('pair · left', 'VERTICAL', 'flow/normal', [0, 0, 0, 0]);
  row.appendChild(lcol); lcol.layoutSizingHorizontal = 'FILL';
  for (const c of left) lcol.appendChild(c);
  for (const c of lcol.children) c.layoutSizingHorizontal = 'FILL';
  const rcol = F('pair · right', 'VERTICAL', null, [0, 0, 0, 0]);
  row.appendChild(rcol); rcol.layoutSizingHorizontal = 'FILL';
  rcol.appendChild(gap); gap.layoutSizingHorizontal = 'FILL';
  return row;
}
/*
 * Desktop only: a code block sits in a narrower, centred well rather than
 * stretching the full prose measure. Blocks inside a half-width paired column
 * step down to Size=xs instead — at sm the line wraps.
 */
function centreCodeBlocks(root) {
  for (const cb of root.findAll((x) => x.type === 'INSTANCE' && x.name === 'Code Block')) {
    if (cb.parent.name === 'code · well') continue;
    let p = cb.parent, paired = false;
    while (p && p.name !== 'main') { if (p.name === 'pair · left') { paired = true; break; } p = p.parent; }
    if (paired) { cb.setProperties({ Size: 'xs' }); continue; }
    const parent = cb.parent, idx = parent.children.indexOf(cb);
    const well = F('code · well', 'HORIZONTAL', null, [0, 0, 0, 0]);
    well.primaryAxisAlignItems = 'CENTER';
    well.setBoundVariable('paddingLeft', V('space/space-48'));
    well.setBoundVariable('paddingRight', V('space/space-48'));
    parent.insertChild(idx, well);
    well.primaryAxisSizingMode = 'FIXED'; well.layoutSizingHorizontal = 'FILL';
    well.appendChild(cb); cb.layoutSizingHorizontal = 'FILL';
  }
}

/** The desktop frame: the mobile sections, re-flowed into the docs shell. */
async function buildDesktop(key, x, y) {
  const spec = PAGES[key];
  const page = await figma.getNodeByIdAsync(PAGE_ID); await page.loadAsync();
  const mobile = page.children.find((c) => c.name === spec.name + ' — mobile');
  if (!mobile) throw new Error('build the mobile frame first: ' + key);
  const home = await figma.getNodeByIdAsync(SRC.homePage); await home.loadAsync();

  const root = figma.createFrame();
  root.name = spec.name + ' — desktop';
  root.resize(1440, 900);
  root.layoutMode = 'VERTICAL'; root.itemSpacing = 0;
  root.primaryAxisSizingMode = 'AUTO'; root.counterAxisSizingMode = 'FIXED';
  root.fills = [paint('surface/default')];
  page.appendChild(root); root.x = x; root.y = y;
  root.setExplicitVariableModeForCollection(await figma.variables.getVariableCollectionByIdAsync(INTENT), MODE_DARK);
  root.setExplicitVariableModeForCollection(await figma.variables.getVariableCollectionByIdAsync(CONTEXT), MODE_COMFORTABLE);

  const header = (await figma.getNodeByIdAsync(SRC.headerDesktop)).clone();
  header.name = '00 — Header (desktop)';
  root.appendChild(header); fh(header);

  const band = F('docs grid', 'HORIZONTAL', null, [0, 0, 0, 0]);
  band.primaryAxisAlignItems = 'CENTER';
  root.appendChild(band); fh(band);
  const grid = F('container · xl', 'HORIZONTAL', 'grid/gap/xl', [0, 0, 0, 0]);
  grid.setBoundVariable('paddingLeft', V('container/gutter/lg'));
  grid.setBoundVariable('paddingRight', V('container/gutter/lg'));
  grid.counterAxisAlignItems = 'MIN';
  band.appendChild(grid);
  grid.layoutSizingHorizontal = 'FIXED'; grid.resize(1280, 100); grid.layoutSizingVertical = 'HUG';

  const sidebar = F('sidebar · SideNav', 'VERTICAL', 'flow/section', [48, 0, 48, 0]);
  grid.appendChild(sidebar);
  sidebar.layoutSizingHorizontal = 'FIXED'; sidebar.resize(260, 100); sidebar.layoutSizingVertical = 'HUG';
  for (const [title, entries] of NAV) {
    const sec = F(title, 'VERTICAL', 'flow/tight', [0, 0, 0, 0]); sidebar.appendChild(sec); fh(sec);
    const t = T('overline', title.toUpperCase(), 'content/muted'); sec.appendChild(t); fh(t);
    const ul = F('links', 'VERTICAL', null, [0, 0, 0, 0]); ul.itemSpacing = 10; sec.appendChild(ul); fh(ul);
    for (const l of entries) {
      const n = T('body/sm', l, l === spec.current ? 'content/primary' : 'content/secondary');
      ul.appendChild(n); fh(n);
    }
  }

  const main = F('main', 'VERTICAL', null, [48, 0, 0, 0]);
  main.itemSpacing = 0;
  main.setBoundVariable('paddingBottom', V('space/space-96'));
  grid.appendChild(main); main.layoutSizingHorizontal = 'FILL';
  const names = ['01 — Page head'].concat(spec.sections.map((s) => s.name));
  for (const n of names) {
    const c = mobile.children.find((x) => x.name === n).clone();
    c.paddingLeft = 0; c.paddingRight = 0; c.paddingBottom = 0;
    c.paddingTop = n === names[0] ? 0 : 48;
    main.appendChild(c); fh(c);
  }
  for (const p of spec.pairs || []) {
    const g = main.findOne((n) => n.name.indexOf(p.id) !== -1);
    if (g) pairWithPrevious(g, p.count);
  }
  centreCodeBlocks(main);

  const toc = F('toc · On this page', 'VERTICAL', 'flow/tight', [48, 0, 48, 0]);
  grid.appendChild(toc);
  toc.layoutSizingHorizontal = 'FIXED'; toc.resize(260, 100); toc.layoutSizingVertical = 'HUG';
  const th = T('overline', 'ON THIS PAGE', 'content/muted'); toc.appendChild(th); fh(th);
  const tl = F('links', 'VERTICAL', null, [0, 0, 0, 0]); tl.itemSpacing = 10; toc.appendChild(tl); fh(tl);
  for (const l of spec.toc) { const n = T('body/sm', l, 'content/secondary'); tl.appendChild(n); fh(n); }

  const footer = (await figma.getNodeByIdAsync(SRC.footerDesktop)).clone();
  footer.name = '99 — Footer';
  root.appendChild(footer); fh(footer);
  return root;
}

/**
 * Build the named pages. Existing frames of the same name are replaced.
 * Rows are laid out mobile at x=0, desktop at x=480, in `ALL` order.
 */
async function build(keys, opts) {
  opts = opts || {};
  const mobile = opts.mobile !== false;
  const desktop = opts.desktop !== false;
  const page = await figma.getNodeByIdAsync(PAGE_ID); await page.loadAsync();
  const out = [];
  for (const key of keys) {
    const spec = PAGES[key];
    const y = ROW_Y[key] !== undefined ? ROW_Y[key] : 0;
    for (const suffix of ['— mobile', '— desktop']) {
      const want = (suffix === '— mobile' && mobile) || (suffix === '— desktop' && desktop);
      if (!want) continue;
      const old = page.children.find((c) => c.name === spec.name + ' ' + suffix);
      if (old) old.remove();
    }
    if (mobile) out.push((await buildMobile(key, 0, y)).name);
    if (desktop) out.push((await buildDesktop(key, 480, y)).name);
  }
  return out;
}

/* Row origins. Regenerate with `layout()` after a rebuild changes heights. */
const ROW_Y = {
  'start-here': 0, 'what-primitiv-is': 5936, tokens: 9558, density: 15226,
  composition: 19932, accessibility: 25242, 'registry-cli': 30296, figma: 37286,
};

/** Re-space the rows to the frames' actual heights, and report the new origins. */
async function layout(gap) {
  gap = gap || 400;
  const page = await figma.getNodeByIdAsync(PAGE_ID); await page.loadAsync();
  const by = {}; page.children.forEach((c) => (by[c.name] = c));
  let y = 0; const rows = {};
  for (const key of ALL) {
    const m = by[PAGES[key].name + ' — mobile'], d = by[PAGES[key].name + ' — desktop'];
    if (!m || !d) continue;
    m.x = 0; m.y = y; d.x = 480; d.y = y;
    rows[key] = y;
    y += Math.max(m.height, d.height) + gap;
  }
  return rows;
}

/*
 * Resize every gap to the ratio its brief specifies, on the desktop frames.
 * ALWAYS a separate call from the build: a frame re-parented into a wider
 * column has not reflowed yet, so a resize in the same call lands against the
 * old content height.
 */
const GAP_RATIO = {
  'START-01': [4, 1], 'FAMILY-01': [3, 2], 'TOKENS-01': [4, 3],
  'DENSITY-C01': [16, 9], 'DENSITY-C02': [4, 3], 'COMPOSE-01': [4, 3],
  'A11Y-C01': [3, 1], 'CLI-01': [2, 1], 'FIGMA-P01': [16, 10], 'FIGMA-P02': [4, 3],
};
async function sizeGaps() {
  const page = await figma.getNodeByIdAsync(PAGE_ID); await page.loadAsync();
  const out = [];
  for (const root of page.children.filter((c) => / — desktop$/.test(c.name))) {
    for (const g of root.findAll((n) => n.name.indexOf('ILLUSTRATION GAP') !== -1)) {
      const key = Object.keys(GAP_RATIO).find((k) => g.name.indexOf(k) !== -1);
      if (!key) continue;
      const [rw, rh] = GAP_RATIO[key];
      const h = Math.round((g.width * rh) / rw);
      g.layoutSizingVertical = 'FIXED';
      g.resize(g.width, h);
      const label = g.findOne((n) => n.type === 'TEXT' && n.name === 'size');
      if (label) label.characters = rw + ':' + rh + '  ·  ' + Math.round(g.width) + '×' + h;
      out.push(key + ' → ' + Math.round(g.width) + '×' + h);
    }
  }
  return out;
}

/*
 * Every child that escapes its auto-layout parent's padding box — a dozen
 * lines, and the only cheap substitute for a render (CLAUDE.md gotcha 29).
 * Hidden children are skipped: a hidden node keeps its master width.
 */
async function overflowAudit() {
  const page = await figma.getNodeByIdAsync(PAGE_ID); await page.loadAsync();
  const bad = [];
  for (const root of page.children.filter((c) => / — (mobile|desktop)$/.test(c.name))) {
    const walk = (n) => {
      if (n.layoutMode && n.layoutMode !== 'NONE' && 'children' in n) {
        for (const c of n.children) {
          if (c.layoutPositioning === 'ABSOLUTE' || !c.visible) continue;
          if (c.x + c.width > n.width - n.paddingRight + 0.5 || c.y + c.height > n.height - n.paddingBottom + 0.5)
            bad.push(root.name + ' ▸ ' + n.name + ' ▸ ' + c.name);
        }
      }
      if ('children' in n && n.type !== 'INSTANCE') for (const c of n.children) walk(c);
    };
    walk(root);
  }
  return bad;
}

/*
 * A normalised fingerprint of every user-visible string per mobile frame:
 * whitespace-stripped concatenation, so the word-splitting a rich paragraph
 * does cannot show up as a difference. Feed the result to
 * `verify-docs-content-pages.mjs` to prove PAGES still describes the canvas.
 */
async function fingerprint() {
  const djb2 = (s) => {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
    return h;
  };
  const page = await figma.getNodeByIdAsync(PAGE_ID);
  await page.loadAsync();
  const out = {};
  // A placed illustration replaces its gap frame, so both carry text the other
  // side of the comparison does not — the fingerprint is about prose. Matches
  // `⟦ ILLUSTRATION GAP · X ⟧` and the bare `START-01` / `A11Y-C01` ids.
  const IS_ILLUSTRATION = /^(?:⟦ ILLUSTRATION GAP|[A-Z0-9]+(?:-[A-Z0-9]+)+$)/;
  for (const root of page.children.filter((c) => / — mobile$/.test(c.name))) {
    const strings = [];
    const walk = (n) => {
      if (IS_ILLUSTRATION.test(n.name)) return;
      if (n.type === 'INSTANCE') {
        const cp = n.componentProperties || {};
        if (cp['Code#612:474']) { strings.push(cp['Code#612:474'].value); return; }
        if (cp['Description#1400:233']) { strings.push(cp['Description#1400:233'].value); return; }
        if (n.name === 'Code Block') {
          const t = n.findOne((x) => x.type === 'TEXT' && x.name === 'Code');
          if (t) strings.push(t.characters);
        }
        return;
      }
      if (n.type === 'TEXT') { strings.push(n.characters); return; }
      if ('children' in n) for (const c of n.children) walk(c);
    };
    for (const band of root.children) {
      if (/Header|Footer/.test(band.name)) continue;
      walk(band);
    }
    const flat = strings.join('').replace(/\s+/g, '');
    out[root.name.replace(' — mobile', '')] = { len: flat.length, hash: djb2(flat) };
  }
  return out;
}
