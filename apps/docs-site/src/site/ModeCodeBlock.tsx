"use client";

// `code-block` styles its tabs with the TABS component's classes, and used to
// leave loading that sheet to its importers — so this file (and `InstallTabs`)
// each carried a `tabs/styles.css` import. `code-block.tsx` now declares the
// dependency itself (`import "./tabs"`), so both workarounds are gone.
import { CodeBlock } from "@/components/code-block";
import { type Mode, useMode } from "@/site/preferences";

/**
 * Styled FIRST, then Headless. Styled is the copy-and-go path and the default
 * mode (preferences.ts), so a cold visit lands on the first tab.
 *
 * Figma has no tab of its own and rests on Styled — JSX is not the artifact a
 * designer wants (the call `partNamer` already makes), and the copied file is
 * the closest thing a Figma-driven handoff produces.
 */
const TABS = [
  { value: "styled", label: "Styled" },
  { value: "headless", label: "Headless" },
] as const;

/**
 * A code block that shows BOTH consumption modes, tabbed, with the tablist
 * TWO-WAY bound to the top nav's mode switch.
 *
 * Every code block on a component page uses this, so the page has one rule
 * rather than a mixture: the playground snippet, and each example's snippet.
 *
 * Why show both rather than follow the switch — "one design system, three ways
 * to build" is the product claim, and a component page is where the difference
 * is legible at a glance: the same component, the same controls, with the props
 * moving to class names and the import changing shape. A block that follows the
 * switch hides exactly that comparison, and it also hid a bug for a while, since
 * a reader never saw the mode they were not in.
 *
 * The binding is two-way because the alternative is worse than it sounds: a
 * local tab that only *reads* the mode can be left saying "Headless" while the
 * Installation section above it says `primitiv add`. `useMode` is a shared
 * `useLocalStorage` store, so the tablist and the nav switch are two views of
 * one value rather than two states to reconcile — a tab click IS a mode change.
 *
 * `code` is called once per tab, not once per render, so a caller must not
 * assume it is only asked for the active mode.
 */
export const ModeCodeBlock = ({ code }: { code: (mode: Mode) => string }) => {
  const [mode, setMode] = useMode();
  const active = mode === "headless" ? "headless" : "styled";

  return (
    <CodeBlock.Tabs
      size="sm"
      value={active}
      onValueChange={(next) => setMode(next as Mode)}
    >
      <CodeBlock.Header>
        {/* `label`, not `ariaLabelledBy`: the nearest heading names the section
            (an example title, or "Playground"), not what these tabs switch. */}
        <CodeBlock.List label="Consumption mode">
          {TABS.map((t) => (
            <CodeBlock.Trigger key={t.value} value={t.value}>
              {t.label}
            </CodeBlock.Trigger>
          ))}
        </CodeBlock.List>
        <CodeBlock.Copy />
      </CodeBlock.Header>

      {TABS.map((t) => (
        <CodeBlock.Content
          key={t.value}
          value={t.value}
          language="tsx"
          code={code(t.value)}
        />
      ))}
    </CodeBlock.Tabs>
  );
};
