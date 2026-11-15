// HTMX: nothing re-renders the elements on HTMX's behalf, so every swap below
// leans on the elements' own lifecycle (RFC 0033 §5.4, §7.4) — the Tabs cases,
// run against Stepper.
import "@primitiv-ui/web/define";

import htmx from "htmx.org";

import { stepperHtml } from "./stepper-fixture";

(window as unknown as { htmx: typeof htmx }).htmx = htmx;

const set = (id: string, html: string) => {
  (document.getElementById(id) as HTMLElement).innerHTML = html;
};

// 2: an outer stepper whose current panel will receive a nested one.
set(
  "outer-region",
  stepperHtml({ value: "billing" }, "outer", "Outer progress").replace(
    '<primitiv-stepper-panel value="billing">',
    '<primitiv-stepper-panel value="billing" id="outer-panel">',
  ),
);
// 3: a stepper whose third step arrives out of band.
set(
  "oob-region",
  stepperHtml({ value: "account" }, "oob", "Out-of-band progress")
    .replace(/<primitiv-stepper-step value="review">.*?<\/primitiv-stepper-step>/, "")
    .replace(/<primitiv-stepper-panel value="review" hidden>.*?<\/primitiv-stepper-panel>/, ""),
);
// 4: the stepper the server re-renders.
set("rerender-region", stepperHtml({ value: "account" }, "rerendered", "Re-rendered progress"));
// 5: a preserved stepper inside a region that gets swapped.
set(
  "preserve-region",
  stepperHtml({ value: "account" }, "preserved", "Preserved progress").replace("<primitiv-stepper ", '<primitiv-stepper hx-preserve="true" '),
);
// 6: the stepper whose step history restore must bring back.
set("history-region", stepperHtml({ value: "account" }, "history", "History progress"));
// 7: the review panel loads its content the first time its step is reached.
set(
  "lazy-region",
  stepperHtml({ value: "account" }, "lazy", "Lazy progress").replace(
    '<primitiv-stepper-panel value="review" hidden>Review panel',
    '<primitiv-stepper-panel value="review" hidden hx-get="/fragments/stepper-lazy" hx-trigger="primitiv-stepper-show once">Loading…',
  ),
);
// 8: posts each change of step; vetoes leaving for review.
set(
  "echo-region",
  stepperHtml({ value: "account" }, "echo", "Echo progress").replace(
    "<primitiv-stepper ",
    `<primitiv-stepper hx-get="/fragments/stepper-echo" hx-trigger="primitiv-stepper-change" hx-target="#echo-target" hx-vals='js:{value: event.detail.value}' hx-on:primitiv-stepper-change="if (event.detail.value === 'review') event.preventDefault()" `,
  ),
);

htmx.process(document.body);
