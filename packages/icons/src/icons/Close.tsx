import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The Close icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <Close size={20} aria-label="Close" />
 * ```
 */
export const Close = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M20.06 19 19 20.06 3.94 5 5 3.94z"/><path d="M20.06 5 5 20.06 3.94 19 19 3.94z"/>
  </IconBase>
)
