import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The Check icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <Check size={20} aria-label="Check" />
 * ```
 */
export const Check = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M21.057 5.904 10.05 19.111 2.939 12 4 10.94l5.95 5.949 9.954-11.946z"/>
  </IconBase>
)
