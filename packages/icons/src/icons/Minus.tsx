import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The Minus icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <Minus size={20} aria-label="Minus" />
 * ```
 */
export const Minus = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M20.75 11.25v1.5H3.25v-1.5z"/>
  </IconBase>
)
