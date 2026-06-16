import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

export const Edit = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M21.06 8 8.31 20.75H3.25v-5.06L16 2.94zM4.75 16.31v2.94h2.94L18.94 8 16 5.06z"/><path d="M18.06 11 17 12.06 11.94 7 13 5.94z"/>
  </IconBase>
)
