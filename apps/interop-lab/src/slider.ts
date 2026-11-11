// Plain HTML: Slider markup a server could have sent, plus one import.
import "@primitiv-ui/web/define/slider";

import { sliderFixtureFromUrl, sliderHtml } from "./slider-fixture";

const fixture = sliderFixtureFromUrl();
const app = document.getElementById("app") as HTMLElement;
if (fixture.dir) app.dir = fixture.dir;
app.innerHTML = sliderHtml(fixture);
