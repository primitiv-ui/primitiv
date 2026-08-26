import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The Bold icon.
 *
 * A fill-based SVG that inherits `currentColor` and scales via the
 * `size` prop. Accepts all native `<svg>` attributes (see {@link IconProps}).
 *
 * @example
 * ```tsx
 * <Bold size={20} aria-label="Bold" />
 * ```
 */
export const Bold = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path fillRule="evenodd" d="M12.5 2.875c1.667 0 3.132.49 4.198 1.411 1.077.93 1.677 2.243 1.677 3.714 0 1.399-.544 2.634-1.528 3.531q.57.297 1.047.701A4.89 4.89 0 0 1 19.625 16c0 1.483-.623 2.803-1.746 3.73-1.108.915-2.63 1.395-4.379 1.395H5.375V2.875zm-4.875 16H13.5c1.35 0 2.329-.37 2.946-.88.602-.497.929-1.179.929-1.995 0-.821-.332-1.533-.943-2.057-.622-.531-1.597-.918-2.932-.918H7.625zm0-8.1H12.5c1.25 0 2.163-.344 2.742-.827.562-.468.883-1.123.883-1.948 0-.83-.325-1.516-.898-2.01-.583-.505-1.494-.865-2.727-.865H7.625z" clipRule="evenodd"/>
  </IconBase>
)
