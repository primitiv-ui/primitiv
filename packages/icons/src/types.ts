import type { SVGProps } from 'react'

/**
 * Props accepted by every Primitiv icon. Extends all native `<svg>`
 * attributes, so `className`, `style`, `onClick`, `aria-*`, etc. pass
 * straight through to the rendered element.
 */
export interface IconProps extends SVGProps<SVGSVGElement> {
  /**
   * Width and height of the icon, in pixels (number) or any CSS length
   * (string). Defaults to `24`.
   */
  size?: number | string
}
