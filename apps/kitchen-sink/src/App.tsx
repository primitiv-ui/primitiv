import {
  Fragment,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionContent,
  AccordionTriggerIcon,
  Alert,
  AspectRatio,
  Avatar,
  AvatarGroup,
  AvatarImage,
  AvatarFallback,
  Badge,
  Blockquote,
  Box,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbOverflow,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardMedia,
  CardTitle,
  Center,
  Checkbox,
  CheckboxCard,
  Chip,
  CodeBlock,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleTriggerIcon,
  CollapsibleContent,
  ConfirmDialog,
  ConfirmDialogTrigger,
  ConfirmDialogContent,
  Container,
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
  DescriptionList,
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
  EmptyState,
  EmptyStateMedia,
  EmptyStateTitle,
  EmptyStateDescription,
  EmptyStateActions,
  Field,
  FieldLabel,
  FieldDescription,
  FieldErrorText,
  Figure,
  Grid,
  InlineCode,
  Input,
  InputGroup,
  InputGroupLeadingAdornment,
  InputGroupTrailingAdornment,
  Kbd,
  List,
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
  Pagination,
  PaginationSummary,
  PaginationTrailing,
  PaginationList,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
  PaginationMenuItem,
  PaginationStatus,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
  PopoverDescription,
  PopoverClose,
  Progress,
  ProgressIndicator,
  Prose,
  PullQuote,
  Radio,
  RadioCard,
  RadioCardItem,
  Stepper,
  StepperDescription,
  StepperLabel,
  StepperList,
  StepperMarker,
  StepperPanel,
  StepperStep,
  Switch,
  Table,
  TableHead,
  TableBody,
  TableFooter,
  TableRow,
  TableHeader,
  TableCell,
  TableCaption,
  TableScrollArea,
  Listbox,
  ListboxOption,
  ListboxOptionIndicator,
  ListboxOptionCheckbox,
  ListboxOptionLeading,
  ListboxOptionLabel,
  ListboxOptionTrailing,
  ListboxGroup,
  ListboxGroupLabel,
  ListboxEmpty,
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
  Slider,
  SliderTrack,
  SliderRange,
  SliderThumb,
  Spacer,
  SplitButton,
  SplitButtonAction,
  SplitButtonTrigger,
  SplitButtonMenu,
  SplitButtonItem,
  SplitButtonSeparator,
  Stack,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Tag,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
  TooltipArrow,
  MillerColumns,
  MillerColumnsColumn,
  MillerColumnsItem,
  MillerColumnsItemIndicator,
  MillerColumnsPreviewPanel,
  MillerColumnsResizeHandle,
  Tree,
  TreeBranch,
  TreeBranchContent,
  TreeBranchControl,
  TreeBranchIndicator,
  TreeItem,
  TreeSelectionPath,
} from "./components";
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Close,
  Copy,
  Delete,
  Download,
  Eye,
  File,
  Folder,
  GridIcon,
  Minus,
  Search,
  Settings,
  Sort,
  Upload,
  User,
} from "@primitiv-ui/icons";
import {
  VisuallyHidden,
  useMillerColumnsSelection,
  usePagination,
} from "@primitiv-ui/react";
import cardPhoto1 from "./assets/carousel-photos/photo-1.jpg";
import cardPhoto2 from "./assets/carousel-photos/photo-2.jpg";
import cardPhoto3 from "./assets/carousel-photos/photo-3.jpg";
import cardPhoto4 from "./assets/carousel-photos/photo-4.jpg";
import cardPhoto5 from "./assets/carousel-photos/photo-5.jpg";
import cardPhoto6 from "./assets/carousel-photos/photo-6.jpg";
import { useChrome } from "./chrome";
import "./App.css";
import { useMediaQuery } from "@primitiv-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import "./demos.css";

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

/* A small placeholder media block for the Figure position demo — the same
   stepped-band pattern as the intro article's bare <figure>, just compact
   enough to repeat three times side by side (below/above/overlay). */
/**
 * Stand-in for real media in the Figure / AspectRatio demos.
 *
 * Opaque by design: it lays an explicit `surface/subtle` base under the
 * stepped band (matching the fill the Figma Media frame carries), so it
 * behaves like a real image would. A translucent placeholder let the Figure
 * overlay's scrim show *through* the artwork, which read as a stray panel
 * behind it rather than a caption bar over it.
 *
 * `fill` makes the band stretch to its container instead of keeping its own
 * 16:9 proportions — what an `AspectRatio` box needs, since the whole point
 * there is to see the box's ratio, not the placeholder's.
 */
