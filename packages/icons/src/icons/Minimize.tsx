import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The Minimize icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <Minimize size={20} aria-label="Minimize" />
 * ```
 */
export const Minimize = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M9.25 6v3.25H6v1.5h4.75V6zm5.5 0v3.25H18v1.5h-4.75V6zm-5.5 12v-3.25H6v-1.5h4.75V18zm5.5 0v-3.25H18v-1.5h-4.75V18z"/>
  </IconBase>
)
