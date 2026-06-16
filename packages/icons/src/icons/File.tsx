import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

export const File = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="m14.31 2.25 5.44 5.44v14.06H4.25V2.25zm-8.56 18h12.5V8.31l-4.56-4.56H5.75z"/><path d="M13.25 2.75h1.5v4.5h4.5v1.5h-6z"/>
  </IconBase>
)
