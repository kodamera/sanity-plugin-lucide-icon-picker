import { defineConfig } from '@sanity/pkg-utils';

export default defineConfig({
  dist: 'dist',
  tsconfig: 'tsconfig.dist.json',

  // No `external` array: it was deprecated in pkg-utils v12 and warns on every
  // build. tsdown externalises `dependencies` and `peerDependencies`
  // automatically, which covers react, react-dom, sanity, @sanity/ui,
  // @sanity/icons and lucide-react.
  //
  // No `minify`: v13 defaults to false, and the output is already constant
  // folded and tree-shaken. Minifying a library only costs consumers readable
  // stack traces — their own bundler minifies node_modules again anyway.

  // Studio-only code that consumers never ship to the browser, so a 19 kB map
  // per build is pure tarball weight. Also stops the generated index.d.ts
  // referencing an index.d.ts.map that is not emitted.
  sourcemap: false,

  tsdoc: {
    rules: {
      'ae-incompatible-release-tags': 'off',
      'ae-internal-missing-underscore': 'off',
      'ae-missing-release-tag': 'off',
    },
  },
});
