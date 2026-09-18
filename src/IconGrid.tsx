import {Box, Card, Flex, Text} from '@sanity/ui'
import {useVirtualizer} from '@tanstack/react-virtual'
import {type JSX, useEffect, useRef} from 'react'

import {IconGlyph} from './lucide-icons'
import type {IconObject} from './types'

/**
 * Tiles per row. Fixed rather than measured: the tiles are `1fr` in a CSS grid,
 * so they shrink to fit a narrow field instead of overflowing, and the
 * virtualizer only ever needs a row count. Measuring would also mean depending
 * on ResizeObserver, which jsdom does not implement.
 */
export const GRID_COLUMNS = 8

const ROW_HEIGHT = 40

/** Visible height of the scroll area. */
const MAX_HEIGHT = 280

/** Rows kept mounted above and below the viewport, to hide scroll tearing. */
const OVERSCAN = 4

export interface IconGridProps {
  icons: readonly IconObject[]
  /** Index into `icons` of the keyboard-highlighted tile, or -1 for none. */
  activeIndex: number
  /** Canonical name of the currently stored icon, if any. */
  selectedName?: string
  onSelect: (name: string) => void
  onActiveIndexChange: (index: number) => void
  /** Id of this listbox, so the search input can own `aria-activedescendant`. */
  id: string
}

export const optionId = (gridId: string, name: string): string => `${gridId}-option-${name}`

export const IconGrid = ({
  icons,
  activeIndex,
  selectedName,
  onSelect,
  onActiveIndexChange,
  id,
}: IconGridProps): JSX.Element => {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const rowCount = Math.ceil(icons.length / GRID_COLUMNS)

  // React Compiler cannot memoize the functions this returns, so it skips
  // memoizing the component. That is the intended trade for windowing ~1848
  // tiles; nothing here is passed into another memoized hook.
  // oxlint-disable-next-line react/incompatible-library
  const virtualizer = useVirtualizer({
    count: rowCount,
    estimateSize: () => ROW_HEIGHT,
    getScrollElement: () => scrollRef.current,
    // The window to assume before the scroll element has been measured. Without
    // it the first render mounts no rows at all in any environment that lacks
    // layout (SSR, jsdom); in a browser the real measurement replaces it
    // immediately.
    initialRect: {height: MAX_HEIGHT, width: 320},
    overscan: OVERSCAN,
  })

  const activeRow = activeIndex >= 0 ? Math.floor(activeIndex / GRID_COLUMNS) : -1

  // Keep the highlighted tile in view as the arrow keys move it. Focus stays on
  // the search input throughout, so this is the only thing that has to follow.
  useEffect(() => {
    if (activeRow >= 0) virtualizer.scrollToIndex(activeRow)
  }, [activeRow, virtualizer])

  if (icons.length === 0) {
    return (
      <Box padding={4}>
        <Text align="center" muted size={1}>
          No icons match that search.
        </Text>
      </Box>
    )
  }

  return (
    <div
      aria-label="Icons"
      id={id}
      ref={scrollRef}
      // An ARIA listbox, not a native <select>: the options are icon tiles in a
      // virtualized grid, which no native form control can express.
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="listbox"
      style={{maxHeight: MAX_HEIGHT, overflowY: 'auto', overscrollBehavior: 'contain'}}
    >
      <div style={{height: virtualizer.getTotalSize(), position: 'relative', width: '100%'}}>
        {virtualizer.getVirtualItems().map((row) => {
          const start = row.index * GRID_COLUMNS
          const rowIcons = icons.slice(start, start + GRID_COLUMNS)

          return (
            <div
              key={row.key}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)`,
                height: row.size,
                left: 0,
                position: 'absolute',
                top: 0,
                transform: `translateY(${row.start}px)`,
                width: '100%',
              }}
            >
              {rowIcons.map((icon, column) => {
                const index = start + column
                const isActive = index === activeIndex

                return (
                  <Card
                    aria-selected={icon.name === selectedName}
                    data-as="button"
                    id={optionId(id, icon.name)}
                    key={icon.name}
                    // The listbox keeps focus on the search input, so a hover
                    // moves the highlight rather than fighting it.
                    onMouseEnter={() => onActiveIndexChange(index)}
                    onClick={() => onSelect(icon.name)}
                    padding={2}
                    radius={2}
                    // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
                    role="option"
                    title={icon.name}
                    tone={isActive ? 'primary' : 'inherit'}
                  >
                    <Flex align="center" justify="center">
                      <IconGlyph icon={icon.component} size="1.25em" />
                    </Flex>
                  </Card>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
