"use client";

import type { ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs";
import { type Mode, useMode } from "@/site/preferences";

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
  children,
}: {
  /** Names the tablist, e.g. `"Consumption mode"`. */
  label: string;
  children: (mode: Mode) => ReactNode;
}) => {
  const [mode, setMode] = useMode();
  const active = mode === "headless" ? "headless" : "styled";

  return (
    <Tabs
      className="docs-mode-tabs"
      value={active}
      onValueChange={(next) => setMode(next as Mode)}
    >
      <TabsList label={label}>
        {TABS.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {TABS.map((t) => (
        <TabsContent key={t.value} value={t.value}>
          {children(t.value)}
        </TabsContent>
      ))}
    </Tabs>
  );
};
