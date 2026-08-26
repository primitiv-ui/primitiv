import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The Underline icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <Underline size={20} aria-label="Underline" />
 * ```
 */
export const Underline = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M18.5 21.25h-13v-1.5h13zM7.75 11.5c0 2.615 1.893 4.5 4.25 4.5s4.25-1.885 4.25-4.5v-8h1.5v8c0 3.385-2.507 6-5.75 6s-5.75-2.615-5.75-6v-8h1.5z"/>
  </IconBase>
)
