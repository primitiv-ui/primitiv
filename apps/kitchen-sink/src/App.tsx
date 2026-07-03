import { useEffect, useState, type ReactElement } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionContent,
  AccordionTriggerIcon,
  Button,
  Checkbox,
  Divider,
  Field,
  FieldLabel,
  FieldDescription,
  FieldErrorText,
  Input,
  InputGroup,
  InputGroupLeadingAdornment,
  InputGroupTrailingAdornment,
  Modal,
  ModalTrigger,
  ModalPortal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  ModalClose,
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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  ToggleGroup,
  ToggleGroupItem,
} from "./components";
import { ChevronDown, ChevronLeft, ChevronRight, Close, Moon, Search, Sun } from "@primitiv-ui/icons";
import "./App.css";

type Density = "dense" | "compact" | "comfortable" | "spacious";
type Size = "xs" | "sm" | "md" | "lg" | "xl";

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

export function App(): ReactElement {
  const [density, setDensity] = useState<Density>("comfortable");
  const [size, setSize] = useState<Size>("md");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.density = density;
  }, [density]);

  useEffect(() => {
    // Set on <html>, not a sub-region — anything portalled (Modal) mounts to
    // document.body, outside a scope set on a lower element.
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  return (
    <div className="kitchen-sink">
      <header className="kitchen-sink__controls">
        <div className="kitchen-sink__control">
          <span className="kitchen-sink__control-label">Density</span>
          <ToggleGroup
            type="single"
            value={density}
            onValueChange={(value) => value && setDensity(value as Density)}
            aria-label="Density"
          >
            <ToggleGroupItem value="dense">Dense</ToggleGroupItem>
            <ToggleGroupItem value="compact">Compact</ToggleGroupItem>
            <ToggleGroupItem value="comfortable">Comfortable</ToggleGroupItem>
            <ToggleGroupItem value="spacious">Spacious</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="kitchen-sink__control">
          <span className="kitchen-sink__control-label">Size</span>
          <ToggleGroup
            type="single"
            value={size}
            onValueChange={(value) => value && setSize(value as Size)}
            aria-label="Component size"
          >
            <ToggleGroupItem value="xs">XS</ToggleGroupItem>
            <ToggleGroupItem value="sm">SM</ToggleGroupItem>
            <ToggleGroupItem value="md">MD</ToggleGroupItem>
            <ToggleGroupItem value="lg">LG</ToggleGroupItem>
            <ToggleGroupItem value="xl">XL</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="kitchen-sink__control">
          {dark ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
          <Switch
            checked={dark}
            onCheckedChange={setDark}
            aria-label="Dark mode"
          />
        </div>
      </header>

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
                inlineSize: "100%",
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
        <p>Above the divider.</p>
        <Divider />
        <p>Below the divider.</p>
      </Section>

      <Section title="Field" column>
        <Field>
          <FieldLabel>Email</FieldLabel>
          <Input type="email" size={size} placeholder="you@example.com" />
          <FieldDescription>We won't share it.</FieldDescription>
        </Field>
        <Field>
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
              <p>A headless component library with a styled surface.</p>
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
              <p>The palette generation engine underneath it.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Section>

      <Section title="Toggle Group">
        <ToggleGroup type="single" defaultValue="left" aria-label="Alignment">
          <ToggleGroupItem value="left">Left</ToggleGroupItem>
          <ToggleGroupItem value="center">Center</ToggleGroupItem>
          <ToggleGroupItem value="right">Right</ToggleGroupItem>
        </ToggleGroup>
      </Section>

      <Section title="Table" column>
        <Table size={size}>
          <TableCaption>Recent releases.</TableCaption>
          <TableHead>
            <TableRow>
              <TableHeader>Version</TableHeader>
              <TableHeader>Status</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>0.1.27</TableCell>
              <TableCell>Published</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>0.1.26</TableCell>
              <TableCell>Published</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Section>

      <Section title="Modal">
        <Modal>
          <ModalTrigger asChild>
            <Button variant="primary">Open modal</Button>
          </ModalTrigger>
          <ModalPortal>
            <ModalOverlay />
            <ModalContent size="md">
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
                  This dialog is portalled to <code>document.body</code>,
                  which is why <code>data-theme</code> lives on{" "}
                  <code>&lt;html&gt;</code> above, not on this page&apos;s
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
    </div>
  );
}
