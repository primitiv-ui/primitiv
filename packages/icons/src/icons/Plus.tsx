import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

export const Plus = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M11.25 3.25h1.5v17.5h-1.5z"/><path d="M20.75 11.25v1.5H3.25v-1.5z"/>
  </IconBase>
)
