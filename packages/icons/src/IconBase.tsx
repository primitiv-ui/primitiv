import type { Ref, ReactElement } from 'react'
import type { IconProps } from './types.ts'

interface IconBaseProps extends IconProps {
  ref?: Ref<SVGSVGElement>
}

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
