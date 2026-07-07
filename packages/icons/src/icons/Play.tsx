import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The Play icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <Play size={20} aria-label="Play" />
 * ```
 */
export const Play = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path fillRule="evenodd" d="M19.978 12 7.92 20.44V3.56zM9.42 17.56 17.362 12 9.42 6.44z" clipRule="evenodd"/>
  </IconBase>
)
