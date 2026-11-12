"use client";

import { PullQuote } from "@/components/pull-quote";
import { importBlock } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const imports = (mode: Mode) =>
  importBlock({ mode, component: "PullQuote", componentId: "pull-quote", registryOnly: true });

const QUOTE = "The best interface is the one you never have to think about.";

/** The decorative open-quote glyph, as the styled wrapper draws it. */
const MARK =
  '<svg class="primitiv-pull-quote__mark" viewBox="0 0 32.878391265869 28" fill="currentColor" aria-hidden="true"><path d="M 18.040161745677782 18.159909783623053 C 18.040161745677782 14.20304999490889 19.081441216047338 10.727781748760497 21.16400071537211 7.734103741811266 C 23.246558538939876 4.7404257348620344 26.13610694193496 2.176275028529099 29.832648531090484 0.041652286132966586 C 29.988839941936494 -0.06247739639778196 30.249160240105333 0.028634149859709856 30.61360790112362 0.3149868899938364 C 30.978055562141904 0.601339630127963 31.238377280049324 0.8486440884291154 31.394570250280328 1.0569003579949092 C 31.550761661126337 1.265156627560703 31.719968990873873 1.590556043593942 31.90219205332772 2.0330986759178384 C 32.08441666352936 2.475641308241735 32.09743083685067 2.722944247888041 31.941239426004664 2.7750075355869623 C 30.43138394260526 3.7121591310619713 28.97359255375123 5.0007432381606165 27.567865166344962 6.640760136175743 C 26.16213936159809 8.280773868871956 25.459277250554354 10.142060709859209 25.459277250554354 12.224620286747038 C 25.459277250554354 12.849385953399908 25.498324437036075 13.291928585723804 25.57641936858518 13.552248137169919 C 25.654515853700683 13.812567688616033 25.797693143592788 13.942727836729551 26.005949405402266 13.942727836729551 C 26.162140816248275 13.942727836729551 26.33134814599581 13.903680584788946 26.513571208449658 13.825587203897715 C 26.6957958186513 13.74749071587358 26.917068918701222 13.708442102380351 27.17738846045197 13.708442102380351 C 28.68724394385137 13.708442102380351 30.014873792975408 14.242098393113883 31.16028005597153 15.30940976431195 C 32.30568790162705 16.376719645948175 32.87839126586914 18.055781218263686 32.87839126586914 20.346595505332257 C 32.87839126586914 22.272962047985807 32.21457634130712 24.030122371761227 30.88694546810936 25.61807442851098 C 29.559314594911598 27.20602499569889 27.854218710418237 28 25.771659211093464 28 C 23.428781845774953 28 21.55448002799823 27.062847566646454 20.14875264059196 25.188544375696434 C 18.743025253185692 23.314242674308257 18.040161745677782 20.971364663145696 18.040161745677782 18.159909783623053 Z M 0 18.159909783623053 C 0 14.20304999490889 1.0412792841743292 10.727781748760497 3.1238374801325413 7.734103741811266 C 5.206396048481199 4.7404257348620344 8.095945941038067 2.176275028529099 11.7924867854127 0.041652286132966586 C 11.948678975951207 -0.06247739639778196 12.208998494427552 0.028634149859709856 12.573446155445836 0.3149868899938364 C 12.93789381646412 0.601339630127963 13.198213334940464 0.8486440884291154 13.35440552547897 1.0569003579949092 C 13.51059693632498 1.265156627560703 13.67980498757901 1.590556043593942 13.862028818088152 2.0330986759178384 C 14.044252648597295 2.475641308241735 14.05726909117289 2.722944247888041 13.90107768032688 2.7750075355869623 C 12.39122294170837 3.7121591310619713 10.933431552854342 5.0007432381606165 9.527704165448073 6.640760136175743 C 8.121977522822696 8.280773868871956 7.419114760095679 10.142060709859209 7.419114760095679 12.224620286747038 C 7.419114760095679 12.849385953399908 7.458162662265287 13.291928585723804 7.5362583676882915 13.552248137169919 C 7.614354073111296 13.812567688616033 7.757529908353218 13.942727836729551 7.965786170162695 13.942727836729551 C 8.121978360701203 13.942727836729551 8.291186377043626 13.903680584788946 8.473410207552769 13.825587203897715 C 8.655634038061912 13.74749071587358 8.87690568346165 13.708442102380351 9.137225225212397 13.708442102380351 C 10.647079963830906 13.708442102380351 11.974711209419118 14.242098393113883 13.120118310293746 15.30940976431195 C 14.265525411168374 16.376719645948175 14.83822803062957 18.055781218263686 14.83822803062957 20.346595505332257 C 14.83822803062957 22.272962047985807 14.174413106067554 24.030122371761227 12.84678223286979 25.61807442851098 C 11.519151359672026 27.20602499569889 9.814056033764341 28 7.731497465415682 28 C 5.388619727706723 28 3.5143175375395552 27.062847566646454 2.108590522523733 25.188544375696434 C 0.7028635075079108 23.314242674308257 0 20.971364663145696 0 18.159909783623053 Z"/></svg>';

