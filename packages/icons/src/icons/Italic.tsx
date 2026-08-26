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
    <path d="M18.5 5.75H15.0283L10.5635 18.25H14V19.75H5.5V18.25H8.97168L13.4365 5.75H10V4.25H18.5V5.75Z"/>
  </IconBase>
)
