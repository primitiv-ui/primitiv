// Plain HTML: Carousel markup a server could have sent, plus one import.
import "@primitiv-ui/web/define/carousel";

import { carouselFixtureFromUrl, carouselHtml } from "./carousel-fixture";

const fixture = carouselFixtureFromUrl();
const app = document.getElementById("app") as HTMLElement;
if (fixture.dir) app.dir = fixture.dir;
app.innerHTML = carouselHtml(fixture);
