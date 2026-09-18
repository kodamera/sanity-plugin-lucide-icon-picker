import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {SyncIcon} from '@sanity/icons/Sync'
import {TrashIcon} from '@sanity/icons/Trash'
import {Box, Button, Card, Flex, Text} from '@sanity/ui'
import {Menu, MenuButton, MenuItem} from '@sanity/ui/menu'
import type {JSX} from 'react'
import type {StringInputProps} from 'sanity'

import {IconGlyph} from './lucide-icons'
import type {IconObject} from './types'

export interface SelectedIconCardProps {
  icon: IconObject
  onReplace: () => void
  onClear: () => void
  readOnly?: boolean
  elementProps: StringInputProps['elementProps']
}

export const SelectedIconCard = ({
  icon,
  onReplace,
  onClear,
  readOnly = false,
  elementProps,
}: SelectedIconCardProps): JSX.Element => {
  const {id, ref, onFocus, onBlur, style, 'aria-describedby': ariaDescribedBy} = elementProps

  return (
    <Card border padding={1} radius={2} tone="default">
      <Flex align="center" gap={1} justify="space-between">
        {/*
          A real <button>, not an onClick on the Card. The Card renders a div,
          so the old version had no role, no tabIndex, no keyboard activation
          and no accessible name — replacing an icon was impossible with a
          keyboard or a screen reader. It also carries elementProps.id, which
          is what the surrounding FormField label points at with htmlFor.
        */}
        <Card
          aria-describedby={ariaDescribedBy}
          as="button"
          disabled={readOnly}
          flex={1}
          id={id}
          onBlur={onBlur}
          onClick={onReplace}
          onFocus={onFocus}
          padding={2}
          radius={2}
          ref={ref}
          style={style}
          title="Replace icon"
          tone="inherit"
          type="button"
        >
          <Flex align="center" gap={3}>
            <IconGlyph icon={icon.component} />
            <Text size={1} textOverflow="ellipsis" weight="medium">
              {icon.name}
            </Text>
          </Flex>
        </Card>

        {!readOnly && (
          <Box>
            <MenuButton
              button={
                <Button
                  aria-label="Icon options"
                  icon={EllipsisHorizontalIcon}
                  mode="bleed"
                  padding={2}
                />
              }
              id={`${id}-menu`}
              menu={
                <Menu>
                  <MenuItem icon={SyncIcon} onClick={onReplace} text="Replace" />
                  <MenuItem icon={TrashIcon} onClick={onClear} text="Clear" tone="critical" />
                </Menu>
              }
              popover={{constrainSize: true, placement: 'bottom-end', portal: true}}
            />
          </Box>
        )}
      </Flex>
    </Card>
  )
}
