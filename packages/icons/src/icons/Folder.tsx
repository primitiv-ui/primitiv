import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The Folder icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <Folder size={20} aria-label="Folder" />
 * ```
 */
export const Folder = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="m10.31 5.25 2 2h9.44v12.5H2.25V5.25zm-6.56 13h16.5v-9.5h-8.56l-2-2H3.75z"/>
  </IconBase>
)
