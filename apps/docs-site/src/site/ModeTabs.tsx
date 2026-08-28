"use client";

import type { ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs";
import { type Mode, useHeadlessAvailable, useMode } from "@/site/preferences";

import "./mode-tabs.css";

/**
 * Styled first, then Headless — the same order and the same Figma-mode fallback
 * as `ModeCodeBlock`, so the two controls behave identically wherever they sit
 * on a page.
 */
const TABS = [
  { value: "styled", label: "Styled" },
  { value: "headless", label: "Headless" },
] as const;

/**
 * The Styled/Headless switch for a section whose content is NOT a code block.
 *
 * `ModeCodeBlock` covers the code case, but it takes a `code` string and renders
 * a `CodeBlock` — no good for a section made of tables. This is the same
 * contract for arbitrary children: two tabs, two-way bound to the top-nav mode
 * switch, `children` called once per tab with that tab's mode.
 *
 * Why the section needs it at all: data attributes are emitted by the headless
 * primitive in both modes, but WHAT YOU WRITE to target them differs. In styled
 * mode you select the registry class — `.primitiv-select__item[data-state="checked"]`
 * — and in headless mode there is no class, because the element is yours; the
 * part is identified by name. Showing one and not the other left half the
 * readers translating.
 *
 * `children` is called once per TAB, not once per render, so it must not assume
 * it is only asked for the active mode.
 */
export const ModeTabs = ({
  label,
  size = "md",
  children,
}: {
  /**
   * Names the tablist. Must be DISTINCT per instance where a page carries
   * several — four tablists all announced "Consumption mode" are four identical
   * controls in a screen reader's element list.
   */
  label: string;
  /** `sm` where the tabs are a sub-control inside a section, not the section. */
  size?: "sm" | "md";
  children: (mode: Mode) => ReactNode;
}) => {
  const [mode, setMode] = useMode();
  const headlessAvailable = useHeadlessAvailable();
  /* One tab when the page has no Headless mode — see `ModeCodeBlock`. */
  const tabs = headlessAvailable ? TABS : [TABS[0]];
  const active = headlessAvailable && mode === "headless" ? "headless" : "styled";

  return (
    <Tabs
      className="docs-mode-tabs"
      size={size}
      value={active}
      onValueChange={(next) => setMode(next as Mode)}
    >
      <TabsList label={label}>
        {tabs.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((t) => (
        <TabsContent key={t.value} value={t.value}>
          {children(t.value)}
        </TabsContent>
      ))}
    </Tabs>
  );
};
