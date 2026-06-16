import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The ChevronRight icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <ChevronRight size={20} aria-label="ChevronRight" />
 * ```
 */
export const ChevronRight = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M17.06 12 9 20.06 7.94 19l7-7-7-7L9 3.94z"/>
  </IconBase>
)
