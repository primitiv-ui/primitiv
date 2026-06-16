import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The Info icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <Info size={20} aria-label="Info" />
 * ```
 */
export const Info = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M20.25 12a8.25 8.25 0 1 0-16.5 0 8.25 8.25 0 0 0 16.5 0m1.5 0c0 5.385-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12 6.615 2.25 12 2.25s9.75 4.365 9.75 9.75"/><path d="M11.25 10.25h1.5v7.5h-1.5zm0-4h1.5v2.5h-1.5z"/>
  </IconBase>
)
