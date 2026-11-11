/** The slider the Slider pages render, read from the URL so one spec drives each page. */
export type SliderFixture = {
  /** Space-separated values, one per thumb. */
  value: string | null;
  orientation: string | null;
  dir: string | null;
  disabled: boolean;
  name: string | null;
};

export function sliderFixtureFromUrl(search: string = location.search): SliderFixture {
  const params = new URLSearchParams(search);
  return {
    value: params.get("value"),
    orientation: params.get("orientation"),
    dir: params.get("dir"),
    disabled: params.has("disabled"),
    name: params.get("name"),
  };
}

/**
 * The plain-HTML rendering, as a server would send it, shared by the html page
 * and the HTMX fragments. The page gives the parts their boxes inline (the lab
 * loads no stylesheet), so a press lands where the values say.
 */
export function sliderHtml(fixture: Partial<SliderFixture> = {}, id = "slider"): string {
  const value = fixture.value ?? "40";
  const { orientation, disabled, name } = fixture;
  const vertical = orientation === "vertical";
  const attrs = [
    `id="${id}"`,
    `value="${value}"`,
    orientation ? `orientation="${orientation}"` : "",
    disabled ? "disabled" : "",
    name ? `name="${name}"` : "",
    `style="display:block;position:relative;${vertical ? "width:20px;height:200px" : "width:200px;height:20px"}"`,
  ]
    .filter(Boolean)
    .join(" ");
  const thumbs = value
    .split(" ")
    .map(
      (_, index) =>
        `<primitiv-slider-thumb aria-label="${id} thumb ${index + 1}" style="display:block;width:12px;height:12px;background:#333"></primitiv-slider-thumb>`,
    )
    .join("");
  return (
    `<primitiv-slider ${attrs}><primitiv-slider-track style="display:block;position:absolute;inset:0;background:#ddd">` +
    `<primitiv-slider-range style="display:block;background:#36c;top:0;bottom:0"></primitiv-slider-range></primitiv-slider-track>${thumbs}</primitiv-slider>`
  );
}
