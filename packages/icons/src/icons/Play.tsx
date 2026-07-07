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
    <path fillRule="evenodd" d="M18.029 12 5.97 20.44V3.56zM7.47 17.56 15.414 12 7.47 6.44z" clipRule="evenodd"/>
  </IconBase>
)
