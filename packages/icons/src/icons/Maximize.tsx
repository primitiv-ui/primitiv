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
    <path d="M3.25 3.25H9v1.5H4.75V9h-1.5zm17.5 0H15v1.5h4.25V9h1.5zm0 17.5H15v-1.5h4.25V15h1.5zm-17.5 0H9v-1.5H4.75V15h-1.5z"/>
  </IconBase>
)
