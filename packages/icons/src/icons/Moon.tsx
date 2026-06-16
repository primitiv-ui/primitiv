import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

export const Moon = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path fillRule="evenodd" d="M8.41 3.745a8.7 8.7 0 0 0 11.844 11.842A9 9 0 1 1 8.41 3.745M5.806 7.771a7.5 7.5 0 0 0 10.422 10.422c-.076.002-.152.007-.228.007-5.633 0-10.2-4.567-10.2-10.2q.001-.114.006-.229" clipRule="evenodd"/>
  </IconBase>
)
