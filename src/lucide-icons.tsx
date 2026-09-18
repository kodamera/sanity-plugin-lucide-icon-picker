import * as LucideIcons from 'lucide-react'
import type {JSX} from 'react'

import type {IconObject, LucideIconComponent} from './types'

/**
 * Non-icon exports, used only if lucide ever drops the `icons` registry and the
 * name-based fallback below has to take over.
 */
const NON_ICON_EXPORTS = new Set([
  'Icon',
  'LucideProvider',
  'createLucideIcon',
  'default',
  'dynamicIconImports',
  'icons',
  'useLucideContext',
])

/**
 * Lucide's canonical kebab-case name for a PascalCase export.
 *
 * The obvious `replace(/([A-Z])/g, '-$1')` is wrong around digits, which is how
 * `Axis3d` used to be stored as `axis3-d` and `Building2` as `building2` —
 * neither of which lucide recognises, so `<DynamicIcon name={value} />` threw
 * for 153 of the names this plugin emitted. The rules, in order:
 *
 * - split a lowercase/uppercase boundary (`ArrowRight` -> `arrow-right`)
 * - split the tail off an acronym (`JSONFile` -> `json-file`)
 * - split before a digit, but only when the preceding letter is not itself
 *   preceded by a digit, so `Grid2x2` stays `grid-2x2` rather than `grid-2-x-2`
 * - split a digit followed by an uppercase letter (`Link2Off` -> `link-2-off`)
 *
 * Verified to reproduce lucide's own name for all 1848 registry entries.
 */
