import type { Ref, ReactElement } from 'react'
import type { IconProps } from './types.ts'

interface IconBaseProps extends IconProps {
  ref?: Ref<SVGSVGElement>
}

/**
 * The shared SVG wrapper every Primitiv icon renders through. Sets up the
 * `viewBox`, `currentColor` fill, and `size`-driven width/height, forwards
 * a ref to the `<svg>`, and marks the icon `aria-hidden` unless an
 * `aria-label` is provided. Generated icon components pass their paths as
 * `children`; you rarely render this directly.
 */
export const IconBase = ({
  size = 24,
  ref,
  children,
  ...props
}: IconBaseProps): ReactElement => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden={props['aria-label'] === undefined ? true : undefined}
    ref={ref}
    {...props}
  >
    {children}
  </svg>
)
