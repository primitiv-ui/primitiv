"use client";

import type { ComponentId } from "@/lib/docs-data";

import { badgeSpec } from "./badge";
import { buttonSpec } from "./button";
import { inputSpec } from "./input";
import { checkboxSpec } from "./checkbox";
import { modalSpec } from "./modal";
import { selectSpec } from "./select";
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
  checkbox: checkboxSpec,
  modal: modalSpec,
  select: selectSpec,
  tabs: tabsSpec,
};

export type { ComponentSpec };
