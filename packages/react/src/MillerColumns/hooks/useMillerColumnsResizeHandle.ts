import { MillerColumnsResizeController } from "@primitiv-ui/web";
import {
  KeyboardEvent,
  PointerEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import type { MillerColumnsResizeHandleProps } from "../types";

import { useMillerColumnsContext } from "./useMillerColumnsContext";
import { useMillerColumnsColumnContext } from "./useMillerColumnsColumnContext";

export function useMillerColumnsResizeHandle({
  onPointerDown,
  onKeyDown,
  minWidth = 0,
  maxWidth = Number.POSITIVE_INFINITY,
  step = 10,
  ...rest
}: MillerColumnsResizeHandleProps) {
  const { columnWidths, setColumnWidth, dir } = useMillerColumnsContext();
  const { depth } = useMillerColumnsColumnContext();

  const handleRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  // The column's rendered width before anything resizes it. Tracked so
  // `aria-valuenow` is truthful from the first render — a splitter whose
  // value only appears after the first drag announces nothing until then.
  const [measured, setMeasured] = useState(0);

  // The resized width wins; otherwise the column is still sized by CSS.
  const width = columnWidths.get(depth) ?? measured;

  // Stryker disable ArrayDeclaration: equivalent — any constant dependency list runs this once, as `[]` does.
  useLayoutEffect(() => {
    // The handle only renders inside a Column, which context enforces, so the
    // ref is set and the column ancestor is always there.
    const column = handleRef.current!.closest<HTMLElement>(
      "[data-miller-columns-column]",
    )!;
    const measure = () => setMeasured(column.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(column);
    return () => observer.disconnect();
  }, []);
  // Stryker restore ArrayDeclaration

  // ── The adapter (RFC 0033 §3.4, D28) ────────────────────────────────────
  // The splitter's keymap and the pointer drag (tracked on `window`, for the
  // drag's lifetime only) run in the web implementation's
  // MillerColumnsResizeController, the same code the elements run. React keeps
  // the widths; the controller reads them through `latest`.
  const snapshot = { columnWidths, setColumnWidth, dir, depth, width, minWidth, maxWidth, step };
  const latest = useRef(snapshot);
  latest.current = snapshot;
  const controllerRef = useRef<MillerColumnsResizeController | null>(null);
  controllerRef.current ??= new MillerColumnsResizeController({
    // The resized width, else the column's rendered width as last measured —
    // where both a key press and a drag start from.
    width: () => latest.current.width,
    bounds: () => ({
      min: latest.current.minWidth,
      max: latest.current.maxWidth,
      step: latest.current.step,
    }),
    dir: () => latest.current.dir,
    setWidth: (next) => latest.current.setColumnWidth(latest.current.depth, next),
    dragging: setDragging,
  });
  const controller = controllerRef.current;

  // A drag tracks the pointer on window, so it must not outlive the handle.
  // Stryker disable next-line ArrayDeclaration: equivalent — the controller is created once per mount, so `[controller]` never changes, as `[]` does not.
  useEffect(() => () => controller.disconnect(), [controller]);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    onPointerDown?.(event);
    controller.pointerdown(event);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    controller.keydown(event);
  }

  return {
    handleProps: {
      ref: handleRef,
      role: "separator" as const,
      "aria-orientation": "vertical" as const,
      tabIndex: 0,
      "aria-valuenow": Math.round(width),
      "aria-valuemin": minWidth,
      ...(Number.isFinite(maxWidth) ? { "aria-valuemax": maxWidth } : {}),
      "data-miller-columns-resize-handle": "",
      ...(dragging ? { "data-dragging": "" } : {}),
      onPointerDown: handlePointerDown,
      onKeyDown: handleKeyDown,
      ...rest,
    },
  };
}
