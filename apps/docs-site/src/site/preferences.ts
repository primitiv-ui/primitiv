"use client";

import { createContext, useContext } from "react";

import { useLocalStorage } from "@primitiv-ui/react";

/*
 * Site-wide preferences, persisted.
 *
 * No React context here, deliberately: `useLocalStorage` is already a shared
 * store — every consumer of the same key subscribes to it and is notified on
 * write (the in-document listener set, since the browser's `storage` event
 * fires only in *other* documents). So the nav's mode switch and the landing's
 * "Installing a component" block stay in step by both calling `useMode()`,
 * with no provider to thread through the tree.
 */

export const FRAMEWORK_KEY = "primitiv-docs-framework";
export const ELEMENTS_STYLE_KEY = "primitiv-docs-style-elements";
export const REACT_STYLE_KEY = "primitiv-docs-style-react";

/**
 * The framework a reader builds with. **Elements leads** (RFC 0033): the
 * custom elements of `@primitiv-ui/web` are the direction the library is
 * heading, the base every framework will eventually reach through an adapter,
 * and they work in plain HTML or any framework today. React is the complete
 * library now. Other frameworks join when their adapter pages exist; until
 * then, Elements is how a Vue or Svelte project uses Primitiv.
 */
export const FRAMEWORKS = ["elements", "react"] as const;
export type Framework = (typeof FRAMEWORKS)[number];

/**
 * Headless or styled, the second choice after the framework. Headless first:
 * the behaviour is the product and the styling is the opt-in.
 */
export const STYLES = ["headless", "styled"] as const;
export type Style = (typeof STYLES)[number];

/**
 * What a snippet is written for: the two React surfaces, or Elements markup.
 * Derived from the framework and style (see `useMode`), never stored. Elements
 * snippets are written STYLED, with the registry classes, and the headless form
 * is derived from them by removing the classes (`withoutClasses`), the same
 * derivation `primitiv add --surface elements` makes, so the two cannot drift.
 */
export type Mode = "styled" | "headless" | "elements";

const LABELS: Record<string, string> = {
  headless: "Headless",
  styled: "Styled",
  elements: "Elements",
  react: "React",
};

export const label = (value: string): string => LABELS[value] ?? value;

/**
 * The framework, shared by every control that reads or writes it (a
 * `useLocalStorage` store, so the header and the drawer copy stay in step).
 */
export const useFramework = () =>
  useLocalStorage<Framework>(FRAMEWORK_KEY, "elements");

/**
 * Headless or styled, remembered PER FRAMEWORK, each with its own default:
 * Elements opens headless (styling is the opt-in there), React opens styled
 * (the copy-and-go path its readers have always landed on). Switching
 * framework therefore lands on that framework's own last choice.
 */
export const useStyle = (): readonly [Style, (next: Style) => void] => {
  const [framework] = useFramework();
  const elements = useLocalStorage<Style>(ELEMENTS_STYLE_KEY, "headless");
  const react = useLocalStorage<Style>(REACT_STYLE_KEY, "styled");
  const [style, setStyle] = framework === "react" ? react : elements;
  return [style, setStyle];
};

/** The snippet mode the current page is read in (see `useView`). */
export const useMode = (): readonly [Mode] => {
  const { modeFor, style } = useView();
  return [modeFor(style)];
};

/**
 * Whether the current page HAS a headless mode.
 *
 * Registry-only components (RFC 0022 primitives like `Box`, and the
 * primitive-less leaves like `Badge`) have no `@primitiv-ui/react` counterpart,
 * so "Headless" is not a mode they can be consumed in. A component page sets
 * this to `false`, and the mode-aware code blocks then show only the Styled tab
 * rather than offering a Headless one that could only ever print the copied
 * file's own import.
 *
 * A context rather than a prop because the code blocks are rendered deep inside
 * the example specs (`InteractiveExample` → `ModeCodeBlock`), with no prop path
 * from the page. Defaults to `true`, so anything rendered outside a provider —
 * the landing page's install block — keeps both modes.
 */
const HeadlessAvailableContext = createContext(true);
export const HeadlessAvailableProvider = HeadlessAvailableContext.Provider;
export const useHeadlessAvailable = () => useContext(HeadlessAvailableContext);

/**
 * What elements surface the current page's component has (RFC 0033): a custom
 * element with behaviour (`@primitiv-ui/web`, Tabs today), registry classes on
 * plain markup only (`markup`: Button, Badge, Tag, Kbd, Inline Code), or none.
 *
 * A context for the same reason as `HeadlessAvailableContext`: the code blocks
 * that read it sit deep inside the example specs. Defaults to `behaviour`, so
 * anything outside a component page, the landing page's install block, reads
 * every framework and style as available.
 */
export type ElementsSurface = "behaviour" | "markup" | null;
const ElementsSurfaceContext = createContext<ElementsSurface>("behaviour");
export const ElementsSurfaceProvider = ElementsSurfaceContext.Provider;

/**
 * How the current page is read: one answer for every control on it, so the
 * header, the code-block tabs and the Installation section cannot disagree.
 *
 * - `reading` is the framework actually shown. A page whose component has no
 *   elements surface is read as React even when Elements is chosen, and
 *   `fallback` says so, for the notice at the top of the page.
 * - `styles` are the ones that mean something here. Headless React needs a
 *   headless primitive (a registry-only component has none); headless Elements
 *   needs behaviour, since a component with none is plain HTML without its
 *   classes, which is nothing Primitiv adds.
 * - `style` is the chosen one, or Styled where the choice is not offered.
 */
export const useView = () => {
  const [framework] = useFramework();
  const [chosen, setStyle] = useStyle();
  const headlessReact = useHeadlessAvailable();
  const elements = useContext(ElementsSurfaceContext);
  const reading: "react" | "elements" =
    framework !== "react" && elements ? "elements" : "react";
  const styles = STYLES.filter(
    (s) =>
      s === "styled" ||
      (reading === "react" ? headlessReact : elements === "behaviour"),
  );
  const style: Style = styles.includes(chosen) ? chosen : "styled";
  return {
    reading,
    styles,
    style,
    chosen,
    setStyle,
    fallback: framework !== "react" && !elements,
    /** The snippet mode a style is written in, on this page. */
    modeFor: (s: Style): Mode => (reading === "elements" ? "elements" : s),
  };
};

/** The install command a framework and style imply, shown on component pages. */
export const installCommand = (mode: Mode, component: string, style: Style = "styled") =>
  mode === "elements"
    ? style === "styled"
      ? `npx primitiv-ui@latest add ${component} --styled, after init --styles`
      : `npx primitiv-ui@latest add ${component}`
    : mode === "styled"
      ? `npx primitiv-ui@latest add ${component}`
      : `npm i @primitiv-ui/react`;
