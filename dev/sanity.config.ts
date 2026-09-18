import {lucideIconPicker} from '@kodamera/sanity-plugin-lucide-icon-picker'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

import {schemaTypes} from './schemas'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID

if (!projectId) {
  throw new Error(
    'SANITY_STUDIO_PROJECT_ID is not set. Copy dev/.env.example to dev/.env and fill it in.',
  )
}

export default defineConfig({
  name: 'default',
  title: 'Lucide Icon Picker — dev',

  projectId,
  dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',

  plugins: [lucideIconPicker(), structureTool()],

  schema: {types: schemaTypes},
})
