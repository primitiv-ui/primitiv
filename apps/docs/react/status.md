---
title: Status
---

# Status

A polite live region for low-priority, non-urgent status messages,
implementing the
[WAI-ARIA `status` role](https://www.w3.org/TR/wai-aria-1.2/#status).

```tsx
import { Status } from "@primitiv-ui/react";

{
  saved && <Status>All changes saved.</Status>;
}
```

## Props

| Prop        | Type                    | Default | Notes                                              |
| ----------- | ----------------------- | ------- | -------------------------------------------------- |
| `asChild`   | `boolean`               | `false` | Render the consumer's element instead of a `<div>` |
| `className` | `string`                | —       | Applied directly to the rendered element           |
| `...rest`   | `ComponentProps<"div">` | —       | All other `<div>` props, including `aria-*`         |

## Behaviour

`Status` renders a `<div role="status">`. The `status` role carries an
implicit `aria-live="polite"` and `aria-atomic="true"`, so assistive
technology announces the message once the user is idle, without
interrupting them. Use it for confirmations, counts, and background
progress — for errors the user must see immediately, reach for
[`Alert`](../Alert/README.md).

## Announce on change

A live region announces content that changes *after* the region is in
the DOM. Either render the `Status` conditionally, or keep it mounted
and update its text content:

```tsx
<Status>{count} items in your cart</Status>
```

## asChild

Pass `asChild` to apply `role="status"` to the consumer's own element:

```tsx
<Status asChild>
  <output>{count} items in your cart</output>
</Status>
```

## Workbench example

Open the interactive version in the [workbench](/workbench/#/status). Its source:

<<< ../../../apps/workbench/src/pages/StatusExample/StatusExample.tsx
