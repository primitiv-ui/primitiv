import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The Settings icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <Settings size={20} aria-label="Settings" />
 * ```
 */
export const Settings = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M14.25 12a2.25 2.25 0 1 0-4.5 0 2.25 2.25 0 0 0 4.5 0m1.5 0a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0"/><path d="m13.335 3.993 2-.999 1.129 2.256h2.286v2.286l2.256 1.129-1 2L22.676 12l-2.67 1.335 1 2-2.256 1.128v2.287h-2.286l-1.129 2.256-2-1L12 22.676l-1.336-2.67-1.999 1-1.129-2.256H5.25v-2.287l-2.256-1.128 1-2L1.323 12l2.67-1.336-1-1.999L5.25 7.536V5.25h2.286l1.129-2.256 2 1L12 1.323zm-2 2.013-2-1-.871 1.744H6.75v1.714l-1.744.871 1 2-1.33.665 1.33.665-1 2 1.329.664.415.207v1.714h1.714l.871 1.743 2-.999.665 1.33.665-1.33 2 1 .664-1.329.207-.415h1.714v-1.714l.415-.207 1.328-.665-.999-1.999 1.33-.665-1.33-.665 1-2-1.744-.871V6.75h-1.714l-.207-.415-.665-1.33-1.999 1L12 4.678z"/>
  </IconBase>
)
