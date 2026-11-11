// Plain HTML: Checkbox Card markup a server could have sent, plus one import.
import "@primitiv-ui/web/define/checkbox-card";

import { checkboxCardFixtureFromUrl, checkboxCardHtml } from "./checkbox-card-fixture";

const fixture = checkboxCardFixtureFromUrl();
const app = document.getElementById("app") as HTMLElement;
app.innerHTML = checkboxCardHtml(fixture);
