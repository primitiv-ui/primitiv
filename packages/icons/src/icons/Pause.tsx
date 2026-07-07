import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The Pause icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <Pause size={20} aria-label="Pause" />
 * ```
 */
export const Pause = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M10.25 18.5h-1.5v-13h1.5zM15.25 18.5h-1.5v-13h1.5z"/>
  </IconBase>
)
