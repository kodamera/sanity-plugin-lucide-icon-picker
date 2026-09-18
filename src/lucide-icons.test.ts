import {describe, expect, it} from 'vitest'

import legacyValuesFixture from '../test/fixtures/legacy-values.json'
import {legacyBrandIcons} from './legacy-brand-icons'

import {
  filterAllowedIcons,
  getAllLucideIcons,
  getLegacyAliasMap,
  getLucideIconsByName,
  resolveLucideIcon,
  searchIcons,
} from './lucide-icons'

// lucide's own canonical kebab-case names, the set <DynamicIcon /> accepts.
const dynamicIconNames = async (): Promise<Set<string>> => {
  const mod = (await import('lucide-react/dynamicIconImports.mjs')) as {
    default: Record<string, unknown>
  }
  return new Set(Object.keys(mod.default))
}

describe('icon enumeration', () => {
  it('returns a large, deduplicated set', () => {
    const icons = getAllLucideIcons()

    expect(icons.length).toBeGreaterThan(1000)
    expect(new Set(icons.map((icon) => icon.name)).size).toBe(icons.length)
  })

  it('emits only kebab-case names', () => {
    const offenders = getAllLucideIcons()
      .map((icon) => icon.name)
      .filter((name) => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name))

    expect(offenders).toEqual([])
  })

  it('excludes non-icon exports', () => {
    const names = new Set(getAllLucideIcons().map((icon) => icon.name))

    expect(names.has('create-lucide-icon')).toBe(false)
    expect(names.has('icons')).toBe(false)
    expect(names.has('lucide-provider')).toBe(false)
    expect(names.has('use-lucide-context')).toBe(false)
  })

  it('caches, so repeated calls are the same array', () => {
    expect(getAllLucideIcons()).toBe(getAllLucideIcons())
  })

  it('gives each icon a stable component identity', () => {
    const [first] = getAllLucideIcons()
    const again = getLucideIconsByName().get(first.name)

    expect(again?.component).toBe(first.component)
  })
})

describe('canonical names', () => {
  // The regression that motivated the rename: toKebabCase never separated
  // digits, so these were stored as names lucide does not recognise and
  // <DynamicIcon /> threw for all 153 of them.
  it.each([
    ['axis-3d', 'axis3-d'],
    ['clock-12', 'clock12'],
    ['grid-2x2', 'grid-2x-2'],
    ['link-2-off', 'link-2off'],
  ])('emits %s, not the legacy %s', (canonical, legacy) => {
    const names = new Set(getAllLucideIcons().map((icon) => icon.name))

    expect(names.has(canonical)).toBe(true)
    expect(names.has(legacy)).toBe(false)
  })

  it('emits nothing that DynamicIcon cannot resolve', async () => {
    const valid = await dynamicIconNames()
    const unresolvable = getAllLucideIcons()
      .map((icon) => icon.name)
      .filter((name) => !valid.has(name))
      // The bundled brand icons are the deliberate exception: lucide deleted
      // them, so they cannot be in lucide's own dynamic import map. The Studio
      // renders them from the copies in ./legacy-brand-icons; a frontend has to
      // handle them itself, which the README documents.
      .filter((name) => !legacyBrandIcons.has(name))

    expect(unresolvable).toEqual([])
  })
})

describe('legacy values', () => {
  it('maps a pre-2.0 name to its canonical icon', () => {
    expect(resolveLucideIcon('axis3-d')?.name).toBe('axis-3d')
    expect(resolveLucideIcon('clock12')?.name).toBe('clock-12')
  })

  it('follows a lucide rename, not just a spelling change', () => {
    // Building2 became BuildingComplex, BarChart2 became ChartNoAxesColumn.
    // Reference identity carries these across; re-deriving the name could not.
    expect(resolveLucideIcon('building2')?.name).toBe('building-complex')
    expect(resolveLucideIcon('bar-chart2')?.name).toBe('chart-no-axes-column')
  })

  it('resolves a canonical name directly', () => {
    expect(resolveLucideIcon('arrow-right')?.name).toBe('arrow-right')
  })

  it('returns undefined for a value that matches nothing', () => {
    expect(resolveLucideIcon('not-a-real-icon-name')).toBeUndefined()
    expect(resolveLucideIcon(undefined)).toBeUndefined()
  })

  it('never aliases over a name that is already valid', () => {
    const byName = getLucideIconsByName()

    for (const legacy of getLegacyAliasMap().keys()) {
      expect(byName.has(legacy)).toBe(false)
    }
  })
})

