import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

export const Close = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M20.06 19 19 20.06 3.94 5 5 3.94z"/><path d="M20.06 5 5 20.06 3.94 19 19 3.94z"/>
  </IconBase>
)
