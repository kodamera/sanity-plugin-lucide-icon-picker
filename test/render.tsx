import {LayerProvider, PortalProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {render as rtlRender} from '@testing-library/react'
import type {ReactElement} from 'react'
import type {StringInputProps} from 'sanity'
import {vi} from 'vitest'

const theme = buildTheme()

export const render = (ui: ReactElement) =>
  rtlRender(ui, {
    // Popover renders through a portal, which needs @sanity/ui's portal and
    // layer context. ThemeProvider alone leaves the popover content unmounted.
    wrapper: ({children}) => (
      <ThemeProvider theme={theme}>
        <LayerProvider>
          <PortalProvider element={document.body}>{children}</PortalProvider>
        </LayerProvider>
      </ThemeProvider>
    ),
  })

/**
 * A partial StringInputProps, cast.
 *
 * Sanity ships no public test utilities, and building a real StringInputProps
 * means supplying path, presence, validation, renderDefault and a dozen more
 * fields the picker never touches.
 */
export const inputProps = (
  overrides: {
    value?: string
    readOnly?: boolean
    options?: unknown
    onChange?: ReturnType<typeof vi.fn>
  } = {},
): StringInputProps => {
  const {value, readOnly = false, options = {}, onChange = vi.fn()} = overrides

  return {
    elementProps: {
      'aria-describedby': undefined,
      'id': 'test-icon-field',
      'onBlur': vi.fn(),
      'onChange': vi.fn(),
      'onFocus': vi.fn(),
      'readOnly': readOnly,
      'ref': {current: null},
      'style': {},
    },
    onChange,
    readOnly,
    schemaType: {jsonType: 'string', name: 'lucide-icon', options},
    value,
  } as unknown as StringInputProps
}
