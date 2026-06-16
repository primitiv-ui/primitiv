import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The Calendar icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <Calendar size={20} aria-label="Calendar" />
 * ```
 */
export const Calendar = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M21.75 4.25v17.5H2.25V4.25zm-18 16h16.5V5.75H3.75z"/><path d="M21.75 9.25v1.5H2.25v-1.5zm-14.5-7h1.5v5.5h-1.5zm8 0h1.5v5.5h-1.5z"/>
  </IconBase>
)