describe('search', () => {
  it('matches the PascalCase export name', () => {
    // Broken before 2.0: @sanity/ui's Autocomplete re-filtered on the kebab
    // name alone, so "AlarmClockCheck" returned nothing.
    const names = searchIcons(getAllLucideIcons(), 'AlarmClockCheck').map((icon) => icon.name)

    expect(names).toContain('alarm-clock-check')
  })

  it('matches a single word from the middle of a name', () => {
    const names = searchIcons(getAllLucideIcons(), 'clock').map((icon) => icon.name)

    expect(names).toContain('alarm-clock-check')
    expect(names.length).toBeGreaterThan(5)
  })

  it('is case-insensitive and ignores surrounding whitespace', () => {
    expect(searchIcons(getAllLucideIcons(), '  ARROW-right  ').map((i) => i.name)).toContain(
      'arrow-right',
    )
  })

  it('returns everything for an empty query', () => {
    const icons = getAllLucideIcons()

    expect(searchIcons(icons, '   ')).toBe(icons)
  })

  it('returns nothing for gibberish', () => {
    expect(searchIcons(getAllLucideIcons(), 'zzzzzznotanicon')).toEqual([])
  })
})

describe('allowedIcons', () => {
  it('keeps only whitelisted names', () => {
    const filtered = filterAllowedIcons(getAllLucideIcons(), ['info', 'circle-check'])

    expect(filtered.map((icon) => icon.name).toSorted((a, b) => a.localeCompare(b))).toEqual([
      'circle-check',
      'info',
    ])
  })

  it('ignores names that do not exist', () => {
    expect(filterAllowedIcons(getAllLucideIcons(), ['nope-not-real'])).toEqual([])
  })

  it('passes the set straight through when undefined', () => {
    const icons = getAllLucideIcons()

    expect(filterAllowedIcons(icons, undefined)).toBe(icons)
  })
})

describe('backward compatibility with pre-2.0 documents', () => {
  // Every distinct value the 1.x picker could write, generated from
  // lucide-react@0.532.0 — the exact version it shipped against.
  const legacyValues: string[] = legacyValuesFixture

  it('covers every value the old picker could store', () => {
    const unresolvable = legacyValues.filter((value) => !resolveLucideIcon(value))

    // A drop-in replacement: swapping the package must not leave a single
    // existing document showing "(not found)".
    expect(unresolvable).toEqual([])
    expect(legacyValues.length).toBeGreaterThan(1800)
  })

  it('still renders the brand icons lucide deleted in 1.x', () => {
    // These have no component in lucide 1.x at all, so they are bundled.
    const removed = [
      'chrome',
      'codepen',
      'codesandbox',
      'dribbble',
      'facebook',
      'figma',
      'framer',
      'github',
      'gitlab',
      'instagram',
      'linkedin',
      'pocket',
      'rail-symbol',
      'slack',
      'trello',
      'twitch',
      'twitter',
      'youtube',
    ]

    for (const name of removed) {
      const icon = resolveLucideIcon(name)
      expect(icon, `${name} should resolve`).toBeDefined()
      expect(icon?.name).toBe(name)
      expect(typeof icon?.component).not.toBe('undefined')
    }
  })

  it('keeps the restored brand icons searchable by their old names', () => {
    expect(searchIcons(getAllLucideIcons(), 'Facebook').map((i) => i.name)).toContain('facebook')
    expect(searchIcons(getAllLucideIcons(), 'github').map((i) => i.name)).toContain('github')
  })
})

describe('audit script stays in sync', () => {
  it('names exactly the brand icons the plugin bundles', async () => {
    const {REMOVED_BRAND_ICONS} = await import('../scripts/audit-icon-values.mjs')

    expect([...REMOVED_BRAND_ICONS].sort((a: string, b: string) => a.localeCompare(b))).toEqual(
      [...legacyBrandIcons.keys()].sort((a, b) => a.localeCompare(b)),
    )
  })

  it('classifies every legacy value the same way the plugin resolves it', async () => {
    const {classify} = await import('../scripts/audit-icon-values.mjs')
    const disagreements = (legacyValuesFixture as string[]).filter(
      (value) => Boolean(resolveLucideIcon(value)) !== (classify(value).status !== 'unknown'),
    )

    expect(disagreements).toEqual([])
  })
})
