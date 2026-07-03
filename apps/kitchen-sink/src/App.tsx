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
        <article className="kitchen-sink__section">
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
            spacing below a heading than above it.
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
          <h4>Heading 4 - A blockquote</h4>
          <blockquote>
            <p>The stable surface is the contract, not the values.</p>
          </blockquote>
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
