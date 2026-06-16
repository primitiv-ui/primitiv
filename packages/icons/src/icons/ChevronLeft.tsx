import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The ChevronLeft icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <ChevronLeft size={20} aria-label="ChevronLeft" />
 * ```
 */
export const ChevronLeft = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="m16.06 5-7 7 7 7L15 20.06 6.94 12 15 3.94z"/>
  </IconBase>
)
