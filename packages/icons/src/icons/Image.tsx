import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The Image icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <Image size={20} aria-label="Image" />
 * ```
 */
export const Image = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M21.75 3.25v17.5H2.25V3.25zm-18 16h16.5V4.75H3.75z"/><path d="M10.25 9a1.25 1.25 0 1 0-2.5 0 1.25 1.25 0 0 0 2.5 0m1.5 0a2.75 2.75 0 1 1-5.5 0 2.75 2.75 0 0 1 5.5 0"/><path d="m21.56 11.042-7.525 6.946-5.057-4.045-5.643 4.105-.883-1.213 6.57-4.778 4.943 3.954 6.577-6.07z"/>
  </IconBase>
)
