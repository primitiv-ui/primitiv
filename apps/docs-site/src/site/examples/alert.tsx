"use client";

import { useState } from "react";

import { Alert } from "@/components/alert";
import { Stack } from "@/components/stack";
import { contractAttr, importBlock } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";
type Tone = "info" | "success" | "warning" | "danger";

const SIZES: readonly Size[] = ["xs", "sm", "md", "lg", "xl"];

const TONES: readonly { tone: Tone; title: string; body: string }[] = [
  { tone: "info", title: "Scheduled maintenance", body: "The API will be read-only on Sunday from 02:00 UTC." },
  { tone: "success", title: "Deploy complete", body: "Version 4.2.0 is live on production." },
  { tone: "warning", title: "Quota almost used", body: "You have used 92% of this month's build minutes." },
  { tone: "danger", title: "Payment failed", body: "Your card was declined. Try a different payment method." },
];

const imports = (mode: Mode) => importBlock({ mode, component: "Alert", componentId: "alert" });
const stackImports = (mode: Mode) => importBlock({ mode, component: "Stack", componentId: "stack" });

/**
 * One alert, per mode.
 *
 * The two surfaces are further apart here than anywhere else on the site, and it
 * is worth being blunt in the snippet: the headless `Alert` is a bare
 * `<div role="alert">` that takes `children` and `asChild` and NOTHING else. No
 * `tone`, no `title`, no icon, no dismiss — those are the copied file's own API,
 * and under Headless you build that anatomy yourself. So the Headless branch
 * cannot show a `tone` prop that does not exist.
 */
const alertLines = (
  mode: Mode,
  { title, body }: { title?: string; body: string },
  { attrs = "", indent = "" }: { attrs?: string; indent?: string } = {},
) => {
  if (mode === "headless") {
    return [
      `${indent}<Alert${attrs}>`,
      ...(title ? [`${indent}  {/* your own icon / title anatomy goes here */}`, `${indent}  <strong>${title}</strong>`] : []),
      `${indent}  ${body}`,
      `${indent}</Alert>`,
    ];
  }
  const t = title ? ` title="${title}"` : "";
  return [`${indent}<Alert${attrs}${t}>`, `${indent}  ${body}`, `${indent}</Alert>`];
};

/** The dismissible example's live half. */
const DismissExample = () => {
  const [shown, setShown] = useState(true);

  return shown ? (
    <Alert tone="success" onDismiss={() => setShown(false)}>
      Changes saved. Dismiss this to hide it.
    </Alert>
  ) : (
    <p className="docs-example-caption">
      Dismissed —{" "}
      <button type="button" className="docs-example-reset" onClick={() => setShown(true)}>
        bring it back
      </button>
    </p>
  );
};

/**
 * Alert's page content.
 *
 * The headline is that this is an **assertive live region**, which is a
 * behavioural fact no props table can carry and the single most misusable thing
 * about the component: `role="alert"` interrupts whatever a screen reader is
 * saying, so an Alert used for ordinary page furniture talks over the user. The
 * page has to say when NOT to reach for it.
 *
 * Second: `onDismiss` is the switch for the dismiss button's existence, not a
 * handler bolted onto a button that is always there. And it does not hide
 * anything itself — the caller owns that.
 */
