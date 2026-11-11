// Plain HTML: Radio Card markup a server could have sent, plus one import.
import "@primitiv-ui/web/define/radio-card";

import { radioCardFixtureFromUrl, radioCardHtml } from "./radio-card-fixture";

const fixture = radioCardFixtureFromUrl();
const app = document.getElementById("app") as HTMLElement;
if (fixture.dir) app.dir = fixture.dir;
app.innerHTML = radioCardHtml(fixture);
