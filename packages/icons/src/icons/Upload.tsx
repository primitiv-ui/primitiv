import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The Upload icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <Upload size={20} aria-label="Upload" />
 * ```
 */
export const Upload = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M12.5 17.81H11v-13h1.5z"/><path d="M4.69 10.06 11.75 3l7.06 7.06-1.06 1.061-6-6-6 6zM20.5 19v1.5H3V19z"/>
  </IconBase>
)
