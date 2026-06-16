import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

export const Delete = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M20.75 6.25v1.5H3.25v-1.5z"/><path d="M18.81 7.314 17.69 20.75H6.31L5.19 7.314l1.496-.124 1.003 12.06h8.622l1.003-12.06z"/><path d="M14.25 4.75h-4.5v3h-1.5v-4.5h7.5v4.5h-1.5zm-5 5.5h1.5v7.5h-1.5zm4 0h1.5v7.5h-1.5z"/>
  </IconBase>
)
