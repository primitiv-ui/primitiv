import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

export const Download = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M11 3h1.5v13H11z"/><path d="m18.81 10.75-7.06 7.06-7.06-7.06 1.06-1.06 6 6 6-6zM20.5 19v1.5H3V19z"/>
  </IconBase>
)
