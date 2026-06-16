import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The Grid icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <Grid size={20} aria-label="Grid" />
 * ```
 */
export const Grid = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M11.75 2.25v9.5h-9.5v-9.5zm-8 8h6.5v-6.5h-6.5zm18-8v9.5h-9.5v-9.5zm-8 8h6.5v-6.5h-6.5zm-2 2v9.5h-9.5v-9.5zm-8 8h6.5v-6.5h-6.5zm18-8v9.5h-9.5v-9.5zm-8 8h6.5v-6.5h-6.5z"/>
  </IconBase>
)
