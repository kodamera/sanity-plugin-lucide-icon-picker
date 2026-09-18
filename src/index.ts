/*!
 * @kodamera/sanity-plugin-lucide-icon-picker
 *
 * Originally created by ContentWrap (https://contentwrap.io) as
 * sanity-plugin-lucide-icon-picker. This fork is maintained by
 * Kodamera (https://kodamera.se).
 *
 * MIT License. Copyright (c) 2025 ContentWrap.
 * Copyright (c) 2026 Kodamera AB (fork maintenance).
 */

import { definePlugin, defineType } from 'sanity';

import LucideIconPicker from './LucideIconPicker';

export type { LucideIconPickerOptions, LucideIconPickerValue } from './types';

/**
 * Sanity schema type definition for Lucide icons
 * @public
 */
export const lucideIconType = defineType({
  title: 'Lucide Icon',
  name: 'lucide-icon',
  type: 'string',
  components: { input: LucideIconPicker },
});

/**
 * Sanity plugin for Lucide icon picker
 * @public
 */
export const lucideIconPicker = definePlugin(() => {
  return {
    name: 'sanity-plugin-lucide-icon-picker',
    schema: {
      types: [lucideIconType],
    },
  };
});
