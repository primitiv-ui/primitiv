import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The List icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <List size={20} aria-label="List" />
 * ```
 */
export const List = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M21.75 5.25v1.5H7.25v-1.5zm0 6v1.5H7.25v-1.5zm0 6v1.5H7.25v-1.5zm-17-12v1.5h-2.5v-1.5zm0 6v1.5h-2.5v-1.5zm0 6v1.5h-2.5v-1.5z"/>
  </IconBase>
)
