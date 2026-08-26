import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The Italic icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <Italic size={20} aria-label="Italic" />
 * ```
 */
export const Italic = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M18.5 5.75h-3.472l-4.465 12.5H14v1.5H5.5v-1.5h3.472l4.465-12.5H10v-1.5h8.5z"/>
  </IconBase>
)
