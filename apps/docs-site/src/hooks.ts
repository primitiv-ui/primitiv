/*
 * Headless hooks, re-exported across the client boundary.
 *
 * Separate from `@/ui` so a page can take a hook without dragging the whole
 * styled-component barrel into its module graph.
 */
"use client";

export { useMediaQuery } from "@primitiv-ui/react";
export { breakpoints } from "./styles/primitiv/breakpoints";
