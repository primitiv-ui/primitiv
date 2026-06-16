import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

export const Success = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M20.25 12a8.25 8.25 0 1 0-16.5 0 8.25 8.25 0 0 0 16.5 0m1.5 0c0 5.385-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12 6.615 2.25 12 2.25s9.75 4.365 9.75 9.75"/><path d="m18.058 8.919-7.016 8.183L5.939 12 7 10.94l3.957 3.957 5.962-6.955z"/>
  </IconBase>
)
