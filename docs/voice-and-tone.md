# Primitiv — voice and tone

How Primitiv writes. A stated position on the one axis of character
`docs/character-brief.md` never covered.

> **Why this exists.** The character brief commits a position on eight
> visual axes and says outright that *"an axis without a token that
> encodes its opinion is an axis we haven't really committed to yet."*
> There was no verbal axis at all. So every sentence on the site was
> written to whatever register felt right that hour, which is exactly
> what makes prose read as machine-generated: not any single sentence,
> but the absence of a person behind the run of them.
>
> With ~10 site pages and 63 component pages to write, taste alone will
> not hold it together. This is the spec that does.

---

## 1. Who we are talking to

Three readers, one voice. The voice does not change per reader; only
which argument goes first does.

| Reader | Arrives from | Wants to know |
| --- | --- | --- |
| **Developer** | Comparing against Radix, shadcn/ui, Chakra | Is the API sane, is it accessible, can I change it |
| **Designer** | The Figma library, or a developer sent them | Does the design file match what ships |
| **Team lead / PM** | The home page, evaluating for a team | What does this save us, and what does it lock us into |

**Assume all three are competent and busy.** They are not beginners and
they are not fools. Explain the thing, never the reader.

The team lead is the only one who might not write code. That does not
license baby-talk anywhere — it means the *home page* leads with outcome
and lets the mechanism follow underneath, so both altitudes are served
in one column.

---

## 2. The eight rules

Each rule is testable. If you cannot check it, it is not a rule.

### 1. Say what it is for before what it is

Lead with the reader's situation. The construction can follow.

> ❌ *"An assertive banner for high-priority, time-sensitive messages —
> a tone-matched icon, an optional title, a description, and an optional
> dismiss button."*
>
> ✅ *"Tells someone something they need to know right now. It interrupts
> the page rather than waiting to be found."*

### 2. One idea per sentence

An em-dash or semicolon joining two complete thoughts is two sentences
wearing a trench coat. Split them.

> ❌ *"A hierarchical list of expandable branches and selectable leaves —
> the WAI-ARIA tree view, with connector guide lines and an optional
> breadcrumb of the selected node's ancestry."*
>
> ✅ *"A nested list you can open and close, like a file explorer. Guide
> lines connect each level, and it can show the path back to whatever is
> selected."*

### 3. No build notes in reader-facing prose

"Composes the headless X primitive", "over the headless Tabs", "the
control is Input verbatim", "sized xs–xl; `data-density` scales each
size further" — that is maintainer content. It belongs in the component
README and the JSDoc, where maintainers read. It does not belong in the
first thing a reader sees.

> ❌ *"Composes the registry `avatar` component; the counter is itself an
> Avatar, not a Badge."*
>
> ✅ *"Shows a few people's faces overlapping, with a +3 for anyone who
> did not fit."*

### 4. Verbs, not abstract nouns

Nouns ending in *-ion*, *-ment*, *-ance* usually hide a verb that would
read better.

| ❌ | ✅ |
| --- | --- |
| an optional dismiss affordance | you can let people close it |
| provides configuration for | you set |
| a tone-matched icon | an icon that matches the colour |
| enables the composition of | lets you build |

### 5. Second person, active voice

"You" and "your team". Never "the consumer", "the user of the library",
"one". The reader is a person, addressed directly.

> ❌ *"Filtering is consumer-owned: there is no `filter` prop."*
>
> ✅ *"You do the filtering yourself. There is no `filter` prop, because
> only you know what counts as a match in your data."*

### 6. No formula may repeat across pages

If a sentence would be byte-identical on twelve pages, it is boilerplate.
Move it to the concept page that owns it and link there once.

The current offender: *"Sized xs–xl; `data-density` scales each size
further"* appears verbatim on **12 of 63** components. It belongs on the
Density page.

### 7. At most one em-dash per paragraph, never in place of a full stop

Not banned — it is a good mark, used sparingly. But **52 of 63** current
component descriptions contain one, almost always doing a full stop's
job. That density is the single loudest reason the copy reads as
machine-written.

### 8. Read it aloud

If you stumble, run out of breath, or hear yourself performing, cut it.
This catches what the other seven miss.

---

## 3. Words and patterns we do not use

**Marketing filler.** leverage · robust · seamless · powerful ·
cutting-edge · unlock · elevate · supercharge · game-changing ·
effortless · beautiful (as a claim about our own work).

**Hedges that weaken a true claim.** simply · just · easily · basically ·
essentially. If it *is* easy, showing it is easy proves it; saying so
does not.

**Machine tells.** "It's worth noting that" · "In today's fast-paced" ·
"Whether you're X or Y" · "the perfect solution for" · a tricolon of
adjectives where one would do · opening a paragraph with "Additionally"
or "Moreover".

**Jargon a team lead would not know**, unless the sentence teaches it on
the spot: primitive · affordance · compound component · headless ·
token · registry · density. Each of these is fine — *once introduced*.
The home page introduces; component pages may assume.

---

## 4. Tone by surface

The voice is constant. The tone shifts with what the reader is doing.

| Surface | Tone | Test |
| --- | --- | --- |
| **Home page** | Confident, plain, benefit-first. Short sentences. | Would a team lead who does not code finish it? |
| **Concept pages** | Explanatory and patient. Longer paragraphs are fine. Analogies welcome. | Could someone learn this here, having not known it? |
| **Component pages** | Practical and brisk. Get out of the way of the code. | Does it answer "should I use this, and how"? |
| **Reference tables** | Terse. Fragments allowed. No personality. | Is it scannable in two seconds? |
| **Errors and empty states** | Plain and blameless. Say what happened and what to do. | Does it blame the reader? Rewrite if so. |

---

## 5. The house sentence shapes

Two patterns worth reusing, because they carry a lot and read as human.

**The component lede.** One sentence saying what it does in the reader's
words. One sentence adding the thing that is not obvious.

> *"A small pill that shows status or a count. It sits beside something
> else and is never clickable."*

**The claim-and-proof pair.** A benefit sentence, then the mechanism that
makes it true. This is the home page's whole engine — it serves the team
lead and the developer in two consecutive sentences.

> *"Your colours cannot fail a contrast check. Primitiv generates every
> shade from one brand colour and checks the contrast as it goes, so the
> palette is correct before anyone opens it."*

---

## 6. Checking work against this

1. Count em-dashes. More than one per paragraph, rewrite.
2. Search the page for the banned list in §3.
3. Find any sentence that appears on another page. Delete or link it.
4. Read it aloud, standing up.
5. Ask of the first sentence: does it say what this is *for*?
