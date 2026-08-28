"use client";

import type { ComponentId } from "@/lib/docs-data";

import { alertSpec } from "./alert";
import { badgeSpec } from "./badge";
import { buttonSpec } from "./button";
import { inputSpec } from "./input";
import { accordionSpec } from "./accordion";
import { checkboxCardSpec } from "./checkbox-card";
import { checkboxSpec } from "./checkbox";
import { emptyStateSpec } from "./empty-state";
import { fieldSpec } from "./field";
import { inputGroupSpec } from "./input-group";
import { modalSpec } from "./modal";
import { progressSpec } from "./progress";
import { radioCardSpec } from "./radio-card";
import { radioSpec } from "./radio";
import { segmentedControlSpec } from "./segmented-control";
import { selectSpec } from "./select";
import { sliderSpec } from "./slider";
import { switchSpec } from "./switch";
import { textareaSpec } from "./textarea";
import { tabsSpec } from "./tabs";
import { toggleGroupSpec } from "./toggle-group";
import { dividerSpec } from "./divider";
import { boxSpec } from "./box";
import { stackSpec } from "./stack";
import { gridSpec } from "./grid";
import { containerSpec } from "./container";
import { centerSpec } from "./center";
import { spacerSpec } from "./spacer";
import { aspectRatioSpec } from "./aspect-ratio";
import { kbdSpec } from "./kbd";
import { inlineCodeSpec } from "./inline-code";
import { blockquoteSpec } from "./blockquote";
import { pullQuoteSpec } from "./pull-quote";
import { proseSpec } from "./prose";
import { listSpec } from "./list";
import { descriptionListSpec } from "./description-list";
import { figureSpec } from "./figure";
import { codeBlockSpec } from "./code-block";
import type { ComponentSpec } from "./types";

/**
 * The bespoke half of every component page, keyed by the same id as the
 * generated docs-data. Adding a component page is: generate its docs-data, add
 * a spec, add one line here.
 */
export const SPECS: Record<ComponentId, ComponentSpec> = {
  alert: alertSpec,
  badge: badgeSpec,
  button: buttonSpec,
  input: inputSpec,
  accordion: accordionSpec,
  checkbox: checkboxSpec,
  "checkbox-card": checkboxCardSpec,
  "empty-state": emptyStateSpec,
  field: fieldSpec,
  "input-group": inputGroupSpec,
  modal: modalSpec,
  progress: progressSpec,
  radio: radioSpec,
  "radio-card": radioCardSpec,
  "segmented-control": segmentedControlSpec,
  select: selectSpec,
  slider: sliderSpec,
  switch: switchSpec,
  textarea: textareaSpec,
  tabs: tabsSpec,
  "toggle-group": toggleGroupSpec,
  divider: dividerSpec,
  box: boxSpec,
  stack: stackSpec,
  grid: gridSpec,
  container: containerSpec,
  center: centerSpec,
  spacer: spacerSpec,
  "aspect-ratio": aspectRatioSpec,
  kbd: kbdSpec,
  "inline-code": inlineCodeSpec,
  blockquote: blockquoteSpec,
  "pull-quote": pullQuoteSpec,
  prose: proseSpec,
  list: listSpec,
  "description-list": descriptionListSpec,
  figure: figureSpec,
  "code-block": codeBlockSpec,
};

export type { ComponentSpec };