/**
 * One pull quote as Elements markup (RFC 0033): a `<blockquote>` with the quote
 * in its own paragraph, and with marks, `data-marks` plus the glyph before it —
 * the structure the styled wrapper renders. The glyph is written out in full,
 * long as its path is, so the code is what you paste.
 */
const html = ({ size = "md", marks = false }: { size?: string; marks?: boolean } = {}) =>
  [
    `<blockquote class="primitiv-pull-quote primitiv-pull-quote--${size}"${marks ? " data-marks" : ""}>`,
    ...(marks ? [`  ${MARK}`] : []),
    `  <p class="primitiv-pull-quote__text">${QUOTE}</p>`,
    `</blockquote>`,
  ].join("\n");

/**
 * PullQuote's page content.
 *
 * Registry-only. `size` rides the heading scale (`xs`→h5 ... `xl`→h1); `marks` is
 * a headless boolean (a decorative quotation glyph), so it is a spec-declared
 * control with its own snippet. Distinct from Blockquote: large, centred, no
 * accent bar, no attribution.
 */
export const pullQuoteSpec: ComponentSpec = {
  playground: {
    component: "PullQuote",
    fill: true,
    /* `marks` is a headless prop, not a contract modifier, so it is declared
       here and kept in the snippet by a custom writer (the generated `toJsx`
       would print `marks="true"` rather than the valueless boolean). */
    controls: [
      {
        name: "marks",
        options: ["false", "true"],
        defaultValue: "true",
        description: "Show the decorative quotation glyph above the quote.",
      },
    ],
    snippet: (values, mode) => {
      if (mode === "elements") return html({ size: values.size, marks: values.marks === "true" });
      const marks = values.marks === "true" ? " marks" : "";
      return [
        imports(mode),
        ``,
        `<PullQuote size="${values.size}"${marks}>`,
        `  ${QUOTE}`,
        `</PullQuote>`,
      ].join("\n");
    },
    render: (values) => (
      <PullQuote size={values.size as Size} marks={values.marks === "true"}>
        {QUOTE}
      </PullQuote>
    ),
  },

  examples: [
    {
      id: "editorial",
      title: "An editorial pull",
      render: () => (
        <InteractiveExample
          elementsCaption="A large, centred statement lifted out of the flow — the sentence an article is built around. Unlike Blockquote it has no accent bar and no attribution: it is a typographic moment, not a cited passage. The size class steps it along the heading scale."
          caption="A large, centred statement lifted out of the flow — the sentence an article is built around. Unlike `Blockquote` it has no accent bar and no attribution: it is a typographic moment, not a cited passage. `size` steps it along the heading scale."
          code={(_density, mode) =>
            mode === "elements" ? html({ size: "lg" }) : [
              imports(mode),
              ``,
              `<PullQuote size="lg">`,
              `  ${QUOTE}`,
              `</PullQuote>`,
            ].join("\n")
          }
        >
          {() => (
            <PullQuote size="lg" style={{ width: "100%" }}>
              {QUOTE}
            </PullQuote>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "marks",
      title: "Decorative marks",
      render: () => (
        <InteractiveExample
          elementsCaption="`data-marks` on the quote, with the glyph below placed before the text, adds an oversized quotation mark above it — the magazine treatment. The glyph carries `aria-hidden`, so it adds visual weight without changing what a screen reader reads."
          caption="`marks` adds an oversized quotation glyph above the quote — the magazine treatment. It is purely decorative and `aria-hidden`, so it adds visual weight without changing what a screen reader reads."
          code={(_density, mode) =>
            mode === "elements" ? html({ size: "lg", marks: true }) : [
              imports(mode),
              ``,
              `<PullQuote marks size="lg">`,
              `  ${QUOTE}`,
              `</PullQuote>`,
            ].join("\n")
          }
        >
          {() => (
            <PullQuote marks size="lg" style={{ width: "100%" }}>
              {QUOTE}
            </PullQuote>
          )}
        </InteractiveExample>
      ),
    },
  ],

  elements: {
    accessibility: [
      "Use a real `<blockquote>`, so the passage is announced as a quotation even though it reads visually as a heading-scale statement.",
      "Keep `aria-hidden` on the quote-mark glyph, so assistive tech skips it — the quote is read once, without a stray quotation mark spelled out.",
      "Reach for Blockquote when the quote is *cited* — a pull quote carries no attribution by design, so an unattributed editorial lift is its whole job.",
    ],
  },

  accessibility: [
    "PullQuote renders a real `<blockquote>`, so the passage is announced as a quotation even though it reads visually as a heading-scale statement.",
    "The `marks` glyph is decorative and `aria-hidden`, so it is skipped by assistive tech — the quote is read once, without a stray quotation mark spelled out.",
    "Reach for `Blockquote` when the quote is *cited* — PullQuote carries no attribution by design, so an unattributed editorial lift is its whole job.",
  ],
};
