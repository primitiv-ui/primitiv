// Plain HTML: Stepper markup a server could have sent, plus one import.
import "@primitiv-ui/web/define/stepper";

import { stepperFixtureFromUrl, stepperHtml } from "./stepper-fixture";

(document.getElementById("app") as HTMLElement).innerHTML = stepperHtml(stepperFixtureFromUrl());
