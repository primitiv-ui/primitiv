import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

export const ArrowLeft = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M20.75 11.25v1.5H3.908v-1.5z"/><path d="m12.06 5-7 7 7 7L11 20.06 2.94 12 11 3.94z"/>
  </IconBase>
)
