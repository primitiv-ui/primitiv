import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

export const Minus = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M20.75 11.25v1.5H3.25v-1.5z"/>
  </IconBase>
)
