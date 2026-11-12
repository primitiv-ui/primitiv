// Plain HTML: Split Button markup a server could have sent, plus one import.
import "@primitiv-ui/web/define/split-button";

import { splitButtonFixtureFromUrl, splitButtonHtml } from "./split-button-fixture";

const fixture = splitButtonFixtureFromUrl();
const app = document.getElementById("app") as HTMLElement;
app.innerHTML = splitButtonHtml(fixture);
