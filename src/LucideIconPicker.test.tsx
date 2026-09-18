import {screen, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import LucideIconPicker from './LucideIconPicker'
import {inputProps, render} from '../test/render'

/**
 * Queries inside the popover must pass `hidden: true`.
 *
 * @sanity/ui's Popover keeps its content `hidden` until floating-ui has
 * measured and positioned it. jsdom has no layout engine, so that never
 * happens and the content stays hidden — which Testing Library omits from the
 * accessibility tree by default. The content is present and correct, and the
 * popover is visible in a real browser; this is purely a jsdom artifact.
 */
const inPopover = {hidden: true} as const

const openPicker = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', {name: /select an icon/i}))
  return screen.getByRole('combobox', inPopover)
}

describe('empty state', () => {
  it('offers a keyboard-reachable trigger', () => {
    render(<LucideIconPicker {...inputProps()} />)

    const trigger = screen.getByRole('button', {name: /select an icon/i})
    expect(trigger).toBeInTheDocument()
    expect(trigger).not.toBeDisabled()
  })

  it('opens a searchable listbox', async () => {
    const user = userEvent.setup()
    render(<LucideIconPicker {...inputProps()} />)

    const search = await openPicker(user)

    expect(search).toHaveAttribute('aria-controls')
    expect(screen.getByRole('listbox', inPopover)).toBeInTheDocument()
  })
})

describe('selecting', () => {
  it('narrows the grid as you type and stores the clicked name', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<LucideIconPicker {...inputProps({onChange})} />)

    const search = await openPicker(user)
    await user.type(search, 'arrow-right')

    const option = within(screen.getByRole('listbox', inPopover)).getAllByRole('option', inPopover)[0]
    await user.click(option)

    expect(onChange).toHaveBeenCalledTimes(1)
    // A `set` patch carrying a canonical name.
    const [patch] = onChange.mock.calls[0]
    expect(patch).toMatchObject({type: 'set'})
    expect(typeof patch.value).toBe('string')
  })

  it('finds an icon by its PascalCase name', async () => {
    const user = userEvent.setup()
    render(<LucideIconPicker {...inputProps()} />)

    const search = await openPicker(user)
    await user.type(search, 'AlarmClockCheck')

    const options = within(screen.getByRole('listbox', inPopover)).getAllByRole('option', inPopover)
    expect(options.length).toBeGreaterThan(0)
    expect(options.some((el) => el.getAttribute('title') === 'alarm-clock-check')).toBe(true)
  })

  it('says so when nothing matches', async () => {
    const user = userEvent.setup()
    render(<LucideIconPicker {...inputProps()} />)

    const search = await openPicker(user)
    await user.type(search, 'zzzzzznotanicon')

    expect(screen.getByText(/no icons match/i)).toBeInTheDocument()
  })

  it('selects the highlighted icon with Enter', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<LucideIconPicker {...inputProps({onChange})} />)

    const search = await openPicker(user)
    await user.type(search, 'arrow-right')
    await user.keyboard('{Enter}')

    expect(onChange).toHaveBeenCalledTimes(1)
  })
})

describe('selected state', () => {
  it('shows the stored icon and a replace control', () => {
    render(<LucideIconPicker {...inputProps({value: 'arrow-right'})} />)

    expect(screen.getByRole('button', {name: /arrow-right/i})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /icon options/i})).toBeInTheDocument()
  })

  it('resolves a pre-2.0 value instead of reporting it missing', () => {
    render(<LucideIconPicker {...inputProps({value: 'axis3-d'})} />)

    expect(screen.getByRole('button', {name: /axis-3d/i})).toBeInTheDocument()
    expect(screen.queryByText(/not found/i)).not.toBeInTheDocument()
  })

  it('flags a value that matches no icon at all', () => {
    render(<LucideIconPicker {...inputProps({value: 'not-a-real-icon-name'})} />)

    expect(screen.getByText(/not-a-real-icon-name \(not found\)/i)).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /clear icon/i})).toBeInTheDocument()
  })

  it('clears through the options menu', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<LucideIconPicker {...inputProps({value: 'arrow-right', onChange})} />)

    await user.click(screen.getByRole('button', {name: /icon options/i}))
    await user.click(await screen.findByRole('menuitem', {name: /clear/i, ...inPopover}))

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({type: 'unset'}))
  })
})

describe('readOnly', () => {
  it('disables the trigger but keeps the field present', () => {
    render(<LucideIconPicker {...inputProps({value: 'arrow-right', readOnly: true})} />)

    expect(screen.getByRole('button', {name: /arrow-right/i})).toBeDisabled()
    expect(screen.queryByRole('button', {name: /icon options/i})).not.toBeInTheDocument()
  })
})

