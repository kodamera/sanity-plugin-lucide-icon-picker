# Changelog

## 2.0.0

Forked from `contentwrap/sanity-plugin-lucide-icon-picker` and published as
`@kodamera/sanity-plugin-lucide-icon-picker`.

### Breaking

- Targets `@sanity/ui` v4 and `sanity` 6.10+ only. On Sanity 6.9 and below, use
  the original `sanity-plugin-lucide-icon-picker` instead.
- Peer ranges are now `@sanity/ui ^4.0.0`, `@sanity/icons ^5.0.0`,
  `sanity ^6.10.0`, `react ^19`.

### Fixed

- `Menu`, `MenuItem`, `Popover` and `Autocomplete` are imported from their
  `@sanity/ui` subpaths (`/menu`, `/popover`, `/autocomplete`). v4 removed them
  from the package root, so the previous imports failed to build — and where a
  bundler resolved them anyway, a second copy of `@sanity/ui` was pulled into
  the Studio, breaking layout in unrelated plugins.
- `EllipsisHorizontalIcon`, `SyncIcon` and `TrashIcon` are imported from their
  `@sanity/icons` subpaths, which v5 requires for the same reason.

### Changed

- `lucide-react` 0.532 → 1.47. Icon enumeration is unaffected; 6325 of 6331
  exports still resolve as icons.


All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
