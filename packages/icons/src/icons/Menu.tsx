import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The Menu icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <Menu size={20} aria-label="Menu" />
 * ```
 */
export const Menu = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M21.75 6.25v1.5H2.25v-1.5zm0 5v1.5H2.25v-1.5zm0 5v1.5H2.25v-1.5z"/>
  </IconBase>
)
