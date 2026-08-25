"use client";

import type { ComponentId } from "@/lib/docs-data";

import { badgeSpec } from "./badge";
import { buttonSpec } from "./button";
import { inputSpec } from "./input";
import { accordionSpec } from "./accordion";
import { checkboxSpec } from "./checkbox";
import { modalSpec } from "./modal";
import { radioSpec } from "./radio";
import { selectSpec } from "./select";
import { switchSpec } from "./switch";
import { textareaSpec } from "./textarea";
import { tabsSpec } from "./tabs";
import type { ComponentSpec } from "./types";

/**
 * The bespoke half of every component page, keyed by the same id as the
 * generated docs-data. Adding a component page is: generate its docs-data, add
 * a spec, add one line here.
 */
export const SPECS: Record<ComponentId, ComponentSpec> = {
  badge: badgeSpec,
  button: buttonSpec,
  input: inputSpec,
  accordion: accordionSpec,
  checkbox: checkboxSpec,
  modal: modalSpec,
  radio: radioSpec,
  select: selectSpec,
  switch: switchSpec,
  textarea: textareaSpec,
  tabs: tabsSpec,
};

export type { ComponentSpec };
