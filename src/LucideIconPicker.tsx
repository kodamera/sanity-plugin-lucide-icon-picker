import {SearchIcon} from '@sanity/icons/Search'
import {TrashIcon} from '@sanity/icons/Trash'
import {Box, Button, Card, Flex, Text, TextInput, useClickOutsideEvent} from '@sanity/ui'
import {Popover} from '@sanity/ui/popover'
import {
  type JSX,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import {type StringInputProps, set, unset} from 'sanity'

import {GRID_COLUMNS, IconGrid, optionId} from './IconGrid'
import {SelectedIconCard} from './SelectedIconCard'
import {
  filterAllowedIcons,
  getAllLucideIcons,
  resolveLucideIcon,
  searchIcons,
} from './lucide-icons'

const LucideIconPicker = ({
  schemaType,
  value,
  readOnly,
  onChange,
  elementProps,
}: StringInputProps): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const {
    id: fieldId,
    ref: fieldRef,
    onFocus,
    onBlur,
    style: fieldStyle,
    'aria-describedby': ariaDescribedBy,
  } = elementProps

  const reactId = useId()
  const gridId = `${fieldId}-grid`
  const searchId = `${fieldId}-search${reactId}`

  const rootRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)

  const allIcons = useMemo(() => {
    // `allowedIcons` is not part of Sanity's StringOptions, and it is
    // user-authored, so read it reflectively and validate rather than assert a
    // shape onto whatever the schema happens to carry.
    const allowedIcons: unknown = Reflect.get(schemaType.options ?? {}, 'allowedIcons')
    const allowed = Array.isArray(allowedIcons)
      ? allowedIcons.filter((name): name is string => typeof name === 'string')
      : undefined

    return filterAllowedIcons(getAllLucideIcons(), allowed)
  }, [schemaType.options])

  // No debounce: the search is a single `includes` over a pre-lowercased string
  // per icon, and the grid is virtualized, so filtering 1848 icons is well
  // inside a frame. The old 300ms debounce existed to avoid re-rendering an
  // unvirtualized list and made typing feel laggy.
  const results = useMemo(() => searchIcons(allIcons, query), [allIcons, query])

  const selectedIcon = useMemo(() => resolveLucideIcon(value), [value])

  // Narrowing the results can leave the stored index past the end. Clamping
  // here rather than in an effect keeps it correct on the very first render
  // after a keystroke, with no extra render pass.
  const safeActiveIndex = results.length === 0 ? -1 : Math.min(activeIndex, results.length - 1)
  const activeIcon = safeActiveIndex >= 0 ? results[safeActiveIndex] : undefined

  const close = useCallback(() => {
    setIsOpen(false)
    setQuery('')
    setActiveIndex(0)
  }, [])

  const open = useCallback(() => {
    if (readOnly) return
    setIsOpen(true)
    setQuery('')
    setActiveIndex(0)
  }, [readOnly])

  // Both elements count as "inside". The popover renders through a portal, so
  // its content is NOT a DOM descendant of rootRef — listing only rootRef made
  // every click inside the picker look like an outside click, which closed the
  // popover on mousedown and unmounted the tile before its click could land.
  // The grid opened but nothing could ever be selected.
  useClickOutsideEvent(isOpen && close, () => [rootRef.current, contentRef.current])

  // Move focus into the search field once the popover has mounted.
  useEffect(() => {
    if (isOpen) searchRef.current?.focus()
  }, [isOpen])

  const commit = useCallback(
    (name: string) => {
      onChange(set(name))
      close()
    },
    [close, onChange],
  )

  const handleClear = useCallback(() => {
    onChange(unset())
    close()
  }, [close, onChange])

  const handleSearchKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      const lastIndex = results.length - 1
      if (lastIndex < 0) return

      const move = (next: number) => {
        event.preventDefault()
        setActiveIndex(Math.max(0, Math.min(lastIndex, next)))
      }

      switch (event.key) {
        case 'ArrowRight':
          return move(safeActiveIndex + 1)
        case 'ArrowLeft':
          return move(safeActiveIndex - 1)
        case 'ArrowDown':
          return move(safeActiveIndex + GRID_COLUMNS)
        case 'ArrowUp':
          return move(safeActiveIndex - GRID_COLUMNS)
        case 'Home':
          return move(0)
        case 'End':
          return move(lastIndex)
        case 'Enter': {
          if (!activeIcon) return undefined
          event.preventDefault()
          return commit(activeIcon.name)
        }
        default:
          return undefined
      }
    },
    [activeIcon, safeActiveIndex, commit, results.length],
  )

  const picker = (
    <Box padding={1} ref={contentRef} style={{width: 320}}>
      <Box paddingBottom={1}>
        <TextInput
          aria-activedescendant={activeIcon ? optionId(gridId, activeIcon.name) : undefined}
          aria-controls={gridId}
          aria-expanded
          autoComplete="off"
          fontSize={1}
          icon={SearchIcon}
          id={searchId}
          onChange={(event) => {
            setQuery(event.currentTarget.value)
            setActiveIndex(0)
          }}
          onKeyDown={handleSearchKeyDown}
          placeholder={`Search ${allIcons.length} icons…`}
          ref={searchRef}
          // ARIA 1.2's combobox pattern puts role="combobox" on the text input
          // that owns the listbox. The rule reads it as a redundant role on an
          // <input> and suggests a native <select>, which cannot present a
          // virtualized grid of icon tiles.
          // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
          role="combobox"
          value={query}
        />
      </Box>

      <IconGrid
        activeIndex={safeActiveIndex}
        icons={results}
        id={gridId}
        onActiveIndexChange={setActiveIndex}
        onSelect={commit}
        selectedName={selectedIcon?.name}
      />

      <Flex align="center" justify="space-between" paddingLeft={2} paddingTop={2} paddingY={1}>
        <Text muted size={0}>
          {results.length === allIcons.length
            ? `${allIcons.length} icons`
            : `${results.length} of ${allIcons.length}`}
        </Text>
        {activeIcon && (
          <Text muted size={0} textOverflow="ellipsis">
            {activeIcon.name}
          </Text>
        )}
      </Flex>
    </Box>
  )

  // A stored value that resolves to no icon at all — a name from a much older
  // lucide, or a hand-edited document. Say so rather than rendering an empty
  // card, and offer a way out.
  const unresolved = value && !selectedIcon

  return (
    <div ref={rootRef}>
      <Popover
        constrainSize
        content={picker}
        open={isOpen}
        placement="bottom-start"
        portal
        radius={2}
      >
        <div>
          {selectedIcon && (
            <SelectedIconCard
              elementProps={elementProps}
              icon={selectedIcon}
              onClear={handleClear}
              onReplace={open}
              readOnly={readOnly}
            />
          )}

          {unresolved && (
            <Card border padding={1} radius={2} tone="caution">
              <Flex align="center" gap={1} justify="space-between">
                <Card
                  as="button"
                  disabled={readOnly}
                  flex={1}
                  id={fieldId}
                  onBlur={onBlur}
                  onClick={open}
                  onFocus={onFocus}
                  padding={2}
                  radius={2}
                  ref={fieldRef}
                  title="Replace icon"
                  tone="inherit"
                  type="button"
                >
                  <Text size={1} textOverflow="ellipsis" weight="medium">
                    {value} (not found)
                  </Text>
                </Card>
                {!readOnly && (
                  <Button
                    aria-label="Clear icon"
                    icon={TrashIcon}
                    mode="ghost"
                    onClick={handleClear}
                    tone="critical"
                  />
                )}
              </Flex>
            </Card>
          )}

          {!value && (
            // Same shape as the selected and caution states: the border lives
            // on an outer Card, because `Card as="button"` does not render one,
            // which left the empty field looking like loose text.
            <Card border padding={1} radius={2} tone="default">
              <Card
                aria-describedby={ariaDescribedBy}
                as="button"
                disabled={readOnly}
                id={fieldId}
                onBlur={onBlur}
                onClick={open}
                onFocus={onFocus}
                padding={2}
                radius={2}
                ref={fieldRef}
                style={{width: '100%', ...fieldStyle}}
                tone="inherit"
                type="button"
              >
                <Flex align="center" gap={3}>
                  <SearchIcon />
                  <Text muted size={1}>
                    Select an icon…
                  </Text>
                </Flex>
              </Card>
            </Card>
          )}
        </div>
      </Popover>
    </div>
  )
}

export default LucideIconPicker
