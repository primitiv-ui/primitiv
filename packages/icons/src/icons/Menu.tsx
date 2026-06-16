import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

export const Menu = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M21.75 6.25v1.5H2.25v-1.5zm0 5v1.5H2.25v-1.5zm0 5v1.5H2.25v-1.5z"/>
  </IconBase>
)
