"use client";

import type { ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs";
import { type Mode, type Style, label as labelOf, useView } from "@/site/preferences";

import "./mode-tabs.css";

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
  /* The same tabs as `ModeCodeBlock`, from the same answer (`useView`). A
     section of tables only needs to know headless from styled: under Elements,
     headless is the bare element and styled is the registry class on it. */
  const { styles, style, setStyle, modeFor } = useView();
  const modeOf = (s: Style): Mode => (s === "headless" ? "headless" : modeFor(s));

  return (
    <Tabs
      className="docs-mode-tabs"
      size={size}
      value={style}
      onValueChange={(next) => setStyle(next as Style)}
    >
      <TabsList label={label}>
        {styles.map((s) => (
          <TabsTrigger key={s} value={s}>
            {labelOf(s)}
          </TabsTrigger>
        ))}
      </TabsList>

      {styles.map((s) => (
        <TabsContent key={s} value={s}>
          {children(modeOf(s))}
        </TabsContent>
      ))}
    </Tabs>
  );
};
