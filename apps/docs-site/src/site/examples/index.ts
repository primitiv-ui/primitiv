"use client";

import type { ComponentId } from "@/lib/docs-data";

import { buttonSpec } from "./button";
import { selectSpec } from "./select";
import type { ComponentSpec } from "./types";

/**
 * The bespoke half of every component page, keyed by the same id as the
 * generated docs-data. Adding a component page is: generate its docs-data, add
 * a spec, add one line here.
 */
export const SPECS: Record<ComponentId, ComponentSpec> = {
  button: buttonSpec,
  select: selectSpec,
};

export type { ComponentSpec };
