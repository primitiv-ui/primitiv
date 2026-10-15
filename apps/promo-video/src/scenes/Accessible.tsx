import { useLayoutEffect, useRef } from "react";

import { Button } from "@components/button";
import { Card, CardContent } from "@components/card";
import { Checkbox } from "@components/checkbox";
import { Field, FieldLabel } from "@components/field";
import { Input } from "@components/input";
import { Kbd } from "@components/kbd";
import { SegmentedControl, SegmentedControlItem } from "@components/segmented-control";
import { Switch } from "@components/switch";

import { easeInCubic, easeOutCubic, progress, spring } from "../lib/time";
import { DensityScope } from "../scopes";
import { useTime } from "../timeline";
import { fadeStyle, Header } from "../ui";

export const A11Y_START = 41.6;
export const A11Y_END = 46.45;
const OUT = 4.6;

type Press = { at: number; key: string; focus?: string };
const PRESSES: Press[] = [
  { at: 0.95, key: "Tab", focus: "name" },
  { at: 1.6, key: "Tab", focus: "summary" },
  { at: 2.05, key: "Space" },
  { at: 2.5, key: "Tab", focus: "mfa" },
  { at: 2.95, key: "Space" },
  { at: 3.4, key: "Tab", focus: "role" },
  { at: 3.85, key: "→" },
  { at: 4.25, key: "Tab", focus: "create" },
];

const NAME = "Acme Ops";

/** 41.6–46.45s: a keyboard-only pass through a real form. */
export const Accessible = () => {
  const t = useTime();
  const root = useRef<HTMLDivElement>(null);

  const last = [...PRESSES].reverse().find((p) => t >= p.at);
  const focusKey = [...PRESSES].reverse().find((p) => t >= p.at && p.focus)?.focus;
  const typed = NAME.slice(0, Math.round(progress(t, 1.05, 1.45) * NAME.length));
  const summary = t >= 2.05;
  const mfa = t >= 2.95;
  const role = t >= 3.85 ? "editor" : "owner";

  // Real focus, real :focus-visible rings — the components' own.
  useLayoutEffect(() => {
    const target = focusKey
      ? root.current?.querySelector<HTMLElement>(
          focusKey === "role" ? `[data-focus="role"] [data-state="on"], [data-focus="role"] [aria-checked="true"]` : `[data-focus="${focusKey}"]`,
        )
      : null;
    if (target && document.activeElement !== target) target.focus({ focusVisible: true } as FocusOptions);
    if (!target && document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });

  const press = last ? Math.sin(Math.PI * progress(t, last.at - 0.08, last.at + 0.14)) : 0;
  const cardIn = spring(t - 0.15, { stiffness: 170, damping: 21 });
  const cardOut = easeInCubic(progress(t, OUT, OUT + 0.4));

  return (
    <>
      <Header
        overline="Accessibility"
        headline={"Accessible\nby *default.*"}
        sub="WAI-ARIA patterns, full keyboard support, and focus you can always see."
        at={0}
        out={OUT}
      />
      <div
        ref={root}
        className="v-stage"
        style={{
          top: 222,
          opacity: Math.min(1, cardIn * 1.5) * (1 - cardOut),
          transform: `translateX(${(1 - cardIn) * 80 - cardOut * 60}px)`,
        }}
      >
        <DensityScope from="comfortable">
          <Card className="v-card">
            <CardContent>
              <div className="v-col">
                <Field size="sm">
                  <FieldLabel>Workspace name</FieldLabel>
                  <Input size="sm" data-focus="name" value={typed} placeholder="e.g. Acme Ops" readOnly />
                </Field>
                <Checkbox size="sm" data-focus="summary" checked={summary} onCheckedChange={() => {}}>
                  Email me a weekly summary
                </Checkbox>
                <Switch size="sm" data-focus="mfa" checked={mfa} onCheckedChange={() => {}}>
                  Require two-factor sign-in
                </Switch>
                <div data-focus="role">
                  <SegmentedControl size="sm" value={role} onValueChange={() => {}} aria-label="Default role">
                    <SegmentedControlItem value="owner">Owner</SegmentedControlItem>
                    <SegmentedControlItem value="editor">Editor</SegmentedControlItem>
                    <SegmentedControlItem value="viewer">Viewer</SegmentedControlItem>
                  </SegmentedControl>
                </div>
                <div className="v-row" style={{ justifyContent: "flex-end" }}>
                  <Button size="sm" variant="ghost">
                    Cancel
                  </Button>
                  <Button size="sm" data-focus="create">
                    Create workspace
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </DensityScope>
      </div>

      <div
        className="v-stage"
        style={{
          top: 540,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          ...fadeStyle(t, 0.6, OUT, { dist: 10 }),
        }}
      >
        <span className="v-mode-label">keyboard only</span>
        <DensityScope from="spacious">
          <div
            style={{
              transform: `translateY(${press * 3}px) scale(${1 - press * 0.06})`,
              filter: `drop-shadow(0 0 ${press * 14}px color-mix(in oklch, var(--primitiv-color-brand-400) 80%, transparent))`,
            }}
          >
            <Kbd size="xl" style={{ minWidth: 72, justifyContent: "center" }}>
              {last?.key ?? "Tab"}
            </Kbd>
          </div>
        </DensityScope>
        <span
          className="v-mode-label"
          style={{ opacity: 1 - easeOutCubic(progress(t, 0.6, 0.9)) * 0 }}
        >
          {PRESSES.filter((p) => t >= p.at).length} / {PRESSES.length}
        </span>
      </div>
    </>
  );
};