function FigureMediaPlaceholder(): ReactElement {
  return (
    <svg
      viewBox="0 0 160 90"
      role="img"
      aria-label="A stepped band of the current text colour"
      className="ks-media-placeholder"
    >
      <rect x="0" width="40" height="90" fill="currentColor" opacity="0.6" />
      <rect x="40" width="40" height="90" fill="currentColor" opacity="0.45" />
      <rect x="80" width="40" height="90" fill="currentColor" opacity="0.3" />
      <rect x="120" width="40" height="90" fill="currentColor" opacity="0.18" />
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

// Listbox fixtures. Long enough to scroll (so the sticky group headings and the
// row-boundary height recipe are both visible) and with overlapping prefixes so
// typeahead cycling can be tried by hand.
const LB_CITIES = [
  { value: "ams", name: "Amsterdam" },
  { value: "ber", name: "Berlin" },
  { value: "cph", name: "Copenhagen" },
  { value: "dub", name: "Dublin" },
  { value: "edi", name: "Edinburgh" },
  { value: "flr", name: "Florence" },
  { value: "gva", name: "Geneva" },
  { value: "hel", name: "Helsinki" },
] as const;

const LB_TOPPINGS: { value: string; name: string; soon?: boolean }[] = [
  { value: "olives", name: "Olives" },
  { value: "capers", name: "Capers" },
  { value: "anchovies", name: "Anchovies" },
  { value: "artichoke", name: "Artichoke" },
  { value: "chilli", name: "Chilli oil", soon: true },
];

const LB_COMMANDS = [
  {
    label: "Files",
    options: [
      { value: "open", name: "Open file...", shortcut: "⌘O" },
      { value: "save", name: "Save", shortcut: "⌘S" },
    ],
  },
  {
    label: "Edit",
    options: [
      { value: "undo", name: "Undo", shortcut: "⌘Z" },
      { value: "find", name: "Find in file...", shortcut: "⌘F" },
    ],
  },
  {
    label: "View",
    options: [
      { value: "zen", name: "Toggle zen mode", shortcut: "⌘K Z" },
      { value: "term", name: "Toggle terminal", shortcut: "⌃`" },
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
  // ReactNode, not ReactElement[] — a conditionally rendered demo yields
  // `false | Element`, which the narrower type rejects.
  children: ReactNode;
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

/**
 * A real four-step sign-up wizard, driven by react-hook-form.
 *
 * The form library is what makes the Stepper's own states honest here: RHF owns
 * validation, so `state="error"` on a step and the error text under a field come
 * from ONE source (`formState.errors`) rather than being asserted twice, and
 * Continue advances only when the current step's fields actually validate.
 *
 * Note what Stepper does NOT know: there is no react-hook-form in the component.
 * `state` and `disabled` are plain props, which is exactly why this works the
 * same with RHF, Formik or a bare useState.
 */
const wizardSchema = z.object({
  email: z
    .string()
    .min(1, "An email address is required.")
    // z.email() is Zod 4's top-level string format. Piped rather than used
    // alone so "required" and "malformed" say different things.
    .pipe(z.email("That does not look like an email address.")),
  displayName: z
    .string()
    .min(3, "At least three characters.")
    // Stands in for a server-side uniqueness check.
    .refine(
      (value) => value.trim().toLowerCase() !== "ada",
      "That display name is taken — try another.",
    ),
  plan: z.enum(["starter", "team"], "Choose a plan."),
});

type WizardValues = z.infer<typeof wizardSchema>;

const WIZARD_STEPS = ["account", "profile", "plan", "review"] as const;
type WizardStep = (typeof WIZARD_STEPS)[number];

/** Which fields each step owns — the unit `trigger()` validates before letting
 *  you move on, and the set a step reports an error for. */
const STEP_FIELDS: Record<WizardStep, (keyof WizardValues)[]> = {
  account: ["email"],
  profile: ["displayName"],
  plan: ["plan"],
  review: [],
};

/** The same schema sliced per step, so "is this step valid right now" is one
 *  `safeParse` rather than a hand-rolled reading of touched/dirty state. That is
 *  what lets Continue be disabled rather than merely refusing to advance. */
const STEP_SCHEMAS: Record<WizardStep, z.ZodTypeAny> = {
  account: wizardSchema.pick({ email: true }),
  profile: wizardSchema.pick({ displayName: true }),
  plan: wizardSchema.pick({ plan: true }),
  review: z.object({}),
};

const WIZARD_LABELS: Record<
  WizardStep,
  { title: string; description: string }
> = {
  account: { title: "Account", description: "Email and password" },
  profile: { title: "Profile", description: "Tell us about you" },
  plan: { title: "Plan", description: "Pick a tier" },
  review: { title: "Review", description: "Confirm and finish" },
};

function SignUpWizard({
  size,
  orientation = "horizontal",
  compact = false,
}: {
  size: "xs" | "sm" | "md" | "lg" | "xl";
  orientation?: "horizontal" | "vertical";
  compact?: boolean;
}) {
  const [step, setStep] = useState<WizardStep>("account");
  const [furthest, setFurthest] = useState(0);
  const [submitted, setSubmitted] = useState<WizardValues | null>(null);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema),
    // "all" validates on both change and blur, so `errors` tracks the form
    // continuously — which is what keeps the Continue button's disabled state
    // honest instead of lagging a keystroke behind.
    mode: "all",
    defaultValues: { email: "", displayName: "", plan: "team" },
  });

  const index = WIZARD_STEPS.indexOf(step);
  const isLast = index === WIZARD_STEPS.length - 1;

  // Parse the live values against this step's slice. Deliberately not
  // `formState.isValid`, which answers for the WHOLE form — on step 1 that is
  // false because later steps are still empty, and Continue would never enable.
  const values = watch();
  const stepValid = STEP_SCHEMAS[step].safeParse(values).success;

  const goTo = (next: number) => {
    const clamped = Math.min(Math.max(next, 0), WIZARD_STEPS.length - 1);
    setFurthest((f) => Math.max(f, clamped));
    setStep(WIZARD_STEPS[clamped]);
  };

  // Continue validates only the current step's fields. A failure leaves you put,
  // and the step's marker turns to the error state via `errors` below.
  const continueToNext = async () => {
    const valid = await trigger(STEP_FIELDS[step], { shouldFocus: true });
    if (valid) goTo(index + 1);
  };

  const onSubmit = async (values: WizardValues) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSubmitted(values);
  };

  const stepState = (i: number) => {
    const fields = STEP_FIELDS[WIZARD_STEPS[i]];
    if (fields.some((field) => errors[field])) return "error" as const;
    return i < furthest ? ("complete" as const) : ("upcoming" as const);
  };

  return (
    <Stepper
      value={step}
      onValueChange={(value) => setStep(value as WizardStep)}
      size={size}
      orientation={orientation}
    >
      <StepperList label="Sign-up progress" compact={compact}>
        {WIZARD_STEPS.map((value, i) => (
          <StepperStep
            key={value}
            value={value}
            state={stepState(i)}
            disabled={i > furthest}
          >
            <StepperMarker>{i + 1}</StepperMarker>
            <StepperLabel>{WIZARD_LABELS[value].title}</StepperLabel>
            <StepperDescription>
              {WIZARD_LABELS[value].description}
            </StepperDescription>
          </StepperStep>
        ))}
      </StepperList>

      {/* Compact hides the markers and labels, so the step's name has to come
        from somewhere — and it is the consumer's to write, because Stepper owns
        no step data model. The index and the count are already here. */}
      {compact ? (
        <div className="ks-stepper-caption">
          <span>
            Step {index + 1} of {WIZARD_STEPS.length}
          </span>
          <strong>{WIZARD_LABELS[step].title}</strong>
        </div>
      ) : null}

      {/* A vertical rule between the rail and the step bodies — only in the
        vertical variant, where they sit side by side in the same row. The
        Divider self-stretches (align-self: stretch), so it spans whichever of
        the two columns is taller without being told a height. */}
      {orientation === "vertical" ? <Divider orientation="vertical" /> : null}
      <div className="ks-stepper-body">
        <StepperPanel value="account">
          {/* `invalid` on the Field is what makes FieldErrorText render at all —
            it returns null without it — and the Field then supplies aria-invalid
            to the Input through context, so the Input needs nothing itself. */}
          <Field size={size} invalid={!!errors.email}>
            <FieldLabel>Email</FieldLabel>
            <Input
              type="email"
              size={size}
              placeholder="you@example.com"
              {...register("email")}
            />
            {errors.email ? (
              <FieldErrorText>{errors.email.message}</FieldErrorText>
            ) : (
              <FieldDescription>We won't share it.</FieldDescription>
            )}
          </Field>
        </StepperPanel>

        <StepperPanel value="profile">
          <Field size={size} invalid={!!errors.displayName}>
            <FieldLabel>Display name</FieldLabel>
            <Input type="text" size={size} {...register("displayName")} />
            {errors.displayName ? (
              <FieldErrorText>{errors.displayName.message}</FieldErrorText>
            ) : (
              <FieldDescription>
                Letters, numbers and hyphens only.
              </FieldDescription>
            )}
          </Field>
        </StepperPanel>

        <StepperPanel value="plan">
          {/* RadioCard is controlled (value + onValueChange), so it needs
            Controller rather than register — the same seam any controlled
            registry component sits behind. Wrapped in a Field so its error has
            somewhere to render: a bare FieldErrorText throws outside one. */}
          <Field size={size} invalid={!!errors.plan}>
            <FieldLabel>Plan</FieldLabel>
            <Controller
              control={control}
              name="plan"
              render={({ field }) => (
                <RadioCard
                  value={field.value}
                  onValueChange={field.onChange}
                  aria-label="Plan"
                >
                  <Stack direction="row" gap="sm" align="stretch">
                    <RadioCardItem
                      size={size}
                      value="starter"
                      title="Starter"
                      description="Everything one person needs."
                      style={{ flex: "1 1 0" }}
                    />
                    <RadioCardItem
                      size={size}
                      value="team"
                      title="Team"
                      description="Shared workspaces and roles."
                      style={{ flex: "1 1 0" }}
                    />
                  </Stack>
                </RadioCard>
              )}
            />
            <FieldErrorText>{errors.plan?.message}</FieldErrorText>
          </Field>
        </StepperPanel>

        <StepperPanel value="review">
          {submitted ? (
            <p>
              Account created for <strong>{submitted.displayName}</strong> on
              the <strong>{submitted.plan}</strong> plan.
            </p>
          ) : (
            <p>
              Signing up <strong>{watch("email") || "—"}</strong> as{" "}
              <strong>{watch("displayName") || "—"}</strong> on the{" "}
              <strong>{watch("plan")}</strong> plan.
            </p>
          )}
        </StepperPanel>

        <Stack
          direction="row"
          gap="sm"
          align="center"
          justify="end"
          className="ks-stepper-footer"
        >
          <Button
            variant="secondary"
            size={size}
            disabled={index === 0 || isSubmitting}
            onClick={() => goTo(index - 1)}
          >
            Back
          </Button>
          <Button
            size={size}
            disabled={
              isSubmitting || !stepValid || (isLast && submitted !== null)
            }
            onClick={
              isLast ? handleSubmit(onSubmit) : () => void continueToNext()
            }
          >
            {isLast
              ? isSubmitting
                ? "Creating account..."
                : submitted
                  ? "Account created"
                  : "Create account"
              : "Continue"}
          </Button>
        </Stack>
      </div>
    </Stepper>
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
  {
    category: "Layout",
    titles: [
      "Aspect Ratio",
      "Box",
      "Center",
      "Container",
      "Divider",
      "Grid",
      "Stack & Spacer",
    ],
  },
  { category: "Buttons", titles: ["Button", "Split Button"] },
  {
    category: "Forms",
    titles: [
      "Checkbox",
      "CheckboxCard",
      "Field",
      "Input Group",
      "Radio",
      "RadioCard",
      "Segmented Control",
      "Slider",
      "Switch",
      "Textarea",
    ],
  },
  {
    category: "Collections & Selection",
    titles: ["Listbox", "Miller Columns", "Select", "Tree"],
  },
  { category: "Typography", titles: ["Code Block"] },
  {
    category: "Overlays",
    titles: [
      "Confirm Dialog",
      "Context Menu",
      "Drawer",
      "Dropdown",
      "Modal",
      "Popover",
      "Tooltip",
    ],
  },
  {
    category: "Feedback & Status",
    titles: ["Alert", "Empty State", "Progress"],
  },
  {
    category: "Disclosure",
    titles: [
      "Accordion",
      "Breadcrumb",
      "Breadcrumb Overflow",
      "Collapsible",
      "Pagination",
      "Stepper",
      "Tabs",
    ],
  },
  { category: "Navigation", titles: ["Navigation Menu", "Toggle Group"] },
  {
    category: "Data Display",
    titles: ["Avatar", "Avatar Group", "Badge, Tag & Chip", "Card", "Table"],
  },
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
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
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
          <a
            href="#introduction"
            onClick={(e) => scrollToId(e, "introduction")}
          >
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

// The five faces generated for the Figma Avatar Group set, served from
// public/ (BASE_URL-relative, same pattern as avatar-demo.jpg above) rather
// than imported — they're demo fixtures, not bundled assets. Each Avatar
// still carries initials as its AvatarFallback, which is what renders if an
// image 404s.
const AVATAR_FACES = [
  { src: `${import.meta.env.BASE_URL}avatar-1.png`, initials: "AB" },
  { src: `${import.meta.env.BASE_URL}avatar-2.png`, initials: "CD" },
  { src: `${import.meta.env.BASE_URL}avatar-3.png`, initials: "EF" },
  { src: `${import.meta.env.BASE_URL}avatar-4.png`, initials: "GH" },
  { src: `${import.meta.env.BASE_URL}avatar-5.png`, initials: "JK" },
];

// A team longer than the face set, so `max` has something real to truncate;
// faces cycle by position exactly as the Figma variants do.
const AVATAR_TEAM = Array.from({ length: 7 }, (_, i) => ({
  key: `member-${i}`,
  ...AVATAR_FACES[i % AVATAR_FACES.length],
}));

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

// ---------------------------------------------------------------------------
// Miller Columns demo data. The strip is authored by RECURSIVE COMPOSITION —
// there is no data prop — so this shape is the demo's own, walked by MillerNode.
// "Archive" is deliberately a branch with no children: selecting it opens an
// empty column, which is an ordinary state here rather than an error.
type MillerFileNode = {
  id: string;
  label: string;
  kind: "folder" | "file";
  meta?: string;
  /** Images get a preview button in the pane; the source is generated below so
      the demo needs no binary assets in the repo. */
  image?: boolean;
  children?: MillerFileNode[];
};

const MILLER_TREE: MillerFileNode[] = [
  {
    id: "documents",
    label: "Documents",
    kind: "folder",
    children: [
      {
        id: "work",
        label: "Work",
        kind: "folder",
        children: [
          {
            id: "report",
            label: "report.pdf",
            kind: "file",
            meta: "PDF document · 248 KB",
          },
          {
            id: "notes",
            label: "notes.txt",
            kind: "file",
            meta: "Plain text · 4 KB",
          },
          {
            id: "budget",
            label: "budget.xlsx",
            kind: "file",
            meta: "Spreadsheet · 62 KB",
          },
        ],
      },
      {
        id: "personal",
        label: "Personal",
        kind: "folder",
        children: [
          {
            id: "taxes",
            label: "taxes.pdf",
            kind: "file",
            meta: "PDF document · 1.2 MB",
          },
          {
            id: "letter",
            label: "letter.docx",
            kind: "file",
            meta: "Document · 18 KB",
          },
        ],
      },
      {
        id: "readme",
        label: "README.md",
        kind: "file",
        meta: "Markdown · 2 KB",
      },
    ],
  },
  {
    id: "pictures",
    label: "Pictures",
    kind: "folder",
    children: [
      {
        id: "holiday",
        label: "Holiday",
        kind: "folder",
        children: [
          {
            id: "beach",
            label: "beach.jpg",
            kind: "file",
            meta: "Image · 3.4 MB",
            image: true,
          },
          {
            id: "sunset",
            label: "sunset.jpg",
            kind: "file",
            meta: "Image · 2.9 MB",
            image: true,
          },
        ],
      },
      {
        id: "profile",
        label: "profile.png",
        kind: "file",
        meta: "Image · 240 KB",
        image: true,
      },
    ],
  },
  { id: "archive", label: "Archive", kind: "folder", children: [] },
  { id: "licence", label: "LICENCE", kind: "file", meta: "Plain text · 1 KB" },
];

/** A self-contained stand-in image, hued from the filename so each differs. */
function millerImageSource(label: string): string {
  const hue =
    [...label].reduce((sum, character) => sum + character.charCodeAt(0), 0) %
    360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420">
    <rect width="640" height="420" fill="hsl(${hue}, 62%, 56%)"/>
    <rect width="640" height="420" fill="hsl(${(hue + 40) % 360}, 62%, 46%)" opacity="0.45" transform="skewX(-18)"/>
    <text x="320" y="228" font-family="sans-serif" font-size="34" fill="rgba(255,255,255,0.92)" text-anchor="middle">${label}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const MILLER_INDEX = new Map<string, MillerFileNode>();
(function indexMillerTree(nodes: MillerFileNode[]) {
  for (const node of nodes) {
    MILLER_INDEX.set(node.id, node);
    if (node.children) indexMillerTree(node.children);
  }
})(MILLER_TREE);

// A branch is any node with a `children` array — including an EMPTY one, which
// is what makes "Archive" open a column rather than behave as a leaf.
function MillerNode({ node }: { node: MillerFileNode }) {
  return (
    <MillerColumnsItem value={node.id}>
      {node.label}
      {node.children ? (
        <>
          <MillerColumnsItemIndicator />
          <MillerColumnsColumn>
            <MillerColumnsResizeHandle
              aria-label={`Resize ${node.label}`}
              minWidth={120}
              maxWidth={360}
            />
            {node.children.map((child) => (
              <MillerNode key={child.id} node={child} />
            ))}
          </MillerColumnsColumn>
        </>
      ) : null}
    </MillerColumnsItem>
  );
}

// Lives inside the PreviewPanel and reads the selection itself — the component
// is content-agnostic, so what a preview looks like is entirely ours to decide.
function MillerPreview() {
  const { selectedValue } = useMillerColumnsSelection();
  const node = selectedValue ? MILLER_INDEX.get(selectedValue) : undefined;

  // The pane only mounts for a selected LEAF (Finder's rule, enforced by the
  // headless), so there is no "nothing selected" or folder case to handle.
  if (!node) {
    return null;
  }

  return (
    <div className="ks-miller-showcase__preview">
      <strong>{node.label}</strong>
      <span className="ks-miller-showcase__preview-meta">{node.meta}</span>
      {node.image ? (
        <>
          <img
            className="ks-miller-showcase__thumb"
            src={millerImageSource(node.label)}
            alt=""
          />
          {/* The pane is content-agnostic, so an image preview is entirely the
              consumer's call — here a Modal shows it larger. `key` on the Modal
              resets its open state when the selection changes, so switching
              from one image to another does not leave a stale dialog open. */}
          <Modal key={node.id}>
            <ModalTrigger asChild>
              <Button size="sm" variant="secondary">
                Preview
              </Button>
            </ModalTrigger>
            {/* forceMount keeps the dialog mounted while closed, which is what
                lets it animate OUT — without it a native <dialog> snaps shut. */}
            <ModalPortal forceMount>
              <ModalContent size="lg">
                <ModalHeader>
                  <ModalTitle>{node.label}</ModalTitle>
                  <ModalDescription>{node.meta}</ModalDescription>
                </ModalHeader>
                <ModalBody>
                  <img
                    className="ks-miller-showcase__full"
                    src={millerImageSource(node.label)}
                    alt={`Preview of ${node.label}`}
                  />
                </ModalBody>
                <ModalFooter>
                  <ModalClose asChild>
                    <Button size="sm" variant="secondary">
                      Close
                    </Button>
                  </ModalClose>
                </ModalFooter>
              </ModalContent>
            </ModalPortal>
          </Modal>
        </>
      ) : null}
    </div>
  );
}

// One composed Pagination row.
//
// Pagination is a compound, like Breadcrumb and Select: `usePagination` (from
// @primitiv-ui/react) owns the page arithmetic, and the row is composed from
// PaginationList / PaginationItem and the cell parts. That split is the point —
// the hook works against any data source, and this styled row knows nothing
// about where the pages came from. The kitchen-sink wraps it once here rather
// than repeating the same ~30 lines across four demos; the component README
// writes the composition out in full.
function DemoPagination({
  label,
  size,
  totalItems,
  pageSize,
  variant = "numbered",
  blockSize = 5,
  withSummary = false,
  withJump = false,
}: {
  label: string;
  size: "xs" | "sm" | "md" | "lg" | "xl";
  totalItems: number;
  pageSize: number;
  variant?: "numbered" | "compact";
  blockSize?: number;
  withSummary?: boolean;
  withJump?: boolean;
}) {
  const {
    page,
    pageCount,
    items,
    setPage,
    next,
    previous,
    canNext,
    canPrevious,
    startIndex,
    endIndex,
  } = usePagination({ totalItems, pageSize, blockSize });

  return (
    <Pagination label={label} size={size} variant={variant}>
      {withSummary && (
        <PaginationSummary>
          {/* startIndex is zero-based and endIndex half-open, so the +1 is the
              only conversion needed for a human-readable range. */}
          Showing {startIndex + 1}-{endIndex} of {totalItems}
        </PaginationSummary>
      )}
      <PaginationList>
        <PaginationItem>
          <PaginationPrevious disabled={!canPrevious} onClick={previous} />
        </PaginationItem>
        {variant === "compact" ? (
          <PaginationItem>
            <PaginationStatus>
              Page {page} of {pageCount}
            </PaginationStatus>
          </PaginationItem>
        ) : (
          items.map((item, i) =>
            item.type === "page" ? (
              <PaginationItem key={`page-${item.page}`}>
                <PaginationLink
                  isActive={item.page === page}
                  onClick={() => setPage(item.page)}
                >
                  {item.page}
                </PaginationLink>
              </PaginationItem>
            ) : (
              <PaginationItem key={`gap-${i}`}>
                <PaginationEllipsis>
                  {item.pages.map((hidden) => (
                    <PaginationMenuItem
                      key={hidden}
                      onSelect={() => setPage(hidden)}
                    >
                      {hidden}
                    </PaginationMenuItem>
                  ))}
                </PaginationEllipsis>
              </PaginationItem>
            ),
          )
        )}
        <PaginationItem>
          <PaginationNext disabled={!canNext} onClick={next} />
        </PaginationItem>
      </PaginationList>
      {withJump && (
        <PaginationTrailing>
          <span>Go to</span>
          {/* native: the jump control wants the platform popup, and native mode
              needs no anchor-name/position-anchor wiring, which a rich panel
              would (see .ks-anchor-sel-* in demos.css). */}
          <Select
            native
            size={size}
            aria-label="Go to page"
            value={String(page)}
            onValueChange={(value) => setPage(Number(value))}
          >
            {Array.from({ length: pageCount }, (_, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>
                {`Page ${i + 1}`}
              </SelectItem>
            ))}
          </Select>
        </PaginationTrailing>
      )}
    </Pagination>
  );
}

export function App(): ReactElement {
  // Density and theme are ambient (applied on <html> by the shell's
  // ChromeProvider); this page only needs `size`, which it threads as a prop to
  // the components that expose a size axis.
  const { size } = useChrome();
  // Drives the Stepper compact demo. useMediaQuery watches the VIEWPORT, so on
  // a wide screen a narrow demo box would still get the full rail — hence the
  // explicit toggle beside it, so the compact presentation is visible without
  // resizing the window. Either source flips the same boolean, which is the
  // point: `compact` is a plain prop and the consumer decides what drives it.
  const isNarrow = useMediaQuery("(max-width: 40rem)");
  const [forceCompactStepper, setForceCompactStepper] = useState(true);
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
  const [publishAction, setPublishAction] = useState("Nothing published yet.");
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
  // Listbox demo state. The cursor is NOT state here — it lives inside the
  // primitive as virtual focus; only the selection is controlled.
  const [lbCity, setLbCity] = useState("ber");
  const [lbToppings, setLbToppings] = useState<string[]>(["olives", "capers"]);
  const [lbCommand, setLbCommand] = useState("");
  const [lbQuery, setLbQuery] = useState("");
  const [lbResult, setLbResult] = useState("");
  // The palette composition keeps DOM focus in the input, so the listbox never
  // receives the keystrokes the primitive's keymap listens for. Re-dispatching
  // them at the frame is the seam: React attaches its listeners at the root
  // container, so a native event on the frame bubbles up and fires the
  // primitive's own onKeyDown.
  const lbPaletteRef = useRef<HTMLDivElement>(null);
  const lbMatches = LB_CITIES.filter((c) =>
    c.name.toLowerCase().startsWith(lbQuery.trim().toLowerCase()),
  );
  const [readMoreOpen, setReadMoreOpen] = useState(false);
  // Chip demo state — a real removable filter list, so the remove button
  // does something rather than just showing the hover/active/focus styling.
  const [chipFilters, setChipFilters] = useState([
    "Status: Active",
    "Owner: You",
  ]);
  // Alert demo state — the dismissible instance actually unmounts on click,
  // demonstrating that the dismiss button only renders when `onDismiss` is passed.
  const [alertDismissed, setAlertDismissed] = useState(false);
  // CheckboxCard demo state — the "select all" nested-list pattern from the
  // "CheckboxCard, RadioCard — exploration" page, driven by real children so
  // the parent's tri-state is genuinely derived, not hardcoded.
  const [permissions, setPermissions] = useState({
    read: true,
    write: true,
    delete: false,
  });
  const permissionCount = Object.values(permissions).filter(Boolean).length;
  const selectAllChecked =
    permissionCount === 0
      ? false
      : permissionCount === 3
        ? true
        : "indeterminate";
  const setAllPermissions = (value: boolean) =>
    setPermissions({ read: value, write: value, delete: value });
  const [radioPlan, setRadioPlan] = useState("pro");
  // ConfirmDialog demo state — controlled so onConfirm can close the dialog
  // itself (the component deliberately doesn't do this for you).
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

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
    <div className="kitchen-sink-layout">
      <PageToc />
      <div className="kitchen-sink">
        <Prose asChild>
          <article id="introduction">
            <h1>Heading 1 - Primitiv Kitchen Sink</h1>
            <p>
              Every component the registry currently carries, installed exactly
              as a consumer would via <code>primitiv-ui</code>:{" "}
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
              spacing below a heading than above it. Nothing in this article
              sets its own spacing — every gap comes from the{" "}
              <code>.primitiv-flow</code> owl, so the rhythm is the
              demonstration.
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
              <dfn>defined term</dfn>, the shortcut <kbd>Ctrl</kbd> +{" "}
              <kbd>K</kbd>, sample output <samp>Done.</samp>, a variable{" "}
              <var>x</var>, and a <time dateTime="2026-07-03">3 July 2026</time>{" "}
              timestamp.
            </p>
            <h3>Heading 3 - Inline code, sized</h3>
            <p>
              The bare <code>&lt;code&gt;</code> element above is fixed at the
              md step. The <InlineCode size={size}>InlineCode</InlineCode>{" "}
              component adds a size axis — these snippets{" "}
              <InlineCode size={size}>npm create primitiv-ui</InlineCode>,{" "}
              <InlineCode size={size}>useState</InlineCode> and{" "}
              <InlineCode size={size}>--primitiv-flow-normal</InlineCode> track
              the Size control above, and every size still densifies with the
              Density control.
            </p>
            <h3>Heading 3 - Kbd, sized</h3>
            <p>
              The bare <code>&lt;kbd&gt;</code> marks above are fixed at the md
              step, same as bare <code>&lt;code&gt;</code>. The{" "}
              <Kbd size={size}>Kbd</Kbd> component adds the same size axis —
              press <Kbd size={size}>Ctrl</Kbd> + <Kbd size={size}>K</Kbd> to
              open the command palette, or <Kbd size={size}>Esc</Kbd> to close
              it.
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
            <h3>Heading 3 - Lists, styled</h3>
            <p>
              The bare lists above lean on <code>primitiv.reset</code>&rsquo;s
              default marker styling. <code>List</code> swaps in a custom,
              token-coloured marker (so both its colour and its gap to the text
              are controllable) and a <code>size</code> axis:
            </p>
            <Stack gap="md">
              <List type="unordered" size={size}>
                <List.Item>Hairline rows, no boxes</List.Item>
                <List.Item>Semantic tokens only</List.Item>
                <List.Item>Density scales every control further</List.Item>
              </List>
              <List type="ordered" size={size}>
                <List.Item>Install the CLI</List.Item>
                <List.Item>Add every component</List.Item>
                <List.Item>Flip the switches above</List.Item>
              </List>
              <List type="unordered" size={size}>
                <List.Item>An available entry</List.Item>
                <List.Item disabled>
                  A disabled entry — the whole row dims, marker included
                </List.Item>
                <List.Item>Another available entry</List.Item>
              </List>
            </Stack>
            <h3>Heading 3 - A bare description list</h3>
            <p>
              A plain <code>&lt;dl&gt;</code> with no component — exactly like
              the bare lists above, this leans on <code>primitiv.reset</code>{" "}
              alone, so it is deliberately unstyled. The two below are the{" "}
              <code>DescriptionList</code> component; compare them.
            </p>
            <dl>
              <dt>Primitiv</dt>
              <dd>The product — the design system a consumer installs.</dd>
              <dt>Harmoni</dt>
              <dd>The palette-generation engine underneath it.</dd>
            </dl>
            <h3>Heading 3 - A description list, stacked (the default)</h3>
            <DescriptionList size={size}>
              <DescriptionList.Term>Primitiv</DescriptionList.Term>
              <DescriptionList.Details>
                The product — the design system a consumer installs.
              </DescriptionList.Details>
              <DescriptionList.Term>Harmoni</DescriptionList.Term>
              <DescriptionList.Details>
                The palette-generation engine underneath it.
              </DescriptionList.Details>
            </DescriptionList>
            <h3>Heading 3 - A description list, inline layout</h3>
            <DescriptionList size={size} layout="inline">
              <DescriptionList.Term>Primitiv</DescriptionList.Term>
              <DescriptionList.Details>
                The product — the design system a consumer installs.
              </DescriptionList.Details>
              <DescriptionList.Term>Harmoni</DescriptionList.Term>
              <DescriptionList.Details>
                The palette-generation engine underneath it.
              </DescriptionList.Details>
            </DescriptionList>
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
            <h4>Heading 4 - A blockquote, styled</h4>
            <Stack gap="sm">
              <Blockquote size={size} cite="RFC 0006">
                The stable surface is the contract, not the values.
              </Blockquote>
              <Blockquote tone="accent" size={size} cite="RFC 0022">
                Every component Primitiv ships today is a widget — nothing
                arranges widgets on a page.
              </Blockquote>
            </Stack>
            <h4>Heading 4 - A pull quote</h4>
            <PullQuote marks size={size}>
              The stable surface is the contract, not the values.
            </PullQuote>
            <h4>Heading 4 - A figure</h4>
            <figure>
              <svg
                viewBox="0 0 320 120"
                role="img"
                aria-label="A stepped band of the current text colour"
                className="ks-media-placeholder ks-media-placeholder--half"
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
            <h4>Heading 4 - A figure, positioned</h4>
            <p>
              <code>Figure</code> places its caption below (the default), above,
              or overlaid on the media as a scrim bar — using <code>Stack</code>{" "}
              to lay the three side by side:
            </p>
            <Stack direction="row" gap="md">
              <Figure
                captionPosition="below"
                size={size}
                className="ks-figure-col"
              >
                <Figure.Media>
                  <FigureMediaPlaceholder />
                </Figure.Media>
                <Figure.Caption>Below (the default)</Figure.Caption>
              </Figure>
              <Figure
                captionPosition="above"
                size={size}
                className="ks-figure-col"
              >
                <Figure.Media>
                  <FigureMediaPlaceholder />
                </Figure.Media>
                <Figure.Caption>Above</Figure.Caption>
              </Figure>
              <Figure
                captionPosition="overlay"
                size={size}
                className="ks-figure-col"
              >
                <Figure.Media>
                  <img
                    className="ks-figure-image"
                    src={`${import.meta.env.BASE_URL}avatar-demo.jpg`}
                    alt="A headshot of a woman with brown hair"
                  />
                </Figure.Media>
                <Figure.Caption>
                  A headshot of a woman with brown hair
                </Figure.Caption>
              </Figure>
            </Stack>
            <p>
              The caption has its own <code>align</code> axis, independent of
              where it sits:
            </p>
            <Stack direction="row" gap="md">
              <Figure size={size} className="ks-figure-col">
                <Figure.Media>
                  <FigureMediaPlaceholder />
                </Figure.Media>
                <Figure.Caption align="start">
                  Start (the default)
                </Figure.Caption>
              </Figure>
              <Figure size={size} className="ks-figure-col">
                <Figure.Media>
                  <FigureMediaPlaceholder />
                </Figure.Media>
                <Figure.Caption align="center">Center</Figure.Caption>
              </Figure>
              <Figure size={size} className="ks-figure-col">
                <Figure.Media>
                  <FigureMediaPlaceholder />
                </Figure.Media>
                <Figure.Caption align="end">End</Figure.Caption>
              </Figure>
            </Stack>
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
                    Primitiv is a headless component library paired with a
                    styled surface you own outright. The behaviour — focus
                    management, keyboard navigation, ARIA wiring — lives in the
                    headless layer, while the look is a copied stylesheet you
                    are free to re-theme.
                  </p>
                  <p>
                    Every value is a design token, so a single set of custom
                    properties re-skins the whole system across size, density
                    and colour mode.
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
                    Harmoni is the palette generation engine underneath Primitiv
                    — a Rust core compiled to WebAssembly that turns a brand
                    colour into a full, perceptually even ramp.
                  </p>
                  <p>
                    It handles light and dark modes, neutral and soft-neutral
                    ramps, brand-hue tinting, and an OKLCH picker for dialling
                    in the exact anchor colours — all from one input.
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

        {/* One alert per tone, each with its own default tone-matched icon.
          The Danger alert carries a title (optional — omit it for a
          single-message alert, like the other three). The dismissible
          instance actually unmounts on click, demonstrating that the
          dismiss button — a real Button ghost instance, not a bespoke
          element — only renders when `onDismiss` is passed. */}
        <Section title="Alert" column>
          <Alert size={size} tone="info">
            A new version of the design system is available.
          </Alert>
          <Alert size={size} tone="success">
            Changes saved successfully.
          </Alert>
          <Alert size={size} tone="warning">
            Your session will expire in 5 minutes.
          </Alert>
          <Alert size={size} tone="danger" title="Payment failed">
            Your card was declined. Try a different payment method.
          </Alert>
          {!alertDismissed && (
            <Alert
              size={size}
              tone="info"
              onDismiss={() => setAlertDismissed(true)}
            >
              Dismiss me — the dismiss button is a real Button ghost instance.
            </Alert>
          )}
        </Section>

        {/* A compound of parts, not a props API — the registry surface mirrors the
          headless compound's shape. That is what lets the third demo promote its
          title to a real <h3> via asChild, which a `title` prop could not.
          The component carries no padding and centres itself in the box it is
          given, so each demo supplies the dashed region it fills. */}
        <Section title="Empty State" column>
          <div className="ks-empty-state-demos">
            <div>
              <p className="ks-empty-state-caption">
                vertical (default) — fills and centres in the region; the
                description holds its measure instead of stretching to the full
                width
              </p>
              <div className="ks-empty-state-region ks-empty-state-region--tall">
                <EmptyState size={size}>
                  <EmptyStateMedia>
                    <Search />
                  </EmptyStateMedia>
                  <EmptyStateTitle>No results found</EmptyStateTitle>
                  <EmptyStateDescription>
                    We could not find anything matching your search. Try
                    adjusting your filters or using different keywords.
                  </EmptyStateDescription>
                  <EmptyStateActions>
                    <Button size={size} onClick={() => undefined}>
                      Clear filters
                    </Button>
                    <Button
                      size={size}
                      variant="secondary"
                      onClick={() => undefined}
                    >
                      Browse all
                    </Button>
                  </EmptyStateActions>
                </EmptyState>
              </div>
            </div>

            <div>
              <p className="ks-empty-state-caption">
                horizontal — the media sits in a gutter beside the text,
                optically top-aligned to the title's cap-height rather than
                centred on the block
              </p>
              <div className="ks-empty-state-region ks-empty-state-region--inline">
                <EmptyState size={size} orientation="horizontal">
                  <EmptyStateMedia>
                    <Folder />
                  </EmptyStateMedia>
                  <EmptyStateTitle>This folder is empty</EmptyStateTitle>
                  <EmptyStateDescription>
                    Drag files here, or upload them from your device.
                  </EmptyStateDescription>
                  <EmptyStateActions>
                    <Button
                      size={size}
                      variant="secondary"
                      onClick={() => undefined}
                    >
                      Upload files
                    </Button>
                  </EmptyStateActions>
                </EmptyState>
              </div>
            </div>

            <div>
              <p className="ks-empty-state-caption">
                minimal — title only, promoted to a real heading with asChild,
                and role={"{undefined}"} because a static empty state has
                nothing to announce
              </p>
              <div className="ks-empty-state-region ks-empty-state-region--inline">
                <EmptyState size={size} role={undefined}>
                  <EmptyStateTitle asChild>
                    <h3>No messages</h3>
                  </EmptyStateTitle>
                </EmptyState>
              </div>
            </div>
          </div>
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

        {/* Badge/Tag/Chip (RFC 0021) — hand-authored, primitive-less leaves,
          built together and sharing a lot of their token infrastructure
          (feedback/* Intent tokens). Badge: variant="label" is the
          low-emphasis status word, variant="counter" is the high-emphasis
          count — the last two counters demonstrate the circularity trick
          (1-2 char content forces a true circle; longer content widens into
          a pill, independent of variant). Tag: a plain grouped-label list,
          tone="neutral" by default. Chip: a real removable filter list —
          clicking × actually removes the chip from `chipFilters` state,
          demonstrating the required `onRemove` handler and the leading-icon
          slot. */}
        {/* max truncates and renders the "+N" counter. The counter is an Avatar,
          not a Badge: Badge has no neutral tone and would be a dot at this
          scale (see the Figma "Avatar Group — exploration" §5). Faces cycle
          through AVATAR_FACES by position, exactly as the Figma variants do —
          each Avatar still carries its initials as AvatarFallback, so the
          demo exercises both the image and fallback paths at once. */}
        <Section title="Avatar Group" column>
          <div className="ks-avatar-group-demos">
            <AvatarGroup size={size}>
              {AVATAR_FACES.slice(0, 3).map((f) => (
                <Avatar key={f.initials} size={size}>
                  <AvatarImage src={f.src} alt="" />
                  <AvatarFallback>{f.initials}</AvatarFallback>
                </Avatar>
              ))}
            </AvatarGroup>

            <AvatarGroup size={size} max={4}>
              {AVATAR_TEAM.map((f) => (
                <Avatar key={f.key} size={size}>
                  <AvatarImage src={f.src} alt="" />
                  <AvatarFallback>{f.initials}</AvatarFallback>
                </Avatar>
              ))}
            </AvatarGroup>

            <AvatarGroup size={size} direction="rtl" max={4}>
              {AVATAR_TEAM.slice(0, 6).map((f) => (
                <Avatar key={f.key} size={size}>
                  <AvatarImage src={f.src} alt="" />
                  <AvatarFallback>{f.initials}</AvatarFallback>
                </Avatar>
              ))}
            </AvatarGroup>
          </div>
        </Section>

        <Section title="Badge, Tag & Chip" column>
          <div className="ks-row">
            <Badge size={size} tone="success">
              Shipped
            </Badge>
            <Badge size={size} tone="warning">
              Beta
            </Badge>
            <Badge size={size} tone="info">
              New
            </Badge>
            <Badge size={size} tone="danger" variant="counter">
              1
            </Badge>
            <Badge size={size} tone="danger" variant="counter">
              12
            </Badge>
          </div>
          <div className="ks-row">
            <Tag size={size}>Design</Tag>
            <Tag size={size}>Rust</Tag>
            <Tag size={size} tone="success">
              Shipped
            </Tag>
          </div>
          <div className="ks-row">
            {chipFilters.map((filter) => (
              <Chip
                key={filter}
                size={size}
                onRemove={() =>
                  setChipFilters((current) =>
                    current.filter((f) => f !== filter),
                  )
                }
              >
                {filter}
              </Chip>
            ))}
            <Chip
              size={size}
              leadingIcon={<User aria-hidden="true" />}
              onRemove={() => {}}
            >
              Jane Doe
            </Chip>
            <Chip size={size} disabled onRemove={() => {}}>
              Locked
            </Chip>
            {chipFilters.length === 0 && (
              <Button
                size={size}
                variant="secondary"
                onClick={() => setChipFilters(["Status: Active", "Owner: You"])}
              >
                Reset filters
              </Button>
            )}
          </div>
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

        {/* Five crumbs with keepStart=1/keepEnd=1 collapses the middle three
          behind an overflow menu (Breadcrumb.Ellipsis + Dropdown); the
          hidden BreadcrumbLinks become real, navigable menu items,
          unmodified. The second trail is short enough that keepStart + keepEnd
          already covers every crumb, so it falls back to rendering the full
          trail — no overflow menu appears. */}
        <Section title="Breadcrumb Overflow" column>
          <BreadcrumbOverflow size={size} keepStart={1} keepEnd={1}>
            <BreadcrumbLink href="#home">Home</BreadcrumbLink>
            <BreadcrumbLink href="#library">Library</BreadcrumbLink>
            <BreadcrumbLink href="#library-fiction">Fiction</BreadcrumbLink>
            <BreadcrumbLink href="#library-fiction-mystery">
              Mystery
            </BreadcrumbLink>
            <BreadcrumbPage>Neuromancer</BreadcrumbPage>
          </BreadcrumbOverflow>
          <BreadcrumbOverflow size={size} keepStart={1} keepEnd={1}>
            <BreadcrumbLink href="#home">Home</BreadcrumbLink>
            <BreadcrumbLink href="#library">Library</BreadcrumbLink>
            <BreadcrumbPage>Current article</BreadcrumbPage>
          </BreadcrumbOverflow>
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

        {/* Sits directly under Button: it is a button first and a menu second, so
          it reads as a Button variation rather than a Dropdown one. Also, like
          Navigation Menu, deliberately not near the bottom of the page, where a
          menu that opens downward has no room and flips. */}
        <Section title="Split Button" column>
          <p className="kitchen-sink__note">
            One primary action welded to a chevron that opens the alternatives.
            The menu is at least as wide as the group and grows to fit its rows,
            aligned to the leading edge so each alternative starts on the same
            line as the action's label. Unlike the bare Dropdown further down
            this page there is no anchor wiring to do — Split Button derives its
            own <InlineCode size={size}>anchor-name</InlineCode> per instance.
            Tab through the halves to see the focus ring sit flush against the
            seam rather than painting over the other half.
          </p>

          <Stack direction="row" gap="md" wrap="wrap">
            <SplitButton size={size}>
              <SplitButtonAction>Squash and merge</SplitButtonAction>
              <SplitButtonTrigger>
                <ChevronDown aria-hidden="true" />
                <VisuallyHidden>More merge options</VisuallyHidden>
              </SplitButtonTrigger>
              <SplitButtonMenu>
                <SplitButtonItem>Create a merge commit</SplitButtonItem>
                <SplitButtonItem>Rebase and merge</SplitButtonItem>
              </SplitButtonMenu>
            </SplitButton>

            <SplitButton variant="secondary" size={size}>
              <SplitButtonAction>Save</SplitButtonAction>
              <SplitButtonTrigger>
                <ChevronDown aria-hidden="true" />
                <VisuallyHidden>More save options</VisuallyHidden>
              </SplitButtonTrigger>
              <SplitButtonMenu>
                <SplitButtonItem>Save and close</SplitButtonItem>
                <SplitButtonItem>Save a copy</SplitButtonItem>
              </SplitButtonMenu>
            </SplitButton>

            <SplitButton variant="danger" size={size}>
              <SplitButtonAction>Delete</SplitButtonAction>
              <SplitButtonTrigger>
                <ChevronDown aria-hidden="true" />
                <VisuallyHidden>More delete options</VisuallyHidden>
              </SplitButtonTrigger>
              <SplitButtonMenu>
                <SplitButtonItem>Delete and archive</SplitButtonItem>
                <SplitButtonItem>Delete permanently</SplitButtonItem>
              </SplitButtonMenu>
            </SplitButton>
          </Stack>

          {/* Icons on both sides of the composition: a leading glyph on the
            action, and a leading glyph on every row. The rows use Dropdown's
            own slot parts — Split Button re-exports only Item and Separator,
            because Root provides the same Dropdown context and everything
            else composes inside the menu directly. */}
          <p className="kitchen-sink__note">
            With a leading icon on the action and one on every row. The rows are
            real <InlineCode size={size}>DropdownItemLeading</InlineCode> /{" "}
            <InlineCode size={size}>DropdownItemLabel</InlineCode> slots, so the
            glyph gutter lines up whichever rows carry an icon.
          </p>

          <Stack direction="row" gap="md" align="center" wrap="wrap">
            <SplitButton size={size}>
              <SplitButtonAction
                onClick={() => setPublishAction("Published immediately.")}
              >
                <Upload aria-hidden="true" />
                Publish
              </SplitButtonAction>
              <SplitButtonTrigger>
                <ChevronDown aria-hidden="true" />
                <VisuallyHidden>More publish options</VisuallyHidden>
              </SplitButtonTrigger>
              <SplitButtonMenu>
                <SplitButtonItem
                  onSelect={() =>
                    setPublishAction("Published, then previewed.")
                  }
                >
                  <DropdownItemLeading>
                    <Eye aria-hidden="true" />
                  </DropdownItemLeading>
                  <DropdownItemLabel>Publish and preview</DropdownItemLabel>
                </SplitButtonItem>
                <SplitButtonItem
                  onSelect={() => setPublishAction("Scheduled for tomorrow.")}
                >
                  <DropdownItemLeading>
                    <Calendar aria-hidden="true" />
                  </DropdownItemLeading>
                  <DropdownItemLabel>Schedule for later</DropdownItemLabel>
                </SplitButtonItem>
                <SplitButtonItem
                  onSelect={() => setPublishAction("Saved as a draft.")}
                >
                  <DropdownItemLeading>
                    <File aria-hidden="true" />
                  </DropdownItemLeading>
                  <DropdownItemLabel>Save as draft</DropdownItemLabel>
                </SplitButtonItem>
                <SplitButtonSeparator />
                <SplitButtonItem
                  onSelect={() => setPublishAction("Changes discarded.")}
                >
                  <DropdownItemLeading>
                    <Delete aria-hidden="true" />
                  </DropdownItemLeading>
                  <DropdownItemLabel>Discard changes</DropdownItemLabel>
                </SplitButtonItem>
              </SplitButtonMenu>
            </SplitButton>

            <span className="kitchen-sink__note">{publishAction}</span>
          </Stack>

          {/* All three disabled combinations are legal. The seam steps down one
            stop whenever any half is disabled, so it stops reading as a hard
            dark line across a washed-out control. */}
          <p className="kitchen-sink__note">
            Disabled works three ways — the whole group, the action alone (the
            alternatives stay reachable), or the trigger alone.
          </p>

          <Stack direction="row" gap="md" wrap="wrap">
            <SplitButton size={size} disabled>
              <SplitButtonAction>Whole group</SplitButtonAction>
              <SplitButtonTrigger>
                <ChevronDown aria-hidden="true" />
                <VisuallyHidden>More options</VisuallyHidden>
              </SplitButtonTrigger>
              <SplitButtonMenu>
                <SplitButtonItem>Unreachable</SplitButtonItem>
              </SplitButtonMenu>
            </SplitButton>

            <SplitButton size={size}>
              <SplitButtonAction disabled>Action only</SplitButtonAction>
              <SplitButtonTrigger>
                <ChevronDown aria-hidden="true" />
                <VisuallyHidden>More options</VisuallyHidden>
              </SplitButtonTrigger>
              <SplitButtonMenu>
                <SplitButtonItem>Still reachable</SplitButtonItem>
              </SplitButtonMenu>
            </SplitButton>

            <SplitButton size={size}>
              <SplitButtonAction>Trigger only</SplitButtonAction>
              <SplitButtonTrigger disabled aria-label="More options">
                <ChevronDown aria-hidden="true" />
              </SplitButtonTrigger>
              <SplitButtonMenu>
                <SplitButtonItem>Unreachable</SplitButtonItem>
              </SplitButtonMenu>
            </SplitButton>
          </Stack>
        </Section>

        {/* Mirrors the Figma "Example" showcase frame: three columns covering
          all six media layouts at once. Column 1 is a single Cover card
          stretched to the full column height — the tall-portrait case, which
          is where the scrim's fixed-distance stops earn their keep (a
          proportional gradient would swamp a card this tall). Columns 2 and 3
          stack the remaining layouts. */}
        <Section title="Card" column>
          <div className="ks-card-showcase">
            <div className="ks-card-showcase__column">
              <Card
                layout="cover"
                size={size}
                className="ks-card-showcase__tall"
              >
                <CardMedia>
                  <img src={cardPhoto1} alt="" />
                </CardMedia>
                <CardContent>
                  <CardHeader>
                    <CardTitle>Winter light</CardTitle>
                  </CardHeader>
                  <CardDescription>
                    A short description of what this card links to or
                    represents.
                  </CardDescription>
                  <CardFooter>
                    <Button variant="secondary" size={size}>
                      Learn more
                    </Button>
                    <Button size={size}>View</Button>
                  </CardFooter>
                </CardContent>
              </Card>
            </div>

            <div className="ks-card-showcase__column">
              <Card layout="horizontal" size={size}>
                <CardMedia inset>
                  <img src={cardPhoto2} alt="" />
                </CardMedia>
                <CardContent>
                  <CardHeader>
                    <CardTitle>Card title</CardTitle>
                  </CardHeader>
                  <CardDescription>
                    A short description of what this card links to or
                    represents.
                  </CardDescription>
                  <CardFooter>
                    <Button variant="secondary" size={size}>
                      Learn more
                    </Button>
                    <Button size={size}>View</Button>
                  </CardFooter>
                </CardContent>
              </Card>

              <Card layout="vertical" size={size}>
                <CardMedia inset>
                  <img src={cardPhoto3} alt="" />
                </CardMedia>
                <CardContent>
                  <CardHeader>
                    <CardTitle>Card title</CardTitle>
                  </CardHeader>
                  <CardDescription>
                    A short description of what this card links to or
                    represents.
                  </CardDescription>
                  <CardFooter>
                    <Button variant="secondary" size={size}>
                      Learn more
                    </Button>
                    <Button size={size}>View</Button>
                  </CardFooter>
                </CardContent>
              </Card>

              <Card layout="horizontal" size={size}>
                <CardMedia>
                  <img src={cardPhoto4} alt="" />
                </CardMedia>
                <CardContent>
                  <CardHeader>
                    <CardTitle>Card title</CardTitle>
                  </CardHeader>
                  <CardDescription>
                    A short description of what this card links to or
                    represents.
                  </CardDescription>
                  <CardFooter>
                    <Button variant="secondary" size={size}>
                      Learn more
                    </Button>
                    <Button size={size}>View</Button>
                  </CardFooter>
                </CardContent>
              </Card>
            </div>

            <div className="ks-card-showcase__column">
              <Card layout="vertical" size={size}>
                <CardMedia>
                  <img src={cardPhoto5} alt="" />
                </CardMedia>
                <CardContent>
                  <CardHeader>
                    <CardTitle>Card title</CardTitle>
                  </CardHeader>
                  <CardDescription>
                    A short description of what this card links to or
                    represents.
                  </CardDescription>
                  <CardFooter>
                    <Button variant="secondary" size={size}>
                      Learn more
                    </Button>
                    <Button size={size}>View</Button>
                  </CardFooter>
                </CardContent>
              </Card>

              <Card layout="cover" size={size} scrim="strong">
                <CardMedia>
                  <img src={cardPhoto6} alt="" />
                </CardMedia>
                <CardContent>
                  <CardHeader>
                    <CardTitle>Card title</CardTitle>
                  </CardHeader>
                  <CardDescription>
                    A short description of what this card links to or
                    represents.
                  </CardDescription>
                  <CardFooter>
                    <Button variant="secondary" size={size}>
                      Learn more
                    </Button>
                    <Button size={size}>View</Button>
                  </CardFooter>
                </CardContent>
              </Card>
            </div>
          </div>
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

        {/* Two standalone tri-state cards, then the "select all" nested-list
          pattern from the exploration page: the parent's checked state is
          genuinely derived from its three children (2 of 3 → indeterminate),
          not hardcoded, and clicking the parent sets all three at once. */}
        <Section title="CheckboxCard" column>
          <CheckboxCard
            size={size}
            defaultChecked
            aria-label="Dark mode"
            title="Dark mode"
            description="Switch the interface to a dark colour scheme."
          />
          <CheckboxCard
            size={size}
            aria-label="Email notifications"
            title="Email notifications"
            description="Get a weekly summary by email."
          />
          <CheckboxCard
            size={size}
            checked={selectAllChecked}
            onCheckedChange={(checked) => setAllPermissions(checked)}
            aria-label="Select all permissions"
            title="Select all permissions"
            description={`${permissionCount} of 3 permissions granted.`}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--primitiv-space-space-8)",
              paddingInlineStart: "var(--primitiv-space-space-40)",
            }}
          >
            <CheckboxCard
              size={size}
              checked={permissions.read}
              onCheckedChange={(checked) =>
                setPermissions((p) => ({ ...p, read: checked }))
              }
              aria-label="Read"
              title="Read"
              description="View records and their fields."
            />
            <CheckboxCard
              size={size}
              checked={permissions.write}
              onCheckedChange={(checked) =>
                setPermissions((p) => ({ ...p, write: checked }))
              }
              aria-label="Write"
              title="Write"
              description="Create and edit records."
            />
            <CheckboxCard
              size={size}
              checked={permissions.delete}
              onCheckedChange={(checked) =>
                setPermissions((p) => ({ ...p, delete: checked }))
              }
              aria-label="Delete"
              title="Delete"
              description="Permanently remove records."
            />
          </div>
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
                  Harmoni is the palette generation engine underneath Primitiv —
                  a Rust core compiled to WebAssembly that turns a brand colour
                  into a full, perceptually even ramp. It handles light and dark
                  modes, neutral and soft-neutral ramps, brand-hue tinting, and
                  an OKLCH picker for dialling in the exact anchor colours — all
                  from one input.
                </p>
                <p>
                  Because a fixed <code>collapsedHeight</code> is set, this
                  panel stays visible while closed — clamped to a short preview
                  with a bottom fade — instead of hiding completely. Opening it
                  reveals the rest of the passage and the fade disappears.
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
            A canvas/shape-editor right-click menu — items with leading icons
            and shortcuts, a disabled row, checkbox items (including a tri-state
            indeterminate one), a radio group, and a one-level submenu.
            Right-click near the edge of the viewport to see the panel flip back
            on-screen.
          </p>
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div className="ks-context-menu-canvas ks-anchor-cm">
                Right-click anywhere in this area
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent size={size} className="ks-anchored-cm">
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
                <ContextMenuSubTrigger className="ks-anchor-cm-s1">
                  Arrange
                  <ChevronRight aria-hidden="true" />
                </ContextMenuSubTrigger>
                <ContextMenuSubContent
                  size={size}
                  className="ks-anchored-cm-s1"
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
                      <span className="ks-menu-dot" />
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
                  <GridIcon aria-hidden="true" />
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

        {/* Box/Stack/Spacer (RFC 0022) — the three "zero design risk" layout
          primitives. Box is the escape hatch (no visual opinion of its own,
          so this demo gives it a one-off border via a plain style prop to
          show it holds one); Stack arranges a toolbar; Spacer pushes the
          trailing group to the far edge. */}
        <Section title="Box" column>
          <p>
            <code>Box</code> is the escape hatch — a bare element with no visual
            opinion of its own, so this one carries a one-off inline style:
          </p>
          <Box className="ks-demo-frame ks-demo-frame--dashed">
            A plain Box, styled inline — no built-in look of its own.
          </Box>
        </Section>

        <Section title="Stack & Spacer" column>
          <p>
            <code>Stack</code> arranges a toolbar row; <code>Spacer</code>{" "}
            pushes the trailing group to the far edge:
          </p>
          <Stack
            direction="row"
            gap="sm"
            align="center"
            className="ks-demo-frame ks-demo-frame--scroll-x"
          >
            <Button variant="ghost" size={size}>
              File
            </Button>
            <Button variant="ghost" size={size}>
              Edit
            </Button>
            <Button variant="ghost" size={size}>
              View
            </Button>
            <Spacer />
            <Button variant="secondary" size={size}>
              Share
            </Button>
            <Button size={size}>Publish</Button>
          </Stack>
        </Section>

        <Section title="Center" column>
          <p>
            <code>Center</code> centres content along one or both axes — this
            one needs an explicit block-size for vertical centring to have room
            to work with:
          </p>
          <Center className="ks-demo-frame ks-demo-frame--tall">
            <Button size={size}>Centred both axes</Button>
          </Center>
        </Section>

        <Section title="Aspect Ratio" column>
          <p>
            <code>AspectRatio</code> constrains its content to a ratio via CSS{" "}
            <code>aspect-ratio</code> — no padding-bottom hack:
          </p>
          {/* A two-up grid, and deliberately WITHOUT `align-items`. Grid resolves
            each column to a definite width before any height is needed, so
            `aspect-ratio` gives each box a definite block size — which means the
            default `stretch` never overrides it, and the row sizes to the taller
            box. Setting `align-items: start` here is what broke this twice: it
            drops the items out of the row's sizing, so the row reserved only
            300px and the 1:1 box painted over the Drawer and Dropdown sections.
            Verified in Chrome via CDP: with `stretch` the row is 472px and the
            boxes stay 266/472. See the AspectRatio README. */}
          <Box className="ks-ratio-grid">
            <AspectRatio ratio="16/9">
              <img
                className="ks-ratio-image"
                src={`${import.meta.env.BASE_URL}avatar-demo.jpg`}
                alt="A headshot of a woman with brown hair"
              />
            </AspectRatio>
            <AspectRatio ratio="1/1">
              <img
                className="ks-ratio-image"
                src={`${import.meta.env.BASE_URL}avatar-demo.jpg`}
                alt="A headshot of a woman with brown hair"
              />
            </AspectRatio>
          </Box>
        </Section>

        <Section title="Container" column>
          <p>
            <code>Container</code> caps a content column and centres it in
            whatever space is left. Both of these sit in the same full-width
            parent — only the cap differs. The dashed inner rule is where the
            gutter ends:
          </p>
          <Box className="ks-demo-frame ks-demo-frame--dashed">
            <Container size="xs" className="ks-container-demo">
              <p>
                <code>size="xs"</code> — capped at 22.5rem.
              </p>
            </Container>
            <Container size="sm" className="ks-container-demo">
              <p>
                <code>size="sm"</code> — capped at 40rem, same gutter.
              </p>
            </Container>
            <Container size="sm" gutter="none" className="ks-container-demo">
              <p>
                <code>gutter="none"</code> — same cap, content runs to the edge.
              </p>
            </Container>
          </Box>
        </Section>

        <Section title="Grid" column>
          <p>
            <code>Grid</code> takes a per-breakpoint column map, resolved to
            modifier classes rather than inline styles — so this reflows with
            the viewport and is already correct on the server's first paint.{" "}
            <strong>Resize the window</strong> to see it step: one column, two
            from <code>md</code> (48rem), three from <code>lg</code> (64rem).
          </p>
          <Grid columns={{ base: 1, md: 2, lg: 3 }} gap="md">
            {["One", "Two", "Three", "Four", "Five", "Six"].map((label) => (
              <div key={label} className="ks-grid-cell">
                {label}
              </div>
            ))}
          </Grid>
          <p>
            A grid does not have to start at one column — this one is two up on
            a phone and four from <code>md</code>, the shape a swatch or
            thumbnail strip usually wants:
          </p>
          <Grid columns={{ base: 2, md: 4 }} gap="sm">
            {["1", "2", "3", "4", "5", "6", "7", "8"].map((label) => (
              <div key={label} className="ks-grid-cell">
                {label}
              </div>
            ))}
          </Grid>
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
                      A dialog that slides in from the {side} edge. It reuses
                      the <InlineCode size={size}>Modal</InlineCode> machinery —
                      focus trap, <InlineCode size={size}>Esc</InlineCode>, and
                      click-outside — and adds only the{" "}
                      <InlineCode size={size}>side</InlineCode> axis.
                    </DrawerDescription>
                    <p>
                      The body is the region that scrolls when its content
                      overflows, so the header and footer stay pinned to the
                      panel edges.
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
              <Button variant="secondary" size={size} className="ks-anchor-dd">
                Menu
                <ChevronDown aria-hidden="true" />
              </Button>
            </DropdownTrigger>
            <DropdownContent size={size} className="ks-anchored-dd">
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
                      <span className="ks-menu-dot" />
                    </DropdownItemIndicator>
                    {value[0].toUpperCase() + value.slice(1)}
                  </DropdownRadioItem>
                ))}
              </DropdownRadioGroup>

              <DropdownSeparator />

              <DropdownSub>
                <DropdownSubTrigger className="ks-anchor-dd-s1">
                  Open Recent
                  <ChevronRight aria-hidden="true" />
                </DropdownSubTrigger>
                <DropdownSubContent size={size} className="ks-anchored-dd-s1">
                  <DropdownItem>project-alpha</DropdownItem>
                  <DropdownItem>project-beta</DropdownItem>
                  <DropdownSeparator />
                  <DropdownSub>
                    <DropdownSubTrigger className="ks-anchor-dd-s2">
                      Archived
                      <ChevronRight aria-hidden="true" />
                    </DropdownSubTrigger>
                    <DropdownSubContent
                      size={size}
                      className="ks-anchored-dd-s2"
                    >
                      <DropdownItem>archive-2025</DropdownItem>
                      <DropdownItem>archive-2024</DropdownItem>
                      <DropdownSeparator />
                      <DropdownSub>
                        <DropdownSubTrigger className="ks-anchor-dd-s3">
                          Older still
                          <ChevronRight aria-hidden="true" />
                        </DropdownSubTrigger>
                        <DropdownSubContent
                          size={size}
                          className="ks-anchored-dd-s3"
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

        <Section title="Listbox" column>
          {/* Single-select. The mark stays in the DOM on every row and CSS reveals
            it on the selected one, so the label column never shifts. Arrow keys
            move the cursor without selecting — Enter commits — and clicking a
            row moves the cursor to it too, so both ways of choosing agree about
            where you are in the list. */}
          <div className="ks-select-demo">
            <span className="ks-select-demo__caption">
              Single-select · cursor is separate from selection
            </span>
            <Listbox
              type="single"
              size={size}
              value={lbCity}
              onValueChange={setLbCity}
              aria-label="City"
              className="ks-listbox"
            >
              {LB_CITIES.slice(0, 5).map(({ value, name }) => (
                <ListboxOption key={value} value={value}>
                  <ListboxOptionIndicator>
                    <Check aria-hidden="true" />
                  </ListboxOptionIndicator>
                  <ListboxOptionLabel>{name}</ListboxOptionLabel>
                </ListboxOption>
              ))}
            </Listbox>
          </div>

          {/* Multiple. The mark swaps to a checkbox — deliberately unlike
            Dropdown's checkmark indicator, because a list you accumulate a
            selection in and submit needs an affordance that invites clicking and
            an unambiguous empty state. The box is presentational; the row's own
            aria-selected carries the state. Shift+Arrow and ⌘A work. */}
          <div className="ks-select-demo">
            <span className="ks-select-demo__caption">
              Multi-select · checkbox mark, one disabled row
            </span>
            <Listbox
              type="multiple"
              size={size}
              value={lbToppings}
              onValueChange={setLbToppings}
              aria-label="Toppings"
              className="ks-listbox"
            >
              {LB_TOPPINGS.map(({ value, name, soon }) => (
                <ListboxOption key={value} value={value} disabled={soon}>
                  <ListboxOptionCheckbox />
                  <ListboxOptionLabel>{name}</ListboxOptionLabel>
                </ListboxOption>
              ))}
            </Listbox>
          </div>

          {/* Grouped and scrollable. The headings stick to the top edge as you
            scroll, otherwise you cannot tell which group the row under the
            cursor belongs to. Height is set from the row-height token so the
            viewport stops on a row boundary rather than mid-row. */}
          <div className="ks-select-demo">
            <span className="ks-select-demo__caption">
              Grouped · sticky headings, trailing shortcuts, scrolls on a row
              boundary
            </span>
            <Listbox
              type="single"
              size={size}
              value={lbCommand}
              onValueChange={setLbCommand}
              aria-label="Command"
              className="ks-listbox ks-listbox--scroll"
            >
              {LB_COMMANDS.map((group) => (
                <ListboxGroup key={group.label}>
                  <ListboxGroupLabel>{group.label}</ListboxGroupLabel>
                  {group.options.map(({ value, name, shortcut }) => (
                    <ListboxOption key={value} value={value}>
                      <ListboxOptionIndicator>
                        <Check aria-hidden="true" />
                      </ListboxOptionIndicator>
                      <ListboxOptionLabel>{name}</ListboxOptionLabel>
                      <ListboxOptionTrailing>
                        <span className="ks-select-badge">{shortcut}</span>
                      </ListboxOptionTrailing>
                    </ListboxOption>
                  ))}
                </ListboxGroup>
              ))}
            </Listbox>
          </div>

          {/* THE COMPOSITION THIS COMPONENT EXISTS FOR. DOM focus stays in the
            input, so the list has no focus ring anywhere — the cursor is the
            only thing telling you what Enter will fire, which is why it is
            styled unconditionally rather than only while focused. Type "c",
            then arrow and press Enter without ever leaving the field. */}
          <div className="ks-select-demo">
            <span className="ks-select-demo__caption">
              Driven by an input · focus never leaves the field
              {lbResult ? ` — picked ${lbResult}` : ""}
            </span>
            <Input
              size={size}
              value={lbQuery}
              placeholder="Filter cities..."
              aria-label="Filter cities"
              onChange={(event) => setLbQuery(event.target.value)}
              onKeyDown={(event) => {
                if (
                  !["ArrowDown", "ArrowUp", "Home", "End", "Enter"].includes(
                    event.key,
                  )
                ) {
                  return;
                }
                // Let the primitive own the keymap — just deliver the event to it.
                event.preventDefault();
                lbPaletteRef.current?.dispatchEvent(
                  new KeyboardEvent("keydown", {
                    key: event.key,
                    bubbles: true,
                  }),
                );
              }}
            />
            <Listbox
              ref={lbPaletteRef}
              type="single"
              size={size}
              value={lbResult}
              onValueChange={setLbResult}
              aria-label="Matching cities"
              className="ks-listbox"
            >
              {lbMatches.length === 0 ? (
                <ListboxEmpty>No cities match “{lbQuery}”</ListboxEmpty>
              ) : (
                lbMatches.map(({ value, name }) => (
                  <ListboxOption key={value} value={value}>
                    <ListboxOptionIndicator>
                      <Check aria-hidden="true" />
                    </ListboxOptionIndicator>
                    <ListboxOptionLeading>
                      <Search aria-hidden="true" />
                    </ListboxOptionLeading>
                    <ListboxOptionLabel>{name}</ListboxOptionLabel>
                  </ListboxOption>
                ))
              )}
            </Listbox>
          </div>
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

        <Section title="Confirm Dialog">
          <ConfirmDialog
            open={confirmDialogOpen}
            onOpenChange={setConfirmDialogOpen}
          >
            <ConfirmDialogTrigger asChild>
              <Button variant="danger" size={size}>
                Remove member
              </Button>
            </ConfirmDialogTrigger>
            <ModalPortal forceMount>
              <ConfirmDialogContent
                size={overlaySize}
                title="Remove member?"
                tone="danger"
                confirmLabel="Remove"
                onConfirm={() => setConfirmDialogOpen(false)}
              >
                This person will lose access immediately. This can&apos;t be
                undone.
              </ConfirmDialogContent>
            </ModalPortal>
          </ConfirmDialog>
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
                      className="ks-nav-columns-even"
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
                    <NavigationMenuTriggerLabel>
                      Explore
                    </NavigationMenuTriggerLabel>
                    <NavigationMenuTriggerIcon>
                      <ChevronDown aria-hidden="true" />
                    </NavigationMenuTriggerIcon>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent
                    forceMount
                    className="ks-nav-columns-featured"
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

        <Section title="Pagination" column>
          <p className="kitchen-sink__note">
            A compound, not one prop-heavy component: compose{" "}
            <InlineCode size={size}>PaginationList</InlineCode> /{" "}
            <InlineCode size={size}>PaginationItem</InlineCode> and the cell
            parts, while <InlineCode size={size}>usePagination()</InlineCode>{" "}
            owns the page state and the which-pages-collapse arithmetic — so the
            hook works against any data source and this row knows nothing about
            where the pages came from. Every cell is a real Button and the
            overflow menu a real Dropdown, so Pagination adds no keyboard model
            of its own. Cells are square by{" "}
            <InlineCode size={size}>min-inline-size</InlineCode> — prev/next
            included — so the row does not re-centre as a page number gains a
            digit. Everything tracks the Size and Density controls above.
          </p>
          <DemoPagination
            label="Basic pagination"
            size={size}
            totalItems={200}
            pageSize={10}
          />

          <p className="kitchen-sink__note">
            Compact — a <InlineCode size={size}>PaginationStatus</InlineCode>{" "}
            readout instead of numbered cells, for narrow containers and table
            footers.
          </p>
          <DemoPagination
            label="Compact pagination"
            variant="compact"
            size={size}
            totalItems={200}
            pageSize={10}
          />

          <p className="kitchen-sink__note">
            With both optional slots filled —{" "}
            <InlineCode size={size}>PaginationSummary</InlineCode> before the
            controls and <InlineCode size={size}>PaginationTrailing</InlineCode>{" "}
            after them.
          </p>
          <DemoPagination
            label="Table footer pagination"
            size={size}
            totalItems={237}
            pageSize={10}
            withSummary
            withJump
          />

          <p className="kitchen-sink__note">
            A wide range with a bigger block. The window is{" "}
            <strong>paged</strong>, not sliding: the visible numbers hold still
            while you move within a block and advance in one jump when you step
            past its edge — so cells never re-label under the cursor. Each
            ellipsis opens a menu of the pages it hid, so nothing in a 100-page
            range is more than two clicks away. Those menus are a good{" "}
            <strong>collision</strong> test: the middle gap here hides ~49
            pages, so the panel is capped and scrolls rather than running off
            the viewport, and opening one near the bottom of the window flips it
            above the trigger.
          </p>
          <DemoPagination
            label="Wide-range pagination"
            size={size}
            totalItems={1000}
            pageSize={10}
            blockSize={7}
          />
        </Section>

        <Section title="Popover" column>
          <p className="kitchen-sink__note">
            Click any trigger to open its placement (one at a time — the panels
            are native{" "}
            <InlineCode size={size}>popover=&quot;auto&quot;</InlineCode>).
            Panel + arrow track the Size and Density controls above.
          </p>
          <div className="ks-popover-grid">
            {POPOVER_PLACEMENTS.map((placement) => (
              <Popover key={placement}>
                <PopoverTrigger asChild>
                  <Button
                    variant="secondary"
                    size={size}
                    className={`ks-anchor-pop-${placement}`}
                  >
                    {placement}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  placement={placement}
                  size={overlaySize}
                  className={`ks-anchored-pop-${placement}`}
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

        {/* A plan-picker group — exclusive selection across three RadioCardItems,
          controlled state so the selected plan is real app state, not just
          visual. */}
        <Section title="RadioCard" column>
          <RadioCard
            value={radioPlan}
            onValueChange={setRadioPlan}
            aria-label="Plan"
          >
            <div className="ks-row" style={{ alignItems: "stretch" }}>
              <RadioCardItem
                size={size}
                value="starter"
                title="Starter"
                description="Free forever"
                style={{ flex: "1 1 0" }}
              />
              <RadioCardItem
                size={size}
                value="pro"
                title="Pro"
                description="$9/month"
                style={{ flex: "1 1 0" }}
              />
              <RadioCardItem
                size={size}
                value="enterprise"
                title="Enterprise"
                description="Contact us"
                style={{ flex: "1 1 0" }}
              />
            </div>
          </RadioCard>
        </Section>

        <Section title="Segmented Control" column>
          {/* Single-select value picker (RadioGroup semantics): exactly one segment
            is always selected — the brand-filled one — the rest secondary. The
            leading logos are plain SVG children — the registry sizes them to the
            item's icon-size token, so they scale with `size` + density.
            No `justify` prop — demonstrates the default (`justified`): every
            segment matches the widest one's natural width, even though these
            three happen to be close in length already. */}
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
          {/* justify="content" — opts out of the default equal-width layout, so
            each segment sizes to its own (here, deliberately uneven) label. */}
          <SegmentedControl
            size={size}
            justify="content"
            defaultValue="week"
            aria-label="Range"
          >
            <SegmentedControlItem value="day">Day</SegmentedControlItem>
            <SegmentedControlItem value="week">Week</SegmentedControlItem>
            <SegmentedControlItem value="month">
              Last 30 days
            </SegmentedControlItem>
          </SegmentedControl>
        </Section>

        <Section title="Select" column>
          {/* Rich (the default) — the trigger's content is not written here: it is
            mirrored out of the selected option, so the React mark and the label
            appear in the closed control for free. The checkmark indicator is
            excluded from that mirror. */}
          <div className="ks-select-demo">
            <span className="ks-select-demo__caption">
              Rich · leading marks
            </span>
            <Select value={selFramework} onValueChange={setSelFramework}>
              <SelectTrigger
                size={size}
                aria-label="Framework"
                className="ks-anchor-sel-framework"
              >
                <SelectValue placeholder="Pick a framework..." />
                <SelectIcon>
                  <ChevronDown />
                </SelectIcon>
              </SelectTrigger>
              <SelectContent size={size} className="ks-anchored-sel-framework">
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
                className="ks-anchor-sel-runtime"
              >
                <SelectValue placeholder="Pick a runtime..." />
                <SelectIcon>
                  <ChevronDown />
                </SelectIcon>
              </SelectTrigger>
              <SelectContent size={size} className="ks-anchored-sel-runtime">
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
                className="ks-select-hide-trailing-value ks-anchor-sel-runtime-notrailing"
                aria-label="Runtime, trailing hidden once selected"
              >
                <SelectValue placeholder="Pick a runtime..." />
                <SelectIcon>
                  <ChevronDown />
                </SelectIcon>
              </SelectTrigger>
              <SelectContent
                size={size}
                className="ks-anchored-sel-runtime-notrailing"
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
                className="ks-anchor-sel-region"
              >
                <SelectLeading>
                  <Search aria-hidden="true" />
                </SelectLeading>
                <SelectValue placeholder="Nearest region..." />
                <SelectIcon>
                  <ChevronDown />
                </SelectIcon>
              </SelectTrigger>
              <SelectContent size={size} className="ks-anchored-sel-region">
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
                className="ks-anchor-sel-up"
              >
                <SelectValue placeholder="Pick a framework..." />
                <SelectIcon>
                  <ChevronDown />
                </SelectIcon>
              </SelectTrigger>
              <SelectContent
                size={size}
                placement="top-end"
                className="ks-anchored-sel-up"
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
                className="ks-anchor-sel-invalid"
              >
                <SelectValue placeholder="Required" />
                <SelectIcon>
                  <ChevronDown />
                </SelectIcon>
              </SelectTrigger>
              <SelectContent size={size} className="ks-anchored-sel-invalid">
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

        <Section title="Textarea" column>
          <Textarea
            size={size}
            placeholder="Tell us about yourself"
            rows={4}
            aria-label="Bio"
          />
          <Textarea
            size={size}
            defaultValue="A pre-filled, resizable bio."
            rows={4}
            aria-label="Bio, filled"
          />
          <Textarea
            size={size}
            placeholder="Disabled"
            rows={4}
            disabled
            aria-label="Bio, disabled"
          />
        </Section>

        <Section title="Slider" column>
          <Stack gap="md">
            <Slider size={size} defaultValue={[40]} aria-label="Volume">
              <SliderTrack>
                <SliderRange />
              </SliderTrack>
              <SliderThumb />
            </Slider>
            <Slider
              size={size}
              defaultValue={[20, 80]}
              aria-label="Price range"
            >
              <SliderTrack>
                <SliderRange />
              </SliderTrack>
              <SliderThumb aria-label="Minimum" />
              <SliderThumb aria-label="Maximum" />
            </Slider>
            <Slider
              size={size}
              defaultValue={[30]}
              disabled
              aria-label="Disabled"
            >
              <SliderTrack>
                <SliderRange />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </Stack>
        </Section>

        <Section title="Progress" column>
          <Stack gap="sm">
            <Progress size={size} value={25} aria-label="25% complete">
              <ProgressIndicator />
            </Progress>
            <Progress size={size} value={60} aria-label="60% complete">
              <ProgressIndicator />
            </Progress>
            <Progress size={size} value={100} aria-label="Complete">
              <ProgressIndicator />
            </Progress>
            <Progress size={size} aria-label="Loading, progress unknown">
              <ProgressIndicator />
            </Progress>
            <Progress
              size={size}
              value={60}
              intent="secondary"
              aria-label="60% complete, secondary intent"
            >
              <ProgressIndicator />
            </Progress>
            <Progress
              size={size}
              value={60}
              intent="danger"
              aria-label="60% of quota used"
            >
              <ProgressIndicator />
            </Progress>
          </Stack>
        </Section>

        <Section title="Table" column>
          {/* Wrapped in TableScrollArea so a wide table scrolls horizontally within
            its own area on narrow viewports instead of forcing the page wider. */}
          <TableScrollArea>
            <Table size={size} rows="striped">
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
              {/* A totals row, so the demo actually exercises `<tfoot>` — the
                footer's leading-edge `border/strong` rule had gone unnoticed
                precisely because nothing here rendered one. */}
              <TableFooter>
                <TableRow>
                  {TABLE_COLUMNS.map((col) => (
                    <TableCell
                      key={col.key}
                      className={`ks-table__align-${col.align}`}
                    >
                      {col.key === "pkg"
                        ? "Total"
                        : col.numeric
                          ? RELEASES.reduce(
                              (sum, r) => sum + (r[col.key] as number),
                              0,
                            ).toLocaleString()
                          : ""}
                    </TableCell>
                  ))}
                </TableRow>
              </TableFooter>
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

        {/* Two real wizards rather than a rail specimen — the panels and the
          Back/Continue pair are what make the rail mean anything. The panels are
          pinned to a fixed height HERE ONLY (see .ks-stepper-body in App.css):
          a demo whose height jumps between steps reads as a layout bug. */}
        <Section title="Stepper" column>
          <SignUpWizard size={size} />
          <Divider />
          <SignUpWizard size={size} orientation="vertical" />
          {/* The compact rail. `compact` is a presentation of the SAME steps —
            the triggers stay mounted, so each panel keeps its aria-labelledby —
            and the decision to use it stays with the consumer. Two sources are
            wired here on purpose: a viewport media query, and a manual toggle so
            the presentation is visible without resizing the window. */}
          {/* Uncontrolled: Switch owns its own checked state by design
            (`checked` is typed `never` — see its README), so the demo mirrors
            the change out rather than driving it in. */}
          <Divider />
          <Switch
            size={size}
            defaultChecked
            onCheckedChange={setForceCompactStepper}
          >
            Compact rail
          </Switch>
          <div className="ks-stepper-compact-demo">
            <SignUpWizard
              size={size}
              compact={isNarrow || forceCompactStepper}
            />
          </div>
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
              const anchorSlug = `tip-${tone}-${placement}`;
              return (
                <Tooltip key={`${tone}-${placement}`}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size={size}
                      className={`ks-anchor-${anchorSlug}`}
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
                      className={`ks-anchored-${anchorSlug}`}
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

        <Section title="Miller Columns" column>
          <div className="ks-miller-showcase">
            {/* A Finder-style file browser. Selection is uncontrolled — the strip
              owns the path — and the preview pane reads it from context via
              useMillerColumnsSelection, so nothing here wires state by hand.
              Every column carries a ResizeHandle: drag it, or Tab to it and use
              the arrow keys (Home/End jump to the min/max). */}
            <MillerColumns
              size={size}
              aria-label="Files"
              defaultValue={["documents", "work"]}
              className="ks-miller-showcase__strip"
            >
              <MillerColumnsColumn>
                <MillerColumnsResizeHandle
                  aria-label="Resize column"
                  minWidth={120}
                  maxWidth={360}
                />
                {MILLER_TREE.map((node) => (
                  <MillerNode key={node.id} node={node} />
                ))}
              </MillerColumnsColumn>
              <MillerColumnsPreviewPanel>
                <MillerPreview />
              </MillerColumnsPreviewPanel>
            </MillerColumns>
          </div>
        </Section>

        <Section title="Tree" column>
          <div className="ks-tree-showcase">
            {/* Guide lines on (the default), with the selection-path bar above the
              rows — the VS Code layout. Selection is uncontrolled; SelectionPath
              reads it from context, so it needs no wiring. */}
            <div className="ks-tree-showcase__column">
              <p className="ks-tree-showcase__caption">
                Connectors + selection path
              </p>
              <Tree
                size={size}
                defaultExpandedValues={["src", "components"]}
                defaultSelectedValue="button.tsx"
              >
                <TreeSelectionPath size={size} />
                <TreeBranch value="src" label="src">
                  <TreeBranchControl>
                    <TreeBranchIndicator />
                    <span className="primitiv-tree__branch-control-icon">
                      <Folder />
                    </span>
                    <span className="primitiv-tree__branch-control-label">
                      src
                    </span>
                  </TreeBranchControl>
                  <TreeBranchContent>
                    <TreeBranch value="components" label="components">
                      <TreeBranchControl>
                        <TreeBranchIndicator />
                        <span className="primitiv-tree__branch-control-icon">
                          <Folder />
                        </span>
                        <span className="primitiv-tree__branch-control-label">
                          components
                        </span>
                      </TreeBranchControl>
                      <TreeBranchContent>
                        <TreeItem value="button.tsx" label="button.tsx">
                          <span className="primitiv-tree__item-icon">
                            <File />
                          </span>
                          <span className="primitiv-tree__item-label">
                            button.tsx
                          </span>
                        </TreeItem>
                        <TreeItem value="input.tsx" label="input.tsx">
                          <span className="primitiv-tree__item-icon">
                            <File />
                          </span>
                          <span className="primitiv-tree__item-label">
                            input.tsx
                          </span>
                        </TreeItem>
                      </TreeBranchContent>
                    </TreeBranch>
                    <TreeBranch value="hooks" label="hooks">
                      <TreeBranchControl>
                        <TreeBranchIndicator />
                        <span className="primitiv-tree__branch-control-icon">
                          <Folder />
                        </span>
                        <span className="primitiv-tree__branch-control-label">
                          hooks
                        </span>
                      </TreeBranchControl>
                      <TreeBranchContent>
                        <TreeItem value="use-id.ts" label="use-id.ts">
                          <span className="primitiv-tree__item-icon">
                            <File />
                          </span>
                          <span className="primitiv-tree__item-label">
                            use-id.ts
                          </span>
                        </TreeItem>
                      </TreeBranchContent>
                    </TreeBranch>
                    <TreeItem value="index.ts" label="index.ts">
                      <span className="primitiv-tree__item-icon">
                        <File />
                      </span>
                      <span className="primitiv-tree__item-label">
                        index.ts
                      </span>
                    </TreeItem>
                  </TreeBranchContent>
                </TreeBranch>
                <TreeItem value="readme" label="README.md">
                  <span className="primitiv-tree__item-icon">
                    <File />
                  </span>
                  <span className="primitiv-tree__item-label">README.md</span>
                </TreeItem>
              </Tree>
            </div>

            {/* Guide lines off — indentation alone still carries the hierarchy.
              Text-only rows, no icons: a plain tree stays legitimate. */}
            <div className="ks-tree-showcase__column">
              <p className="ks-tree-showcase__caption">
                No connectors, text only
              </p>
              <Tree
                size={size}
                connectors="none"
                defaultExpandedValues={["docs"]}
              >
                <TreeBranch value="docs" label="docs">
                  <TreeBranchControl>
                    <TreeBranchIndicator />
                    docs
                  </TreeBranchControl>
                  <TreeBranchContent>
                    <TreeItem value="getting-started">Getting started</TreeItem>
                    <TreeItem value="theming">Theming</TreeItem>
                    <TreeItem value="deprecated" disabled>
                      Deprecated (disabled)
                    </TreeItem>
                  </TreeBranchContent>
                </TreeBranch>
                <TreeItem value="changelog">Changelog</TreeItem>
              </Tree>
            </div>

            {/* Multiple selection — Ctrl/Cmd-click to toggle, Shift-click for a
              range. SelectionPath renders one trail per selected value. Size
              comes from the shared header control, like every other demo. */}
            <div className="ks-tree-showcase__column">
              <p className="ks-tree-showcase__caption">Multiple selection</p>
              <Tree
                size={size}
                selectionMode="multiple"
                defaultExpandedValues={["assets"]}
                defaultSelectedValues={["logo.svg", "hero.png"]}
              >
                <TreeSelectionPath size={size} />
                <TreeBranch value="assets" label="assets">
                  <TreeBranchControl>
                    <TreeBranchIndicator />
                    <span className="primitiv-tree__branch-control-icon">
                      <Folder />
                    </span>
                    <span className="primitiv-tree__branch-control-label">
                      assets
                    </span>
                  </TreeBranchControl>
                  <TreeBranchContent>
                    <TreeItem value="logo.svg" label="logo.svg">
                      <span className="primitiv-tree__item-icon">
                        <File />
                      </span>
                      <span className="primitiv-tree__item-label">
                        logo.svg
                      </span>
                    </TreeItem>
                    <TreeItem value="hero.png" label="hero.png">
                      <span className="primitiv-tree__item-icon">
                        <File />
                      </span>
                      <span className="primitiv-tree__item-label">
                        hero.png
                      </span>
                    </TreeItem>
                    <TreeItem value="icon.ico" label="icon.ico">
                      <span className="primitiv-tree__item-icon">
                        <File />
                      </span>
                      <span className="primitiv-tree__item-label">
                        icon.ico
                      </span>
                    </TreeItem>
                  </TreeBranchContent>
                </TreeBranch>
              </Tree>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
