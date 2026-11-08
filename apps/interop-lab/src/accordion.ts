// Plain HTML: Accordion markup a server could have sent, plus one import.
import "@primitiv-ui/web/define/accordion";

import { accordionFixtureFromUrl, accordionHtml } from "./accordion-fixture";

const fixture = accordionFixtureFromUrl();
const app = document.getElementById("app") as HTMLElement;
if (fixture.dir) app.dir = fixture.dir;
app.innerHTML = accordionHtml(fixture);
