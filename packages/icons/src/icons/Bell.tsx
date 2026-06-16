import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The Bell icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <Bell size={20} aria-label="Bell" />
 * ```
 */
export const Bell = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M17.25 11c0-3.662-2.737-6.25-5.25-6.25S6.75 7.338 6.75 11v5.31l-.94.94h12.38l-.94-.94zm1.5 4.69 3.06 3.06H2.19l3.06-3.06V11c0-4.338 3.263-7.75 6.75-7.75s6.75 3.412 6.75 7.75zm-4 4.56v1.5h-5.5v-1.5z"/>
  </IconBase>
)
