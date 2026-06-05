# @primitiv/icons

Fill-based SVG icon library for the Primitiv ecosystem. Icons inherit `currentColor`, scale via a `size` prop, and accept all native SVG attributes. Zero styles, zero runtime overhead, full tree-shaking.

## Usage

Within the Primitiv workspace, import directly — no build step required:

```tsx
import { Check } from "@primitiv/icons";

// Default size (24px)
<Check />

// Custom pixel size
<Check size={16} />

// Rem-based size
<Check size="1rem" />

// Tailwind color via currentColor inheritance
<Check className="text-green-500" />

// Accessible (not decorative)
<Check aria-label="Confirmed" />
```

## Props

All icons share the same props via `IconProps`:

| Prop | Type | Default | Description |
|---|---|---|---|
| `size` | `number \| string` | `24` | Sets both `width` and `height`. Accepts pixel numbers (`16`) or CSS strings (`"1rem"`). |
| `className` | `string` | — | Applied to the `<svg>` element. Use Tailwind's `text-*` utilities to set `currentColor`. |
| `aria-label` | `string` | — | Makes the icon accessible to screen readers. When absent the icon is `aria-hidden="true"` (decorative). |
| `fill` | `string` | `"currentColor"` | Override the fill colour directly. |
| `ref` | `Ref<SVGSVGElement>` | — | Forwarded to the underlying `<svg>` element. |

All other [SVG element attributes](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute) are accepted and forwarded.

## Icons

| Icon | Import |
|---|---|
| [ArrowLeft](src/icons/ArrowLeft.tsx) | `import { ArrowLeft } from "@primitiv/icons"` |
| [ArrowRight](src/icons/ArrowRight.tsx) | `import { ArrowRight } from "@primitiv/icons"` |
| [Bell](src/icons/Bell.tsx) | `import { Bell } from "@primitiv/icons"` |
| [Calendar](src/icons/Calendar.tsx) | `import { Calendar } from "@primitiv/icons"` |
| [Check](src/icons/Check.tsx) | `import { Check } from "@primitiv/icons"` |
| [ChevronDown](src/icons/ChevronDown.tsx) | `import { ChevronDown } from "@primitiv/icons"` |
| [ChevronLeft](src/icons/ChevronLeft.tsx) | `import { ChevronLeft } from "@primitiv/icons"` |
| [ChevronRight](src/icons/ChevronRight.tsx) | `import { ChevronRight } from "@primitiv/icons"` |
| [ChevronUp](src/icons/ChevronUp.tsx) | `import { ChevronUp } from "@primitiv/icons"` |
| [Close](src/icons/Close.tsx) | `import { Close } from "@primitiv/icons"` |
| [Copy](src/icons/Copy.tsx) | `import { Copy } from "@primitiv/icons"` |
| [Delete](src/icons/Delete.tsx) | `import { Delete } from "@primitiv/icons"` |
| [Download](src/icons/Download.tsx) | `import { Download } from "@primitiv/icons"` |
| [Edit](src/icons/Edit.tsx) | `import { Edit } from "@primitiv/icons"` |
| [Error](src/icons/Error.tsx) | `import { Error } from "@primitiv/icons"` |
| [ExternalLink](src/icons/ExternalLink.tsx) | `import { ExternalLink } from "@primitiv/icons"` |
| [Eye](src/icons/Eye.tsx) | `import { Eye } from "@primitiv/icons"` |
| [EyeOff](src/icons/EyeOff.tsx) | `import { EyeOff } from "@primitiv/icons"` |
| [File](src/icons/File.tsx) | `import { File } from "@primitiv/icons"` |
| [Filter](src/icons/Filter.tsx) | `import { Filter } from "@primitiv/icons"` |
| [Folder](src/icons/Folder.tsx) | `import { Folder } from "@primitiv/icons"` |
| [Grid](src/icons/Grid.tsx) | `import { Grid } from "@primitiv/icons"` |
| [Home](src/icons/Home.tsx) | `import { Home } from "@primitiv/icons"` |
| [Image](src/icons/Image.tsx) | `import { Image } from "@primitiv/icons"` |
| [Info](src/icons/Info.tsx) | `import { Info } from "@primitiv/icons"` |
| [Link](src/icons/Link.tsx) | `import { Link } from "@primitiv/icons"` |
| [List](src/icons/List.tsx) | `import { List } from "@primitiv/icons"` |
| [Mail](src/icons/Mail.tsx) | `import { Mail } from "@primitiv/icons"` |
| [Menu](src/icons/Menu.tsx) | `import { Menu } from "@primitiv/icons"` |
| [Minus](src/icons/Minus.tsx) | `import { Minus } from "@primitiv/icons"` |
| [Moon](src/icons/Moon.tsx) | `import { Moon } from "@primitiv/icons"` |
| [Plus](src/icons/Plus.tsx) | `import { Plus } from "@primitiv/icons"` |
| [Search](src/icons/Search.tsx) | `import { Search } from "@primitiv/icons"` |
| [Settings](src/icons/Settings.tsx) | `import { Settings } from "@primitiv/icons"` |
| [Share](src/icons/Share.tsx) | `import { Share } from "@primitiv/icons"` |
| [Sort](src/icons/Sort.tsx) | `import { Sort } from "@primitiv/icons"` |
| [Success](src/icons/Success.tsx) | `import { Success } from "@primitiv/icons"` |
| [Sun](src/icons/Sun.tsx) | `import { Sun } from "@primitiv/icons"` |
| [Upload](src/icons/Upload.tsx) | `import { Upload } from "@primitiv/icons"` |
| [User](src/icons/User.tsx) | `import { User } from "@primitiv/icons"` |
| [Warning](src/icons/Warning.tsx) | `import { Warning } from "@primitiv/icons"` |

## Adding icons from Figma

1. Export the icon at **24 × 24 px** (the `md` canonical size) as an SVG from Figma.
2. Drop the `.svg` file into `icons/svg/`, using kebab-case for the filename (e.g. `arrow-right.svg`).
3. Run the generator:

   ```sh
   pnpm generate
   ```

4. Review the generated component in `src/icons/`. The generator optimises paths via SVGO and converts hyphenated SVG attribute names to JSX camelCase. Hand-edit the output if needed — the generated files are committed source, not disposable artifacts.
5. Add a row to the **Icons** table in this README.
6. Write a smoke test in `src/icons/<Name>.test.tsx` (see `Check.test.tsx` as a template).

The five design sizes (`xs`=16, `sm`=20, `md`=24, `lg`=32, `xl`=48) are all driven by the `size` prop at runtime — only the `md` SVG needs to be exported from Figma.

## Architecture

```
icons/svg/*.svg          ← source files from Figma (committed)
    ↓  pnpm generate
src/icons/*.tsx          ← generated components (committed, reviewable)
src/IconBase.tsx         ← shared SVG wrapper (sets viewBox, fill, aria-hidden)
src/types.ts             ← IconProps interface
src/index.ts             ← re-exports everything
```

`IconBase` is exported for advanced use cases (e.g. building custom icon wrappers) but is not needed for normal icon consumption.

## Testing

```sh
# Run all icon tests once
npx vitest run

# Watch mode
npx vitest

# With coverage
npx vitest run --coverage
```
