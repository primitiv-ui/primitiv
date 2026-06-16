import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

export const Copy = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M20.75 7.25v13.5H7.25V7.25zm-12 12h10.5V8.75H8.75z"/><path d="M15.25 4.75H4.75v10.5h4v1.5h-5.5V3.25h13.5v5.5h-1.5z"/>
  </IconBase>
)
