import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

export const Warning = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M23.311 20.75H.688L12 1.52zm-20-1.5H20.69L12 4.479z"/><path d="M11.25 8.25h1.5v6.5h-1.5zm0 7.5h1.5v2.5h-1.5z"/>
  </IconBase>
)
