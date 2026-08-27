/**
 * A component's display name as PROSE — `"CheckboxCard"` -> `"Checkbox Card"`.
 *
 * Deliberately separate from `displayName`, which stays PascalCase because it is
 * also the symbol: `ComponentDocsPage` prints it inside a real
 * `import { CheckboxCard } from "@primitiv-ui/react"` line, and a space there
 * would be a broken snippet. So the identifier and the label are two different
 * strings, and this is the label.
 *
 * Used for the page title, the breadcrumb, the sidebar entry and the index card
 * — everywhere the name is read as English rather than typed as code.
 *
 * The second alternative in the pattern splits an acronym from a following word
 * (`HTMLBlock` -> `HTML Block`) rather than exploding it letter by letter. No
 * component name needs that today — the 21 documented names only ever pair two
 * capitalised words — but it is the behaviour you want the first time one does.
 */
export const humanName = (displayName: string): string =>
  displayName.replace(/(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/g, " ");
