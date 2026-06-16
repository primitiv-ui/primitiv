import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The User icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <User size={20} aria-label="User" />
 * ```
 */
export const User = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M15.25 8a3.25 3.25 0 1 0-6.5 0 3.25 3.25 0 0 0 6.5 0m1.5 0a4.75 4.75 0 1 1-9.5 0 4.75 4.75 0 0 1 9.5 0"/><path d="M19.25 21c0-4.526-3.601-7.25-7.25-7.25S4.75 16.474 4.75 21v.75h-1.5V21c0-5.474 4.399-8.75 8.75-8.75s8.75 3.276 8.75 8.75v.75h-1.5z"/>
  </IconBase>
)
