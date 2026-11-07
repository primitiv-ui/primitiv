// Plain HTML: markup a server could have sent, plus one import.
import "@primitiv-ui/web/define";

import { fixtureFromUrl, tabsHtml } from "./fixture";

const fixture = fixtureFromUrl();
const app = document.getElementById("app") as HTMLElement;
if (fixture.dir) app.dir = fixture.dir;
app.innerHTML = tabsHtml(fixture);
