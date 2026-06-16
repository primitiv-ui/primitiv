import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The Filter icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <Filter size={20} aria-label="Filter" />
 * ```
 */
export const Filter = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M22.533 3.25 14.75 13.257v7.493h-5.5v-7.493L1.467 3.25zM10.75 12.742v6.508h2.5v-6.508l6.217-7.992H4.533z"/>
  </IconBase>
)
