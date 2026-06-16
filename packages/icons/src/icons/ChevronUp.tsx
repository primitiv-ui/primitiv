import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

export const ChevronUp = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M20.06 15 19 16.06l-7-7-7 7L3.94 15 12 6.94z"/>
  </IconBase>
)
