import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The Link icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <Link size={20} aria-label="Link" />
 * ```
 */
export const Link = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M10.75 7.25v1.5H4c-.053 0-.233.029-.44.492-.194.438-.31 1.076-.31 1.758s.116 1.32.31 1.758c.207.463.387.492.44.492h6.75v1.5H4c-.947 0-1.517-.721-1.81-1.383-.306-.687-.44-1.549-.44-2.367s.134-1.68.44-2.367C2.482 7.97 3.052 7.25 4 7.25zm9.25 2c.947 0 1.517.721 1.81 1.383.306.687.44 1.549.44 2.367s-.134 1.68-.44 2.367c-.293.662-.863 1.383-1.81 1.383h-6.75v-1.5H20c.053 0 .233-.029.44-.492.194-.438.31-1.076.31-1.758s-.116-1.32-.31-1.758c-.207-.463-.387-.492-.44-.492h-6.75v-1.5z"/><path d="M16.75 11.25v1.5h-9.5v-1.5z"/>
  </IconBase>
)
