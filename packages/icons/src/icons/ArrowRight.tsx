import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The ArrowRight icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <ArrowRight size={20} aria-label="ArrowRight" />
 * ```
 */
export const ArrowRight = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M19.75 11.25v1.5H3.25v-1.5z"/><path d="M21.06 12 13 20.06 11.94 19l7-7-7-7L13 3.94z"/>
  </IconBase>
)
