/** The segmented control the SegmentedControl pages render: three segments, read from the URL so one spec drives each page. */
export const ITEMS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
] as const;

export type SegmentedControlFixture = {
  /** The selected segment, as the `value` attribute takes it. */
  value: string | null;
  orientation: string | null;
  dir: string | null;
  disabled: string[];
};

export function segmentedControlFixtureFromUrl(search: string = location.search): SegmentedControlFixture {
  const params = new URLSearchParams(search);
  return {
    value: params.get("value"),
    orientation: params.get("orientation"),
    dir: params.get("dir"),
    disabled: params.getAll("disabled"),
  };
}

/** The plain-HTML rendering, as a server would send it, shared by the html page and the HTMX fragments. */
export function segmentedControlHtml(fixture: Partial<SegmentedControlFixture> = {}, id = "control"): string {
  // `?? "day"`, not a destructuring default: a missing URL param is null.
  const value = fixture.value ?? "day";
  const { orientation, disabled = [] } = fixture;
  const attrs = [
    `id="${id}"`,
    `aria-label="Range ${id}"`,
    value ? `value="${value}"` : "",
    orientation ? `orientation="${orientation}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const items = ITEMS.map(
    (item) =>
      `<primitiv-segmented-control-item value="${item.value}"${disabled.includes(item.value) ? " disabled" : ""}>` +
      `<button type="button">${item.label}</button></primitiv-segmented-control-item>`,
  ).join("");
  return `<primitiv-segmented-control ${attrs}>${items}</primitiv-segmented-control>`;
}
