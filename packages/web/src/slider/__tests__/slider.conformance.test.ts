import { runSliderConformance } from "@primitiv-ui/conformance";

import { defineSlider } from "../elements";
import { sliderHtml } from "./slider.fixtures";

runSliderConformance(async ({ value, min, max, step, minStepsBetweenThumbs, orientation, dir, inverted, disabled, name }) => {
  defineSlider();
  const attrs = [
    min === undefined ? "" : `min="${min}"`,
    max === undefined ? "" : `max="${max}"`,
    step === undefined ? "" : `step="${step}"`,
    minStepsBetweenThumbs === undefined ? "" : `min-steps-between-thumbs="${minStepsBetweenThumbs}"`,
    orientation ? `orientation="${orientation}"` : "",
    inverted ? "inverted" : "",
    disabled ? "disabled" : "",
    name ? `name="${name}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const slider = sliderHtml({ value: value.join(" "), attrs });
  document.body.innerHTML = dir ? `<div dir="${dir}">${slider}</div>` : slider;
  await Promise.resolve();
  return () => document.body.replaceChildren();
});
