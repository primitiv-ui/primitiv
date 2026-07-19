import { forwardRef, Ref } from "react";
import type {
  ForwardRefExoticComponent,
  PropsWithoutRef,
  ReactElement,
  RefAttributes,
} from "react";

import { useDirection } from "../DirectionProvider/index.ts";
import { Slot, composeRefs } from "../Slot/index.ts";

import {
  useTabsRoot,
  useTabsContext,
  useTabsTrigger,
  useTabsContent,
} from "./hooks/index.ts";
import { TabsProvider } from "./TabsContext";
import type {
  TabsRootProps,
  TabsListProps,
  TabsTriggerProps,
  TabsContentProps,
  TabsImperativeApi,
} from "./types";

/**
 * The root of a Tabs widget — owns the active value, provides context to
 * descendants, and renders a single container `<div>`.
 *
 * Supports two state modes, statically discriminated at the type level so
 * only one of the two shapes is accepted by TypeScript:
 *
 * - **Uncontrolled** — pass {@link TabsRootProps.defaultValue | `defaultValue`}
 *   (or omit it and let the first click seed the state). The component
 *   owns and updates the active value internally.
 * - **Controlled** — pass {@link TabsRootProps.value | `value`} *and*
 *   {@link TabsRootProps.onValueChange | `onValueChange`} together. The
 *   parent owns the active value; the component defers every state change
 *   back through the callback.
 *
 * An additional {@link TabsRootProps.onChange | `onChange({ index, name })`}
 * callback fires on every user-driven activation (click or keyboard)
 * independent of the control mode. Use it for analytics or side-effects
 * that shouldn't re-enter the state update path.
 *
 * An imperative handle is exposed via `ref`, exposing
 * {@link TabsImperativeApi.setActiveTab | `setActiveTab(value)`} for
 * programmatic activation (e.g. restoring a remembered tab on mount, or
 * reacting to a deep-linked hash):
 *
 * ```tsx
 * const tabsRef = useRef<TabsImperativeApi>(null);
 * tabsRef.current?.setActiveTab("settings");
 * ```
 *
 * **Runtime validation.** If `value`/`defaultValue` doesn't match any
 * registered `Tabs.Trigger`, a descriptive error is thrown during render
 * and typos surface early in development.
 *
 * **Styling hooks.** `data-orientation="horizontal" | "vertical"` is set
 * on the rendered container.
 *
 * **Reading direction.** `dir` (`"ltr"` / `"rtl"`) sets the arrow-key
 * direction and the container's `dir` attribute. When omitted, it is
 * inherited from the nearest {@link DirectionProvider}, falling back to
 * `"ltr"` when there is no provider.
 *
 * @extends HTMLDivElement
 *
 * @example Uncontrolled
 * ```tsx
 * <Tabs.Root defaultValue="overview">
 *   <Tabs.List label="Account sections">
 *     <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
 *     <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
 *   </Tabs.List>
 *   <Tabs.Content value="overview">Dashboard…</Tabs.Content>
 *   <Tabs.Content value="settings">Preferences…</Tabs.Content>
 * </Tabs.Root>
 * ```
 *
 * @example Controlled with an analytics hook
 * ```tsx
 * const [tab, setTab] = useState("overview");
 *
 * <Tabs.Root
 *   value={tab}
 *   onValueChange={setTab}
 *   onChange={({ name, index }) => track("tab_view", { name, index })}
 * >
 *   …
 * </Tabs.Root>
 * ```
 *
 * @example Vertical orientation + imperative API
 * ```tsx
 * const ref = useRef<TabsImperativeApi>(null);
 *
 * <Tabs.Root ref={ref} orientation="vertical" defaultValue="one">
 *   …
 * </Tabs.Root>
 *
 * <button onClick={() => ref.current?.setActiveTab("two")}>Go to two</button>
 * ```
 */
export const TabsRoot: ForwardRefExoticComponent<
  PropsWithoutRef<TabsRootProps> & RefAttributes<TabsImperativeApi>
> = forwardRef<TabsImperativeApi, TabsRootProps>(function TabsRoot(
  {
    className = "",
    orientation = "horizontal",
    dir,
    activationMode = "automatic",
    defaultValue,
    value,
    onValueChange,
    onChange,
    lazyMount = false,
    ...rest
  },
  ref,
) {
  const resolvedDir = dir ?? useDirection();
  const { contextValue } = useTabsRoot(
    {
      orientation,
      dir: resolvedDir,
      activationMode,
      defaultValue,
      value,
      onValueChange,
      onChange,
      lazyMount,
    },
    ref,
  );

  return (
    <TabsProvider value={contextValue}>
      <div
        dir={resolvedDir}
        className={className}
        data-orientation={contextValue.orientation}
        {...rest}
      />
    </TabsProvider>
  );
});

TabsRoot.displayName = "TabsRoot";