describe('allowedIcons', () => {
  it('offers only the whitelisted icons', async () => {
    const user = userEvent.setup()
    render(<LucideIconPicker {...inputProps({options: {allowedIcons: ['info', 'circle-check']}})} />)

    const search = await openPicker(user)
    expect(search).toHaveAttribute('placeholder', expect.stringContaining('2'))

    const titles = within(screen.getByRole('listbox', inPopover))
      .getAllByRole('option', inPopover)
      .map((el) => el.getAttribute('title'))
    expect(titles.toSorted((a, b) => String(a).localeCompare(String(b)))).toEqual([
      'circle-check',
      'info',
    ])
  })
})

describe('keyboard navigation', () => {
  // The grid is never focused: this is the ARIA 1.2 combobox pattern, so focus
  // stays on the search input and aria-activedescendant tracks the highlight.
  const activeName = () =>
    screen.getByRole('combobox', inPopover).getAttribute('aria-activedescendant')

  it('moves the highlight along a row with Left/Right', async () => {
    const user = userEvent.setup()
    render(<LucideIconPicker {...inputProps()} />)

    await openPicker(user)
    const first = activeName()

    await user.keyboard('{ArrowRight}')
    const second = activeName()
    expect(second).not.toBe(first)

    await user.keyboard('{ArrowLeft}')
    expect(activeName()).toBe(first)
  })

  it('moves a whole row with Up/Down', async () => {
    const user = userEvent.setup()
    render(<LucideIconPicker {...inputProps()} />)

    await openPicker(user)
    const first = activeName()

    await user.keyboard('{ArrowDown}')
    const nextRow = activeName()
    expect(nextRow).not.toBe(first)

    await user.keyboard('{ArrowUp}')
    expect(activeName()).toBe(first)
  })

  it('jumps to the ends with Home and End', async () => {
    const user = userEvent.setup()
    render(<LucideIconPicker {...inputProps({options: {allowedIcons: ['info', 'circle-check']}})} />)

    await openPicker(user)
    const first = activeName()

    await user.keyboard('{End}')
    expect(activeName()).not.toBe(first)

    await user.keyboard('{Home}')
    expect(activeName()).toBe(first)
  })

  it('does not run past either end of the results', async () => {
    const user = userEvent.setup()
    render(<LucideIconPicker {...inputProps({options: {allowedIcons: ['info', 'circle-check']}})} />)

    await openPicker(user)

    // Already at index 0; Left must not wrap or go negative.
    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    const atStart = activeName()
    expect(atStart).toBeTruthy()

    // Far past the end of a two-icon list.
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}')
    expect(activeName()).toBeTruthy()
  })

  it('commits the icon the highlight landed on', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<LucideIconPicker {...inputProps({onChange})} />)

    const search = await openPicker(user)
    await user.type(search, 'arrow')
    await user.keyboard('{ArrowRight}')

    const highlighted = activeName()?.replace('test-icon-field-grid-option-', '')
    await user.keyboard('{Enter}')

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({value: highlighted}))
  })
})

describe('dismissing', () => {
  // @sanity/ui's Popover keeps its content mounted once it has been opened, so
  // "no longer in the document" is not the signal. Focus returning to the field
  // is: it only happens on a keyboard dismiss.
  it('closes on Escape and returns focus to the field', async () => {
    const user = userEvent.setup()
    render(<LucideIconPicker {...inputProps()} />)

    const trigger = screen.getByRole('button', {name: /select an icon/i})
    await user.click(trigger)
    expect(screen.getByRole('combobox', inPopover)).toHaveFocus()

    await user.keyboard('{Escape}')

    expect(trigger).toHaveFocus()
  })

  it('closes on Escape even when the search matches nothing', async () => {
    const user = userEvent.setup()
    render(<LucideIconPicker {...inputProps()} />)

    const trigger = screen.getByRole('button', {name: /select an icon/i})
    const search = await openPicker(user)
    await user.type(search, 'zzzzzznotanicon')
    expect(screen.getByText(/no icons match/i)).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(trigger).toHaveFocus()
  })

  it('does not commit a value when dismissed', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<LucideIconPicker {...inputProps({onChange})} />)

    const search = await openPicker(user)
    await user.type(search, 'arrow')
    await user.keyboard('{Escape}')

    expect(onChange).not.toHaveBeenCalled()
  })
})
