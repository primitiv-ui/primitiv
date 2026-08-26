import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The Underline icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <Underline size={20} aria-label="Underline" />
 * ```
 */
export const Underline = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M18.5 21.25H5.5V19.75H18.5V21.25Z"/>
    <path d="M7.75 11.5C7.75 14.1149 9.64277 16 12 16C14.3572 16 16.25 14.1149 16.25 11.5V3.5H17.75V11.5C17.75 14.8851 15.2428 17.5 12 17.5C8.75723 17.5 6.25 14.8851 6.25 11.5V3.5H7.75V11.5Z"/>
  </IconBase>
)
