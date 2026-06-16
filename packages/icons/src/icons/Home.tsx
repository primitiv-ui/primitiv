import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The Home icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <Home size={20} aria-label="Home" />
 * ```
 */
export const Home = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="m22.059 10.938-.997 1.12L12 4.004 2.937 12.06l-.996-1.121L12 1.995l10.059 8.941Z"/><path d="M4.25 9.25h1.5v10h12.5v-10h1.5v11.5H4.25z"/><path d="M13.25 14.75h-2.5v6h-1.5v-7.5h5.5v7.5h-1.5z"/>
  </IconBase>
)
