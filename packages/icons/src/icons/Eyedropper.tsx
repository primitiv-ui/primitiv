import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The Eyedropper icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <Eyedropper size={20} aria-label="Eyedropper" />
 * ```
 */
export const Eyedropper = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M12.645 6.952a.7.7 0 0 1 .99 0l3.394 3.395a.7.7 0 0 1 0 .99l-.354.353a.7.7 0 0 1-.99 0l-3.394-3.394a.7.7 0 0 1 0-.99z"/><path d="M14.704 6.166a1.6 1.6 0 0 1 2.263 0l.849.848a1.6 1.6 0 1 1-2.263 2.263l-.849-.849a1.6 1.6 0 0 1 0-2.262m-.925 4.672a.45.45 0 0 0-.636-.635L9.04 14.304a.45.45 0 0 0 .636.636zm-3.183 5.021a1.75 1.75 0 0 1-2.475-2.475l4.102-4.101a1.75 1.75 0 0 1 2.475 2.475z"/><path d="M8.316 16.353a.65.65 0 1 0-1.3.001.65.65 0 0 0 1.3-.001m1.3 0a1.95 1.95 0 1 1-3.9 0 1.95 1.95 0 0 1 3.9 0"/>
  </IconBase>
)
