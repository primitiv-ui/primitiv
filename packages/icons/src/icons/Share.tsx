import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

export const Share = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M8.25 12a2.25 2.25 0 1 0-4.5 0 2.25 2.25 0 0 0 4.5 0m1.5 0a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0m10.5-6a2.25 2.25 0 1 0-4.5 0 2.25 2.25 0 0 0 4.5 0m1.5 0a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0m-1.5 12a2.25 2.25 0 1 0-4.5 0 2.25 2.25 0 0 0 4.5 0m1.5 0a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0"/><path d="m15.91 7.335-7.414 4.17-.596-1.34 7.414-4.17zm0 9.33-.596 1.34-7.414-4.17.596-1.34z"/>
  </IconBase>
)
