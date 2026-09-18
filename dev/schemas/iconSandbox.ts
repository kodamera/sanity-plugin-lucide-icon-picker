import {defineField, defineType} from 'sanity'

/**
 * One document carrying every case worth eyeballing. The field layout mirrors
 * the manual verification checklist:
 *
 * - `icon` + `secondaryIcon` are two pickers on ONE document, which is what
 *   surfaced the duplicate `id="lucide-icon-picker"` bug. Each field's label
 *   must focus its own input, and arrow keys must move the highlight in the
 *   field you opened, not the other one.
 * - `restrictedIcon` exercises the `allowedIcons` whitelist.
 * - `readOnlyIcon` must stay focusable and its name selectable.
 * - `legacyIcon` is seeded with a pre-2.0 value that no longer exists in
 *   lucide (`axis3-d`, now `axis-3d`). It must render a normal card via the
 *   legacy alias map, NOT the "(not found)" caution state.
 * - `brokenIcon` is seeded with a value that resolves to nothing at all, so
 *   the caution state itself can be checked.
 */
export const iconSandbox = defineType({
  name: 'iconSandbox',
  title: 'Icon sandbox',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      initialValue: 'Icon sandbox',
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      description: 'Plain picker. Search "AlarmClockCheck" — PascalCase must return results.',
      type: 'lucide-icon',
    }),
    defineField({
      name: 'secondaryIcon',
      title: 'Secondary icon',
      description: 'A second picker on the same document, to prove the field ids do not collide.',
      type: 'lucide-icon',
    }),
    defineField({
      name: 'restrictedIcon',
      title: 'Restricted icon',
      description: 'Only the four names in allowedIcons should be offered.',
      type: 'lucide-icon',
      options: {
        allowedIcons: ['facebook', 'instagram', 'linkedin', 'youtube'],
      },
    }),
    defineField({
      name: 'readOnlyIcon',
      title: 'Read-only icon',
      type: 'lucide-icon',
      readOnly: true,
      initialValue: 'lock',
    }),
    defineField({
      name: 'legacyIcon',
      title: 'Legacy value',
      description: 'Stored as "axis3-d" (pre-2.0). Must resolve to axis-3d, not show as missing.',
      type: 'lucide-icon',
      initialValue: 'axis3-d',
    }),
    defineField({
      name: 'brokenIcon',
      title: 'Unresolvable value',
      description: 'Stored as nonsense. Must show the caution "(not found)" card.',
      type: 'lucide-icon',
      initialValue: 'not-a-real-icon-name',
    }),
  ],
  preview: {
    select: {title: 'title', icon: 'icon'},
    prepare: ({title, icon}) => ({title: title ?? 'Icon sandbox', subtitle: icon}),
  },
})
