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
    <path fillRule="evenodd" clipRule="evenodd" d="M12.5 2.875C14.1666 2.875 15.6318 3.36512 16.6982 4.28613C17.7753 5.21641 18.375 6.52949 18.375 8C18.375 9.39873 17.8305 10.6339 16.8467 11.5312C17.2271 11.7288 17.5779 11.9626 17.8936 12.2324C19.0062 13.1839 19.6249 14.5218 19.625 16C19.6249 17.483 19.0018 18.8028 17.8789 19.7305C16.7714 20.6452 15.2488 21.125 13.5 21.125H5.375V2.875H12.5ZM7.625 18.875H13.5C14.8508 18.875 15.8288 18.5051 16.4463 17.9951C17.0479 17.4979 17.3749 16.8164 17.375 16C17.3749 15.1788 17.0434 14.4667 16.4316 13.9434C15.8101 13.4119 14.8352 13.0254 13.5 13.0254H7.625V18.875ZM7.625 10.7754H12.5C13.7502 10.7754 14.6632 10.4307 15.2422 9.94824C15.8041 9.47997 16.125 8.82479 16.125 8C16.125 7.17081 15.8001 6.48394 15.2275 5.98926C14.644 5.48527 13.7334 5.125 12.5 5.125H7.625V10.7754Z"/>
  </IconBase>
)
