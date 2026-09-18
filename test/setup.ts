// oxlint-disable-next-line import/no-unassigned-import -- registers matchers
import '@testing-library/jest-dom/vitest'
import {cleanup} from '@testing-library/react'
import {afterEach} from 'vitest'

// jsdom implements neither of these, and @sanity/ui needs both: it reads
// window.matchMedia in its media-query store and constructs a ResizeObserver in
// useElementSize. Without the stubs, every @sanity/ui render throws.
if (!('ResizeObserver' in globalThis)) {
  // Not a no-op: @tanstack/react-virtual sizes its viewport from the observer,
  // so a stub that never fires leaves the virtualizer believing the scroll
  // element is 0px tall and mounting no rows at all. Report the stubbed rect
  // synchronously on observe.
  globalThis.ResizeObserver = class {
    #callback: ResizeObserverCallback

    constructor(callback: ResizeObserverCallback) {
      this.#callback = callback
    }

    observe(element: Element) {
      const rect = element.getBoundingClientRect()

      this.#callback(
        [
          {
            // borderBoxSize is the branch @tanstack/react-virtual reads first.
            // Omitting it made the observer report a 0x0 viewport, which
            // overwrote the good initialRect and unmounted every row.
            borderBoxSize: [{blockSize: rect.height, inlineSize: rect.width}],
            contentRect: rect,
            target: element,
          } as unknown as ResizeObserverEntry,
        ],
        this as unknown as ResizeObserver,
      )
    }

    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    addEventListener() {},
    addListener() {},
    dispatchEvent: () => false,
    matches: false,
    media: query,
    onchange: null,
    removeEventListener() {},
    removeListener() {},
  })) as unknown as typeof window.matchMedia
}

// @tanstack/react-virtual measures the scroll element to decide which rows to
// mount. jsdom has no layout engine and reports 0 for every box, so the
// virtualizer would mount nothing and the grid would render empty.
Object.defineProperty(HTMLElement.prototype, 'clientHeight', {configurable: true, value: 300})
Object.defineProperty(HTMLElement.prototype, 'clientWidth', {configurable: true, value: 320})
Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
  return {
    bottom: 300,
    height: 300,
    left: 0,
    right: 320,
    toJSON: () => ({}),
    top: 0,
    width: 320,
    x: 0,
    y: 0,
  } as DOMRect
}

// React Testing Library only auto-cleans when `globals: true`.
afterEach(cleanup)
