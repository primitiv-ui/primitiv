---
title: Alert
---

# Alert

An assertive live region for high-priority, time-sensitive messages,
implementing the
[WAI-ARIA `alert` role](https://www.w3.org/TR/wai-aria-1.2/#alert).

```tsx
import { Alert } from "@primitiv-ui/react";

{
  error && <Alert>{error}</Alert>;
}
```

## Props

| Prop        | Type                    | Default | Notes                                              |
| ----------- | ----------------------- | ------- | -------------------------------------------------- |
| `asChild`   | `boolean`               | `false` | Render the consumer's element instead of a `<div>` |
| `className` | `string`                | —       | Applied directly to the rendered element           |
| `...rest`   | `ComponentProps<"div">` | —       | All other `<div>` props, including `aria-*`         |

## Behaviour

`Alert` renders a `<div role="alert">`. The `alert` role carries an
implicit `aria-live="assertive"` and `aria-atomic="true"`, so assistive
technology interrupts the user to announce the message as soon as it
appears. Use it for errors and other content the user must see now —
for non-urgent updates, reach for [`Status`](../Status/README.md).

## Announce on appearance

A live region announces content that changes *after* the region is in
the DOM. Render the `Alert` **conditionally** so the message appears
into an already-mounted tree:

```tsx
{
  submitError && <Alert>{submitError}</Alert>;
}
```

Mounting an `Alert` that already contains its message may not be
announced reliably.

## asChild

Pass `asChild` to apply `role="alert"` to the consumer's own element:

```tsx
<Alert asChild>
  <section>Upload failed — try again.</section>
</Alert>
```

## Workbench example

Open the interactive version in the [workbench](/workbench/#/alert). Its source:

<<< ../../../apps/workbench/src/pages/AlertExample/AlertExample.tsx