/**
 * The tablist — an accessible container for `Tabs.Trigger` elements.
 *
 * Renders a `<div role="tablist">` with `aria-orientation` inherited from
 * the nearest {@link TabsRoot | `Tabs.Root`}. The
 * {@link TabsListProps.label | `label`} prop is **required** and becomes
 * the `aria-label` announced to assistive technology when the tablist
 * receives focus — pick a short, human-readable description of the set of
 * tabs (e.g. `"Account sections"`, not `"Tabs"`).
 *
 * **Styling hooks.** `data-orientation="horizontal" | "vertical"`.
 *
 * @extends HTMLDivElement
 *
 * @example
 * ```tsx
 * <Tabs.List label="Document sections">
 *   <Tabs.Trigger value="title">Title</Tabs.Trigger>
 *   <Tabs.Trigger value="body">Body</Tabs.Trigger>
 * </Tabs.List>
 * ```
 */
export function TabsList({
  children,
  className = "",
  label,
  ariaLabelledBy,
  ...rest
}: TabsListProps): ReactElement {
  const { orientation } = useTabsContext();

  return (
    <div
      role="tablist"
      className={className}
      aria-orientation={orientation}
      {...(label && {
        "aria-label": label,
      })}
      {...(ariaLabelledBy && {
        "aria-labelledby": ariaLabelledBy,
      })}
      data-orientation={orientation}
      {...rest}
    >
      {children}
    </div>
  );
}

/** @internal */
TabsList.displayName = "TabsList";

/**
 * An individual tab button. Renders `<button role="tab">` with full ARIA
 * linkage, roving tabindex, and keyboard navigation handled automatically.
 *
 * **Value linkage.** Each trigger is identified by a unique
 * {@link TabsTriggerProps.value | `value`} string; the matching
 * `Tabs.Content` must share the same value. The IDs used for
 * `aria-controls` and `aria-labelledby` are derived from the root's
 * `useId()` plus the trigger's `value`, so they're stable and unique even
 * when multiple `Tabs` instances coexist on a page.
 *
 * **Keyboard support** (WAI-ARIA Tabs pattern):
 *
 * | Key                          | Behaviour                                          |
 * | ---------------------------- | -------------------------------------------------- |
 * | `ArrowRight` / `ArrowLeft`   | Move between triggers (horizontal)                 |
 * | `ArrowDown`  / `ArrowUp`     | Move between triggers (vertical)                   |
 * | `Home` / `End`               | Jump to first / last trigger                       |
 * | `Enter` / `Space`            | Activate focused trigger (manual mode only)        |
 *
 * Movement **wraps** at the ends. In **automatic** activation mode (the default),
 * focus movement immediately activates the panel. In **manual** mode, arrow keys
 * move focus without switching the panel — `Enter` or `Space` confirms the
 * selection. Use manual mode for panels that are expensive to render.
 *
 * **`asChild` prop.** Pass `asChild` to render an arbitrary child element
 * instead of the default `<button>`. All tab ARIA attributes, event handlers,
 * and the roving `tabIndex` are merged onto the child element following the
 * Composition pattern:
 * - Event handlers compose — the child's handler runs first, then the trigger's.
 * - `style` is shallow-merged (child wins on collisions).
 * - `className` strings are concatenated.
 * - Refs from both sides are composed via `composeRefs`.
 *
 * The child **must** be a single React element that accepts a `ref`.
 *
 * **Styling hooks.**
 * - `data-state="active" | "inactive"` on the rendered element.
 * - `data-orientation="horizontal" | "vertical"`.
 * - `data-disabled=""` when disabled (omitted otherwise), so CSS can target
 *   `[data-disabled]` without the `:disabled` pseudo-class.
 *
 * @extends HTMLButtonElement
 *
 * @example Basic usage
 * ```tsx
 * <Tabs.Trigger value="account">Account</Tabs.Trigger>
 * ```
 *
 * @example Icon + label
 * ```tsx
 * <Tabs.Trigger value="billing">
 *   <CreditCardIcon aria-hidden />
 *   <span>Billing</span>
 * </Tabs.Trigger>
 * ```
 *
 * @example asChild — render a router link with tab semantics
 * ```tsx
 * <Tabs.Trigger asChild value="settings">
 *   <Link to="/settings">Settings</Link>
 * </Tabs.Trigger>
 * ```
 */
export function TabsTrigger<T extends HTMLElement = HTMLButtonElement>({
  ref: externalRef,
  children,
  className = "",
  value,
  onClick,
  disabled = false,
  asChild = false,
  ...rest
}: TabsTriggerProps<T>): ReactElement {
  const {
    buttonRef,
    triggerId,
    panelId,
    isActive,
    orientation,
    state,
    tabIndex,
    handleClick,
    handleKeyDown,
  } = useTabsTrigger({ value, onClick, disabled });

  // Compose our internal ref with any external ref the consumer passes.
  // The external ref is cast to match the internal ref's element type —
  // RefObject<T> is invariant in React's types, but at runtime the callback
  // receives whatever DOM element is actually rendered (button or asChild).
  const composedRef = externalRef
    ? composeRefs(buttonRef, externalRef as Ref<HTMLButtonElement>)
    : buttonRef;

  const triggerProps = {
    ref: composedRef,
    role: "tab" as const,
    className,
    id: triggerId,
    "aria-controls": panelId,
    "aria-selected": isActive,
    "aria-disabled": disabled,
    "data-disabled": disabled ? "" : undefined,
    "data-orientation": orientation,
    "data-state": state,
    tabIndex,
    onClick: handleClick,
    onKeyDown: handleKeyDown,
    ...rest,
  };

  if (asChild) {
    return <Slot {...triggerProps}>{children}</Slot>;
  }

  return (
    <button type="button" {...triggerProps}>
      {children}
    </button>
  );
}

