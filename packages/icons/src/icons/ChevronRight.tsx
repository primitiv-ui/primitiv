import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

export const ChevronRight = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M17.06 12 9 20.06 7.94 19l7-7-7-7L9 3.94z"/>
  </IconBase>
)