const toKebabCase = (name: string): string =>
  name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/(?<![0-9])([A-Za-z])([0-9])/g, '$1-$2')
    .replace(/([0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()

/**
 * The naming this plugin used before canonical names. Kept solely to build the
 * legacy alias map, so documents written by earlier versions still resolve.
 */
const toLegacyKebabCase = (name: string): string =>
  name
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '')

const splitWords = (kebab: string): string[] => kebab.split('-').filter(Boolean)

/**
 * Every export name that points at a given icon component.
 *
 * lucide exports each icon several times over — the bare name, an `*Icon`
 * suffixed alias, a `Lucide*` prefixed alias, and deprecated renames — and all
 * of them are the *same object reference* as the entry in `LucideIcons.icons`.
 * That reference identity is what lets us group aliases without name guessing.
 */
const buildAliasIndex = (): Map<unknown, string[]> => {
  const index = new Map<unknown, string[]>()

  for (const [name, value] of Object.entries(LucideIcons)) {
    const existing = index.get(value)
    if (existing) {
      existing.push(name)
    } else {
      index.set(value, [name])
    }
  }

  return index
}

/**
 * `LucideIcons.icons` is the canonical registry: one entry per icon, keyed by
 * its PascalCase name.
 *
 * Using it is what makes detection robust. The previous check duck-typed every
 * export as `typeof x === 'object' && '$$typeof' in x && 'render' in x`, i.e. it
 * assumed a `forwardRef` object. `createLucideIcon` does still use `forwardRef`,
 * but React 19 makes that unnecessary — if a future lucide minor drops it, the
 * old check matches *zero* exports and the picker silently empties. Reference
 * identity against the registry does not care how the component is built.
 */
const getIconRegistry = (): Record<string, LucideIconComponent> | null => {
  const {icons} = LucideIcons
  return icons && Object.keys(icons).length > 0 ? icons : null
}

const isComponentLike = (value: unknown): value is LucideIconComponent =>
  typeof value === 'function' || (typeof value === 'object' && value !== null && '$$typeof' in value)

/** Fallback used only if the `icons` registry ever disappears. */
const buildIconsFromExports = (aliases: Map<unknown, string[]>): IconObject[] =>
  Object.entries(LucideIcons).flatMap(([name, value]) => {
    if (NON_ICON_EXPORTS.has(name) || !/^[A-Z]/.test(name) || !isComponentLike(value)) return []

    // Prefer the bare name over its `Lucide*` / `*Icon` duplicates. `slice`
    // rather than `replace`, which removes the first occurrence of the string
    // anywhere rather than the affix.
    if (name.startsWith('Lucide') && name.slice(6) in LucideIcons) return []
    if (name.endsWith('Icon') && name.slice(0, -4) in LucideIcons) return []

    return [buildIcon(name, value, aliases)]
  })

const buildIcon = (
  pascalName: string,
  component: LucideIconComponent,
  aliases: Map<unknown, string[]>,
): IconObject => {
  const name = toKebabCase(pascalName)
  const exportNames = aliases.get(component) ?? [pascalName]

  const tags = new Set<string>([name, ...splitWords(name)])
  for (const exportName of exportNames) {
    tags.add(exportName)
    tags.add(exportName.toLowerCase())
    const kebab = toKebabCase(exportName)
    tags.add(kebab)
    for (const word of splitWords(kebab)) tags.add(word)
  }

  const tagList = [...tags]

  return {
    name,
    component,
    tags: tagList,
    searchText: tagList.join('\n').toLowerCase(),
  }
}

let cachedIcons: readonly IconObject[] | null = null

/**
 * Every selectable icon, built once per module rather than once per mounted
 * picker. The previous code walked all 6331 exports and allocated ~30k tag
 * strings on every mount.
 */
export const getAllLucideIcons = (): readonly IconObject[] => {
  if (!cachedIcons) {
    const aliases = buildAliasIndex()
    const registry = getIconRegistry()

    cachedIcons = registry
      ? Object.entries(registry).map(([name, component]) => buildIcon(name, component, aliases))
      : buildIconsFromExports(aliases)
  }

  return cachedIcons
}

let cachedByName: ReadonlyMap<string, IconObject> | null = null

/** O(1) lookup by canonical name. */
export const getLucideIconsByName = (): ReadonlyMap<string, IconObject> => {
  if (!cachedByName) {
    cachedByName = new Map(getAllLucideIcons().map((icon) => [icon.name, icon]))
  }

  return cachedByName
}

let cachedLegacyAliases: ReadonlyMap<string, string> | null = null

/**
 * Maps a value written by an earlier version of this plugin to the canonical
 * name, e.g. `axis3-d` -> `axis-3d`, `building2` -> `building-complex`.
 *
 * Resolution goes through the component reference, not through the alias's own
 * spelling. Re-deriving would fail exactly where it matters: `Axis3D` is a
 * deprecated alias of `Axis3d`, and running the new transform over `Axis3D`
 * yields `axis-3-d`, which is not an icon. Only the shared component identity
 * ties the alias back to the canonical `axis-3d`.
 *
 * Computed from the live export list rather than checked in as a fixture, so it
 * cannot drift. Names that are already valid are never aliased over.
 */
export const getLegacyAliasMap = (): ReadonlyMap<string, string> => {
  if (!cachedLegacyAliases) {
    const byName = getLucideIconsByName()

    const canonicalByComponent = new Map<unknown, string>()
    for (const icon of getAllLucideIcons()) canonicalByComponent.set(icon.component, icon.name)

    const aliases = new Map<string, string>()

    for (const [exportName, value] of Object.entries(LucideIcons)) {
      if (!/^[A-Z]/.test(exportName) || NON_ICON_EXPORTS.has(exportName)) continue

      const canonical = canonicalByComponent.get(value)
      if (!canonical) continue

      const legacy = toLegacyKebabCase(exportName)
      if (legacy !== canonical && !byName.has(legacy)) aliases.set(legacy, canonical)
    }

    cachedLegacyAliases = aliases
  }

  return cachedLegacyAliases
}

/**
 * Resolves a stored value, transparently upgrading a legacy name.
 * Returns `undefined` when the value matches no icon at all.
 */
export const resolveLucideIcon = (value: string | undefined): IconObject | undefined => {
  if (!value) return undefined

  const byName = getLucideIconsByName()
  const direct = byName.get(value)
  if (direct) return direct

  const canonical = getLegacyAliasMap().get(value)
  return canonical ? byName.get(canonical) : undefined
}

/** Restricts the set to a whitelist, preserving order. */
export const filterAllowedIcons = (
  icons: readonly IconObject[],
  allowedIcons: string[] | undefined,
): readonly IconObject[] => {
  if (!allowedIcons) return icons

  const allowed = new Set(allowedIcons)
  return icons.filter((icon) => allowed.has(icon.name))
}

/** Substring match over every name, alias and word. Empty query matches all. */
export const searchIcons = (
  icons: readonly IconObject[],
  query: string,
): readonly IconObject[] => {
  const term = query.trim().toLowerCase()
  if (!term) return icons

  return icons.filter((icon) => icon.searchText.includes(term))
}

/**
 * Renders a Lucide icon at a given size.
 *
 * The icon arrives as a prop rather than being closed over by a per-icon
 * wrapper. Previously each option carried its own freshly built
 * `() => <Icon width="1.5em" height="1.5em" />`, so React saw a brand-new
 * element type on every call and remounted the icon subtree instead of
 * re-rendering it. This component's identity is fixed at module scope.
 */
export const IconGlyph = ({
  icon: Icon,
  size = '1.5em',
}: {
  icon: LucideIconComponent
  size?: string | number
}): JSX.Element => <Icon aria-hidden height={size} width={size} />
