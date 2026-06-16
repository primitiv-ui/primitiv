import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The ChevronDown icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <ChevronDown size={20} aria-label="ChevronDown" />
 * ```
 */
export const ChevronDown = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M20.06 9 12 17.06 3.94 9 5 7.94l7 7 7-7z"/>
  </IconBase>
)