/** @internal */
TabsTrigger.displayName = "TabsTrigger";

/**
 * A panel associated with a `Tabs.Trigger` of the same
 * {@link TabsContentProps.value | `value`}.
 *
 * Renders `<div role="tabpanel">` with `aria-labelledby` pointing at the
 * matching trigger, and uses the native `hidden` attribute to toggle
 * visibility. Inactive panels remain **mounted** — this preserves
 * component state (scroll position, form input, animation state) across
 * tab switches. If you need true unmount semantics (e.g. to tear down
 * expensive subscriptions), render the `Tabs.Content` conditionally
 * yourself based on the active value.
 *
 * When {@link TabsRootProps.lazyMount | `lazyMount`} is set on
 * `Tabs.Root`, a panel's children are withheld until the tab is first
 * activated. After that first activation the children remain mounted
 * across subsequent tab switches (lazy mount, not unmount-on-hide).
 * The `<div role="tabpanel">` wrapper always renders so the ARIA
 * relationship between trigger and panel is always present in the DOM.
 *
 * **Styling hooks.**
 * - `data-state="active" | "inactive"`.
 * - `data-orientation="horizontal" | "vertical"`.
 *
 * @extends HTMLDivElement
 *
 * @example
 * ```tsx
 * <Tabs.Content value="account">
 *   <AccountForm />
 * </Tabs.Content>
 * ```
 */
export function TabsContent({
  children,
  className = "",
  value,
  ...rest
}: TabsContentProps): ReactElement {
  const {
    panelId,
    triggerId,
    orientation,
    isActive,
    state,
    tabIndex,
    shouldRender,
  } = useTabsContent({ value });

  return (
    <div
      role="tabpanel"
      className={className}
      id={panelId}
      aria-labelledby={triggerId}
      data-orientation={orientation}
      data-state={state}
      hidden={!isActive}
      tabIndex={tabIndex}
      {...rest}
    >
      {shouldRender ? children : null}
    </div>
  );
}

/** @internal */
TabsContent.displayName = "TabsContent";

/** Type of the {@link Tabs} compound: the callable `Tabs.Root` component
 * augmented with its sub-components as static properties. */
export type TabsCompound = typeof TabsRoot & {
  Root: typeof TabsRoot;
  List: typeof TabsList;
  Trigger: typeof TabsTrigger;
  Content: typeof TabsContent;
};

/**
 * Headless, accessible **Tabs** — a compound component implementing the
 * WAI-ARIA Tabs pattern with zero styles.
 *
 * `Tabs` is both callable (it's an alias of {@link TabsRoot | `Tabs.Root`})
 * and carries its sub-components as static properties. Prefer the
 * namespaced form in application code for readability and grep-ability:
 *
 * - {@link TabsRoot | `Tabs.Root`} — state owner, context provider, imperative API holder.
 * - {@link TabsList | `Tabs.List`} — `role="tablist"` container for triggers.
 * - {@link TabsTrigger | `Tabs.Trigger`} — individual `role="tab"` button.
 * - {@link TabsContent | `Tabs.Content`} — `role="tabpanel"` panel, linked to a trigger by `value`.
 *
 * @example Minimal usage
 * ```tsx
 * import { Tabs } from "@primitiv-ui/react";
 *
 * export function Demo() {
 *   return (
 *     <Tabs.Root defaultValue="a">
 *       <Tabs.List label="Demo tabs">
 *         <Tabs.Trigger value="a">First</Tabs.Trigger>
 *         <Tabs.Trigger value="b">Second</Tabs.Trigger>
 *       </Tabs.List>
 *       <Tabs.Content value="a">First panel</Tabs.Content>
 *       <Tabs.Content value="b">Second panel</Tabs.Content>
 *     </Tabs.Root>
 *   );
 * }
 * ```
 *
 * @example Styling with any system
 * Because no styles ship with the component, target the rendered elements
 * or the `data-state` / `data-orientation` hooks with whatever system you
 * use (CSS, CSS-in-JS, Tailwind, design-token stylesheets, etc.):
 *
 * ```css
 * [role="tab"][data-state="active"] { border-bottom: 2px solid currentColor; }
 * [role="tabpanel"][data-state="inactive"] { display: none; }
 * ```
 *
 * @see {@link TabsRoot} for state modes, validation behaviour, and the
 *   imperative API.
 * @see {@link TabsList} for the required `label` prop.
 * @see {@link TabsTrigger} for the full keyboard-interaction table.
 * @see {@link TabsContent} for panel lifecycle and unmount semantics.
 */
const TabsCompound: TabsCompound = Object.assign(TabsRoot, {
  Root: TabsRoot,
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
});

TabsCompound.displayName = "Tabs";

export { TabsCompound as Tabs };
