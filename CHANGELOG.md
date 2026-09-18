# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 2.0.0

Forked from `contentwrap/sanity-plugin-lucide-icon-picker` and published as
`@kodamera/sanity-plugin-lucide-icon-picker`. The original plugin is the work of
[ContentWrap](https://contentwrap.io) and remains MIT licensed.

### Breaking

- Targets `@sanity/ui` v4 and `sanity` 6.10+ only. On Sanity 6.9 and below, use
  the original `sanity-plugin-lucide-icon-picker` instead.
- Peer ranges are now `sanity ^6.10.0` and `react ^19.2.2`. `@sanity/ui ^4.0.0`
  and `@sanity/icons ^5.0.0` moved from peer to regular dependencies, which
  `@sanity/pkg-utils` requires for Studio packages.
- **Stored values are now Lucide's own canonical names.** Values written by
  earlier versions still resolve, transparently, so existing documents keep
  working and re-saving a field upgrades it.

  The old naming never separated digits, so `Axis3d` was stored as `axis3-d` and
  `Building2` as `building2`. Lucide recognises neither, which meant 153 of the
  2,108 emitted values made the documented
  `<DynamicIcon name={value} />` usage throw
  `Name in Lucide DynamicIcon not found`. Values are now taken from Lucide's
  canonical registry and verified against every key in `dynamicIconImports`.

  Aliases also collapse into one entry per icon — 1,848 selectable Lucide icons
  (1,866 including the restored brand icons) instead of 2,108 rows with
  duplicates — and deprecated names become search terms, so
  typing an old name still finds the icon.
- `lucide-react` 0.532 → 1.47.

### Added

- **Drop-in compatibility with the upstream plugin.** All 1,837 distinct values
  the previous version could store resolve, asserted by a test over a fixture
  generated from lucide-react 0.532.0. The plugin never rewrites a value on
  read, so opening a document cannot alter data.
- The 18 brand icons Lucide deleted in 1.x — `chrome`, `codepen`,
  `codesandbox`, `dribbble`, `facebook`, `figma`, `framer`, `github`, `gitlab`,
  `instagram`, `linkedin`, `pocket`, `rail-symbol`, `slack`, `trello`,
  `twitch`, `twitter`, `youtube` — are bundled with the plugin, rebuilt from
  path data copied from lucide-react 0.532.0 (ISC licensed). They stay pickable
  and searchable. They are frozen, and because they no longer exist upstream,
  `DynamicIcon` cannot load them; render those explicitly on the frontend.
- `scripts/audit-icon-values.mjs`, a read-only CLI that reports every distinct
  icon value in a dataset as `ok`, `renamed`, `brand` or `unknown`.
- The picker is now a searchable, virtualized grid of icon tiles rather than a
  dropdown list. All 1,866 icons are browsable; the old list was capped at 200
  unsearched and 100 searched.
- Keyboard navigation across the grid — arrow keys, `Home`/`End` and `Enter` —
  driven from the search field, with `aria-activedescendant` following the
  highlight.
- A dev Studio in `dev/` for working on the plugin locally.
- A Vitest suite, and CI running lint, typecheck, tests and build on Node 24
  and 26.

### Fixed

- **Searching by PascalCase name returned nothing.** The plugin matched against
  tags correctly and `@sanity/ui`'s `Autocomplete` then re-filtered the results
  against the kebab-case name alone, discarding every tag-only match. Typing
  `AlarmClockCheck` produced an empty list.
- **Two pickers on one document collided.** The input hardcoded
  `id="lucide-icon-picker"` and ignored `elementProps`, so both fields emitted
  the same element id and the derived listbox and option ids clashed. In the
  selected state nothing carried the id at all, leaving the field label's
  `htmlFor` pointing at nothing.
- **The selected-icon card was unreachable by keyboard.** It was a `div` with an
  `onClick` — no role, no `tabIndex`, no accessible name. It is now a real
  button.
- `Menu`, `MenuItem`, `Popover` and `Autocomplete` are imported from their
  `@sanity/ui` subpaths, and `EllipsisHorizontalIcon`, `SyncIcon` and
  `TrashIcon` from their `@sanity/icons` subpaths. v4 and v5 removed them from
  the package root, so the previous imports failed to build — and where a
  bundler resolved them anyway, a second copy of `@sanity/ui` was pulled into
  the Studio, breaking layout in unrelated plugins.
- The build shipped untransformed JSX in `dist/index.js`, which Vite refused to
  parse. The plugin could not be loaded at all.
- The Escape handler for the options menu listened on `document`
  unconditionally, so it closed the menu even when a dialog was stacked above
  it, and handled neither click-outside nor focus restore. It now uses
  `MenuButton`.
- Read-only fields use `readOnly` rather than `disabled`, matching Sanity's own
  string input, so the value stays focusable and selectable.

### Changed

- Icon detection keys off Lucide's canonical registry instead of duck-typing
  exports as `forwardRef` objects. React 19 makes `forwardRef` optional, so a
  future Lucide minor dropping it would have matched zero exports and silently
  emptied the picker.
- The icon set is enumerated once per module rather than once per mounted field;
  the previous code walked 6,331 exports and allocated roughly 30,000 strings on
  every mount.
- Icon options keep a stable component identity, so React re-renders them
  instead of remounting the subtree.
- Search no longer debounces. The 300 ms delay existed to spare an unvirtualized
  list.
- Build and lint toolchain: `@sanity/pkg-utils` 7 → 13, `@sanity/plugin-kit`
  4 → 10, TypeScript 5.8 → 6.0, and ESLint + Prettier replaced by oxlint +
  oxfmt, following plugin-kit v8. Contributors now need Node 24.11+; consumers
  are unaffected.
- Removed the Sanity Studio v2 compatibility shim (`sanity.json`,
  `v2-incompatible.js`), which targeted a version this plugin cannot be
  installed on.

## [1.0.3] - 2025-08-02

### Improved

- Improved package size by reorganizing dependencies to move Sanity packages to peer dependencies
- Improved build configuration by disabling source maps for smaller bundle size
- Improved TypeScript configuration by fixing treeshake configuration errors
- Improved dependency externalization for better package optimization
- Updated package to use ESM module type for modern JavaScript compatibility
- Removed React and Sanity from devDependencies to reduce bundle size

## [1.0.0] - 2025-07-29

### Added

- Initial release
