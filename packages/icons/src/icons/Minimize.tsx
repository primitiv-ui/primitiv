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
    <path d="M10.75 6v4.75H6v-1.5h3.25V6Zm4 0v3.25H18v1.5h-4.75V6Zm-5.5 12v-3.25H6v-1.5h4.75V18Zm4 0v-4.75H18v1.5h-3.25V18ZM4.28 3.22l6.5 6.5-1.06 1.06-6.5-6.5Zm16.5 1.06-6.5 6.5-1.06-1.06 6.5-6.5Zm-1.06 16.5-6.5-6.5 1.06-1.06 6.5 6.5Zm-16.5-1.06 6.5-6.5 1.06 1.06-6.5 6.5Z"/>
  </IconBase>
)
