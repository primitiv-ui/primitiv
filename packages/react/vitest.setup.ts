import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

import { installPopoverPolyfill } from './src/test/popoverPolyfill'
import { installScrollPolyfill } from './src/test/scrollPolyfill'
import {
  installIntersectionObserverPolyfill,
  MockIntersectionObserver,
} from './src/test/intersectionObserverPolyfill'
import {
  installResizeObserverPolyfill,
  MockResizeObserver,
} from './src/test/resizeObserverPolyfill'

installPopoverPolyfill()
installScrollPolyfill()
installIntersectionObserverPolyfill()
installResizeObserverPolyfill()

afterEach(() => {
  cleanup()
  MockIntersectionObserver.reset()
  MockResizeObserver.reset()
})
