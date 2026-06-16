import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The Sort icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <Sort size={20} aria-label="Sort" />
 * ```
 */
export const Sort = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M5.25 4.25h1.5v16.5h-1.5z"/><path d="M10.06 7 9 8.06l-3-3-3 3L1.94 7 6 2.94zm7.19-3.75h1.5v16.5h-1.5z"/><path d="M22.06 17 18 21.06 13.94 17 15 15.94l3 3 3-3z"/>
  </IconBase>
)
