import sanityPluginKitOxlint from '@sanity/plugin-kit/oxlint'
import {defineConfig} from 'oxlint'

export default defineConfig({
  extends: [sanityPluginKitOxlint],
  // `ignorePatterns` do not propagate through `extends`, so spread them.
  ignorePatterns: [...(sanityPluginKitOxlint.ignorePatterns ?? [])],
  overrides: [
    {
      files: ['src/lucide-icons.tsx'],
      rules: {
        // Enumerating the Lucide icon set means reading `LucideIcons[name]`
        // with a name discovered at runtime. A namespace import indexed by a
        // computed key is the whole point of this module, and the rule cannot
        // validate it by design.
        'import/namespace': 'off',
      },
    },
    {
      // TEMPORARY: the current enumeration casts through
      // `as keyof typeof LucideIcons` and `ComponentType<any>`, and the picker
      // casts `schemaType.options`. All of them are removed by the typed
      // rewrite in the next commit, and so is this override.
      files: ['src/lucide-icons.tsx', 'src/LucideIconPicker.tsx'],
      rules: {
        'typescript/no-unsafe-type-assertion': 'off',
      },
    },
  ],
})
