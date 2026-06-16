import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

export const Error = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M20.25 12a8.25 8.25 0 1 0-16.5 0 8.25 8.25 0 0 0 16.5 0m1.5 0c0 5.385-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12 6.615 2.25 12 2.25s9.75 4.365 9.75 9.75"/><path d="M17.06 16 16 17.06 6.94 8 8 6.94z"/><path d="M17.06 8 8 17.06 6.94 16 16 6.94z"/>
  </IconBase>
)
