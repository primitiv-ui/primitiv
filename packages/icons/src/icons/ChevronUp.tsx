import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The ChevronUp icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <ChevronUp size={20} aria-label="ChevronUp" />
 * ```
 */
export const ChevronUp = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M20.06 15 19 16.06l-7-7-7 7L3.94 15 12 6.94z"/>
  </IconBase>
)
