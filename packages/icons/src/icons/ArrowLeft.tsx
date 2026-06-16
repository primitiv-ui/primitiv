import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The ArrowLeft icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <ArrowLeft size={20} aria-label="ArrowLeft" />
 * ```
 */
export const ArrowLeft = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M20.75 11.25v1.5H3.908v-1.5z"/><path d="m12.06 5-7 7 7 7L11 20.06 2.94 12 11 3.94z"/>
  </IconBase>
)
