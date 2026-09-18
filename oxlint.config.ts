import sanityPluginKitOxlint from '@sanity/plugin-kit/oxlint'
import {defineConfig} from 'oxlint'

export default defineConfig({
  extends: [sanityPluginKitOxlint],
  // `ignorePatterns` do not propagate through `extends`, so spread them.
  ignorePatterns: [
    ...(sanityPluginKitOxlint.ignorePatterns ?? []),
    // The dev studio is a separate package with its own node_modules, so the
    // type-aware rules here cannot resolve its imports.
    'dev/**',
  ],
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
      // Test doubles for browser APIs jsdom does not implement, and partial
      // Sanity prop objects, cannot be built without assertions — constructing
      // a real StringInputProps or a spec-complete ResizeObserverEntry would be
      // all ceremony and no coverage.
      files: ['test/**', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
      rules: {
        'typescript/no-unnecessary-type-assertion': 'off',
        'typescript/no-unsafe-type-assertion': 'off',
      },
    },
  ],
})
