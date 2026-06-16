import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The ExternalLink icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <ExternalLink size={20} aria-label="ExternalLink" />
 * ```
 */
export const ExternalLink = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M19.25 4.75h-6v-1.5h7.5v7.5h-1.5z"/><path d="M20.06 5 11 14.06 9.94 13 19 3.94z"/><path d="M10.75 5.25v1.5h-6v12.5h12.5v-6h1.5v7.5H3.25V5.25z"/>
  </IconBase>
)
