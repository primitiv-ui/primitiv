import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The Maximize icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <Maximize size={20} aria-label="Maximize" />
 * ```
 */
export const Maximize = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M3.25 3.25H9v1.5H4.75V9h-1.5ZM20.75 9h-1.5V4.75H15v-1.5h5.75Zm0 11.75H15v-1.5h4.25V15h1.5ZM3.25 15h1.5v4.25H9v1.5H3.25ZM4.28 3.22l6.5 6.5-1.06 1.06-6.5-6.5Zm16.5 1.06-6.5 6.5-1.06-1.06 6.5-6.5Zm-1.06 16.5-6.5-6.5 1.06-1.06 6.5 6.5Zm-16.5-1.06 6.5-6.5 1.06 1.06-6.5 6.5Z"/>
  </IconBase>
)