export const alertSpec: ComponentSpec = {
  playground: {
    component: "Alert",
    controls: [
      {
        name: "dismissible",
        options: ["false", "true"],
        defaultValue: "false",
        description:
          "Renders the dismiss button. It exists only when `onDismiss` is supplied — there is no separate boolean.",
      },
    ],
    snippet: (values, mode) =>
      [
        imports(mode),
        ``,
        ...alertLines(
          mode,
          { title: "Payment failed", body: "Your card was declined. Try a different payment method." },
          {
            attrs:
              `${contractAttr({ mode, prop: "tone", value: values.tone })}` +
              `${contractAttr({ mode, prop: "size", value: values.size })}` +
              `${values.dismissible === "true" ? " onDismiss={() => setShown(false)}" : ""}`,
          },
        ),
      ].join("\n"),
    render: (values) => (
      <div className="docs-example-stack">
        <Alert
          tone={values.tone as Tone}
          size={values.size as Size}
          title="Payment failed"
          {...(values.dismissible === "true" ? { onDismiss: () => undefined } : {})}
        >
          Your card was declined. Try a different payment method.
        </Alert>
      </div>
    ),
  },

  anatomyMeta:
    "The widest gap between the two surfaces on the site, and it is not a rename. `@primitiv-ui/react` exports a single `Alert` that is a bare `<div role=\"alert\">` taking only `children` and `asChild` — it supplies the live region and nothing else. Every prop documented below (`tone`, `title`, `icon`, `onDismiss`, `dismissLabel`) belongs to the copied file, which builds the icon, the title, the description and the dismiss button around that region. Under Headless there is no `tone` to pass; you compose the anatomy yourself.",

  anatomy: [
    {
      label: "Parts",
      code: (mode) =>
        alertLines(mode, { title: "Payment failed", body: "Your card was declined." }, {
          attrs: mode === "headless" ? "" : ` tone="danger"`,
        }).join("\n"),
    },
  ],

  examples: [
    {
      id: "assertive",
      title: "It interrupts (the headline)",
      render: () => (
        <InteractiveExample
          caption="`Alert` is an **assertive live region** — `role=&quot;alert&quot;`, which implies `aria-live=&quot;assertive&quot;` and `aria-atomic=&quot;true&quot;`. A screen reader abandons whatever it was saying and reads the alert immediately. That is right for a failed payment and wrong for a page banner about next Sunday's maintenance, so reach for it only when the message is genuinely time-sensitive and the user must know now. For anything calmer, render your own container with `role=&quot;status&quot;` (polite), or no role at all if there is nothing to announce because the content was there when the page loaded. The headless primitive injects its children **after** the region is in the DOM, which is what makes the announcement fire at all — a live region that is added already-populated is frequently not announced."
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `{/* Assertive: interrupts. Only for "you must know this now". */}`,
              ...alertLines(
                mode,
                { title: "Payment failed", body: "Your card was declined." },
                { attrs: mode === "headless" ? "" : ` tone="danger"` },
              ),
              ``,
              `{/* Calmer alternative — not this component. */}`,
              `<div role="status">Draft saved.</div>`,
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <Alert tone="danger" title="Payment failed">
                Your card was declined. Try a different payment method.
              </Alert>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "tones",
      title: "Tones",
      render: () => (
        <InteractiveExample
          caption="Four tones, and each one **also picks the leading icon** — an info circle, a success check, a warning triangle, a danger x-circle — so `tone` is one decision rather than a colour plus a matching glyph. Override the glyph with `icon` when the default is wrong for the message; the tone's colour stays. Note that tone is purely visual: all four are the same assertive live region, so a `success` alert interrupts exactly as a `danger` one does. Colour is not the message either — the text has to carry it for anyone who cannot see the tone."
          code={(_density, mode) =>
            [
              imports(mode),
              stackImports(mode),
              ``,
              `<Stack gap="md">`,
              ...TONES.flatMap((t) =>
                alertLines(mode, { title: t.title, body: t.body }, {
                  attrs: contractAttr({ mode, prop: "tone", value: t.tone }),
                  indent: "  ",
                }),
              ),
              `</Stack>`,
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <Stack gap="md">
                {TONES.map((t) => (
                  <Alert key={t.tone} tone={t.tone} title={t.title}>
                    {t.body}
                  </Alert>
                ))}
              </Stack>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "title-optional",
      title: "With and without a title",
      render: () => (
        <InteractiveExample
          caption="`title` is optional, and leaving it off is the headless primitive's own simplest shape — one line of message beside the icon. Use a title when the alert has both a summary and a detail worth separating; skip it when the whole message is one sentence, because a title that just restates the sentence reads as a stutter. `children` is always required: it is the message, not a slot you can leave empty."
          code={(_density, mode) =>
            [
              imports(mode),
              stackImports(mode),
              ``,
              `<Stack gap="md">`,
              ...alertLines(mode, { body: "Changes saved." }, {
                attrs: contractAttr({ mode, prop: "tone", value: "success" }),
                indent: "  ",
              }),
              ...alertLines(
                mode,
                { title: "Quota almost used", body: "You have used 92% of this month's build minutes." },
                { attrs: contractAttr({ mode, prop: "tone", value: "warning" }), indent: "  " },
              ),
              `</Stack>`,
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <Stack gap="md">
                <Alert tone="success">Changes saved.</Alert>
                <Alert tone="warning" title="Quota almost used">
                  You have used 92% of this month&apos;s build minutes.
                </Alert>
              </Stack>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "dismissible",
      title: "Dismissing",
      render: () => (
        <InteractiveExample
          caption="**`onDismiss` is what makes the dismiss button exist** — there is no `dismissible` boolean, because a dismiss control with nothing listening is a button that does nothing. Two consequences worth planning for. It does not hide the alert for you: the callback is yours, and so is the state that unmounts it, which is what lets you persist the dismissal or animate the exit. And the button is a real `Button` (`ghost` variant) instance rather than a bare glyph, so it inherits the focus ring and hit area — matching the Modal close convention. Rename it with `dismissLabel` when &quot;Dismiss&quot; is not specific enough."
          code={(_density, mode) =>
            [
              `import { useState } from "react";`,
              imports(mode),
              ``,
              `const [shown, setShown] = useState(true);`,
              ``,
              `{shown && (`,
              ...alertLines(mode, { body: "Changes saved." }, {
                attrs:
                  `${contractAttr({ mode, prop: "tone", value: "success" })}` +
                  ` onDismiss={() => setShown(false)}`,
                indent: "  ",
              }),
              `)}`,
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <DismissExample />
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "sizes",
      title: "Sizes and density",
      render: () => (
        <InteractiveExample
          caption="Five sizes, each rescaling again with the nearest `data-density` ancestor. Size moves the padding, the icon, the type ramp and the dismiss button together, so the alert stays proportionate rather than growing a large icon beside small text."
          code={(density, mode) =>
            [
              imports(mode),
              stackImports(mode),
              ``,
              `<div data-density="${density}">`,
              `  <Stack gap="md">`,
              ...SIZES.flatMap((s) =>
                alertLines(mode, { title: s.toUpperCase(), body: "Your card was declined." }, {
                  attrs: contractAttr({ mode, prop: "size", value: s }),
                  indent: "    ",
                }),
              ),
              `  </Stack>`,
              `</div>`,
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <Stack gap="md">
                {SIZES.map((size) => (
                  <Alert key={size} size={size} title={size.toUpperCase()}>
                    Your card was declined. Try a different payment method.
                  </Alert>
                ))}
              </Stack>
            </div>
          )}
        </InteractiveExample>
      ),
    },
  ],

  accessibility: [
    "**Assertive by construction.** `role=\"alert\"` implies `aria-live=\"assertive\"` and `aria-atomic=\"true\"`, so the alert interrupts a screen reader mid-sentence and is read as a whole. That is the right behaviour for an error the user must act on, and the wrong behaviour for standing page furniture. `role` is set internally and passing your own is ignored — if you want a polite region, this is not the component.",
    "**It has to arrive, or change, to be announced.** A live region that is already on the page at load is not announced, so an Alert rendered with the initial HTML says nothing. Mount it in response to the event it describes. The headless primitive helps here by injecting its children after the region is in the DOM, which is the difference between a reliable announcement and a silent one.",
    "Do not stack several alerts at once. Each one interrupts, so three appearing together produce three interruptions and the user hears fragments of all of them. Prefer one alert that states the situation.",
    "`tone` is visual only — all four announce identically, and colour is not available to every reader. Put the severity in the words: \"Payment failed\" rather than a red alert reading \"Card declined\".",
    "The dismiss button is a real `Button` instance with an accessible name, defaulting to \"Dismiss\". When a page can show more than one alert, give each a specific `dismissLabel` — several buttons all called \"Dismiss\" are indistinguishable in a screen reader's element list.",
    "Dismissing is not the same as resolving. `onDismiss` fires and the caller unmounts; nothing announces that the alert has gone, so if the underlying problem persists, do not let a dismissal imply it is fixed.",
    "A `title` is styled text, not a heading — it emits no `<h*>` and enters no document outline. That is deliberate for an interrupting region, and it is why the whole alert is announced atomically rather than as a heading followed by prose.",
  ],
};
