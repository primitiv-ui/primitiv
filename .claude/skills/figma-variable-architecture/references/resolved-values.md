# Resolved values, variable IDs, and mode IDs

## framed-control resolved values per density mode

All values alias into `Primitives` (e.g. `radii/6`, `space-8`, `size-16`).
`height`, `padding-inline`, and `gap` vary across all four modes. Radii are
identical between Compact and Comfortable only — Dense uses smaller radii and
Spacious uses larger ones, so focus-ring values differ across all four modes.

### Dense

| Slot | height | padding-inline | gap | icon-size | radius | focus-ring-gap-radius | focus-ring-radius |
| ---- | ------ | -------------- | --- | --------- | ------ | --------------------- | ----------------- |
| xs   | 16     | 4              | 2   | 10        | 2      | 4                     | 6                 |
| sm   | 20     | 6              | 4   | 12        | 4      | 6                     | 8                 |
| md   | 24     | 8              | 4   | 14        | 4      | 6                     | 8                 |
| lg   | 32     | 12             | 4   | 16        | 4      | 6                     | 8                 |
| xl   | 40     | 16             | 6   | 20        | 6      | 8                     | 10                |

### Compact

| Slot | height | padding-inline | gap | icon-size | radius | focus-ring-gap-radius | focus-ring-radius |
| ---- | ------ | -------------- | --- | --------- | ------ | --------------------- | ----------------- |
| xs   | 20     | 6              | 4   | 12        | 4      | 6                     | 8                 |
| sm   | 28     | 10             | 4   | 14        | 6      | 8                     | 10                |
| md   | 32     | 12             | 4   | 16        | 6      | 8                     | 10                |
| lg   | 40     | 16             | 6   | 20        | 8      | 10                    | 12                |
| xl   | 48     | 20             | 8   | 24        | 8      | 10                    | 12                |

### Comfortable

| Slot | height | padding-inline | gap | icon-size | radius | focus-ring-gap-radius | focus-ring-radius |
| ---- | ------ | -------------- | --- | --------- | ------ | --------------------- | ----------------- |
| xs   | 24     | 8              | 4   | 12        | 4      | 6                     | 8                 |
| sm   | 32     | 12             | 4   | 14        | 6      | 8                     | 10                |
| md   | 40     | 16             | 8   | 16        | 6      | 8                     | 10                |
| lg   | 48     | 20             | 8   | 20        | 8      | 10                    | 12                |
| xl   | 56     | 24             | 12  | 24        | 8      | 10                    | 12                |

### Spacious

| Slot | height | padding-inline | gap | icon-size | radius | focus-ring-gap-radius | focus-ring-radius |
| ---- | ------ | -------------- | --- | --------- | ------ | --------------------- | ----------------- |
| xs   | 28     | 10             | 4   | 14        | 6      | 8                     | 10                |
| sm   | 40     | 14             | 6   | 16        | 8      | 10                    | 12                |
| md   | 48     | 20             | 8   | 20        | 8      | 10                    | 12                |
| lg   | 56     | 28             | 10  | 24        | 10     | 12                    | 14                |
| xl   | 68     | 32             | 12  | 28        | 12     | 14                    | 16                |

## Label typography resolved values

`label/*` variables encode the typography decisions for interactive control
labels (Button, Checkbox, Switch, Tabs, etc.) across all four density modes
and five size slots.

### font-size

| Slot | Dense | Compact | Comfortable | Spacious |
| ---- | ----- | ------- | ----------- | -------- |
| xs   | 10    | 12      | 13          | 14       |
| sm   | 11    | 14      | 16          | 18       |
| md   | 12    | 16      | 18          | 20       |
| lg   | 13    | 18      | 20          | 22       |
| xl   | 14    | 20      | 22          | 24       |

### line-height

| Slot | Dense | Compact | Comfortable | Spacious |
| ---- | ----- | ------- | ----------- | -------- |
| xs   | 12    | 16      | 20          | 20       |
| sm   | 14    | 20      | 24          | 28       |
| md   | 16    | 24      | 28          | 32       |
| lg   | 16    | 28      | 32          | 36       |
| xl   | 20    | 32      | 36          | 40       |

`font-family`, `font-weight`, and `font-style` are identical across all four
modes (sans / semibold / SemiBold). All values alias into `Primitives`
(`font-size/12`, `line-height/24`, etc.).

> **Gotcha — Comfortable and Spacious copying Compact.** When label variables
> were first created, Comfortable and Spacious were left aliasing the same
> Primitives values as Compact. The tables above reflect the corrected values
> (fixed 2026-05-29). If you bootstrap a new file or re-run the Bootstrap
> context action, verify that each mode has distinct font-size values — the
> action may need updating to match these tables.

> **`body/*` now runs xs–xl.** The body ramp originally stopped at `lg`;
> `body/xl/*` was added 2026-05-31 (font-size/line-height mirror `label/xl` per
> mode — Comfortable 22/36, Compact 20/32, Spacious 24/40, Dense 14/20 — family
> serif, weight/style regular) so form controls have a body face at every size.
> Backed up to `context.json` (`body.xl` in all four mode blocks).

## Primitives referenced by framed-control

The aliases used are all in the `Primitives` collection. Relevant IDs for scripting:

| Primitive name | Figma variable ID     | Value |
| -------------- | --------------------- | ----- |
| `radii/4`      | `VariableID:142:111`  | 4     |
| `radii/6`      | `VariableID:142:112`  | 6     |
| `radii/8`      | `VariableID:142:113`  | 8     |
| `radii/10`     | `VariableID:142:114`  | 10    |
| `radii/12`     | `VariableID:142:115`  | 12    |

## Context collection ID and modes

| | ID |
| ---- | -- |
| Collection `Context` | `VariableCollectionId:369:31958` |
| Mode: Dense          | `369:8` |
| Mode: Compact        | `369:9` |
| Mode: Comfortable    | `369:10` |
| Mode: Spacious       | `369:11` |

The collection holds all 218 variables for all densities. Variables alias into
`Primitives`; the mode determines which alias (and resolved value) is active.

> **Deprecated (do not use for new work):** The old free-tier collections
> `Context / Dense` (`341:3320`), `Context / Compact` (`341:2956`),
> `Context / Comfortable` (`340:2719`), `Context / Spacious` (`341:3138`) still
> exist and will be deleted in a future cleanup step. All component sets
> (Button, Switch, Checkbox) were migrated to the unified `Context` collection
> on 2026-05-29.
