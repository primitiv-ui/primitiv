import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The Search icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <Search size={20} aria-label="Search" />
 * ```
 */
export const Search = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M16.25 10.5a5.75 5.75 0 1 0-11.5 0 5.75 5.75 0 0 0 11.5 0m1.5 0a7.25 7.25 0 1 1-14.5 0 7.25 7.25 0 0 1 14.5 0"/><path d="M21.06 20 20 21.06l-5.56-5.56 1.06-1.06z"/>
  </IconBase>
)
