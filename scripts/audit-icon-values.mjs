#!/usr/bin/env node
/**
 * Audits a Sanity dataset for `lucide-icon` values before or after upgrading to
 * @kodamera/sanity-plugin-lucide-icon-picker v2.
 *
 * Classifies every stored value as:
 *   ok         already a canonical lucide name; nothing changes
 *   renamed    resolves, but re-picking the field would write a new spelling
 *   brand      a brand icon lucide deleted in 1.x; rendered from the copies
 *              bundled with this plugin, but lucide's DynamicIcon cannot load it
 *   unknown    matches no icon at all; needs a human
 *
 * Usage:
 *   node scripts/audit-icon-values.mjs --project <id> --dataset <name> \
 *     [--token <token>] [--query '<groq returning strings>']
 *
 * Reads only. Never writes to the dataset.
 */
import * as LucideIcons from 'lucide-react'

/**
 * Brand icons lucide deleted in 1.x. A frozen list — lucide will not remove
 * these again, and this script stays dependency-free by naming them here rather
 * than importing the plugin's bundle. src/lucide-icons.test.ts asserts this
 * matches what the plugin actually bundles.
 */
export const REMOVED_BRAND_ICONS = [
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

/** Lucide's canonical kebab-case name. Mirrors src/lucide-icons.tsx. */
export const toKebabCase = (name) =>
  name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/(?<![0-9])([A-Za-z])([0-9])/g, '$1-$2')
    .replace(/([0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()

/** The naming this plugin used before v2. Mirrors src/lucide-icons.tsx. */
export const toLegacyKebabCase = (name) =>
  name
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '')

const buildIndex = () => {
  const canonicalByComponent = new Map(
    Object.entries(LucideIcons.icons ?? {}).map(([name, component]) => [
      component,
      toKebabCase(name),
    ]),
  )

  const canonical = new Set(canonicalByComponent.values())
  const aliases = new Map()

  for (const [exportName, value] of Object.entries(LucideIcons)) {
    if (!/^[A-Z]/.test(exportName)) continue

    const target = canonicalByComponent.get(value)
    if (!target) continue

    const legacy = toLegacyKebabCase(exportName)
    if (legacy !== target && !canonical.has(legacy)) aliases.set(legacy, target)
  }

  return {aliases, brand: new Set(REMOVED_BRAND_ICONS), canonical}
}

const index = buildIndex()

/** Classify one stored value. */
export const classify = (value) => {
  if (index.brand.has(value)) return {status: 'brand', value}
  if (index.canonical.has(value)) return {status: 'ok', value}

  const target = index.aliases.get(value)
  if (target) return {becomes: target, status: 'renamed', value}

  return {status: 'unknown', value}
}

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? fallback : process.argv[i + 1]
}

const main = async () => {
  const projectId = arg('project')
  const dataset = arg('dataset', 'production')
  const token = arg('token', process.env.SANITY_API_READ_TOKEN)

  if (!projectId) {
    console.error('Missing --project <id>. See the header of this file for usage.')
    process.exit(1)
  }

  // Every string field whose value looks like a stored icon name. Narrow this
  // with --query if your dataset is large or has unrelated kebab-case strings.
  const query =
    arg('query') ??
    `*[defined(_type)]{...}[]`

  const url = new URL(`https://${projectId}.api.sanity.io/v2024-01-01/data/query/${dataset}`)
  url.searchParams.set('query', query)

  const response = await fetch(url, {
    headers: token ? {Authorization: `Bearer ${token}`} : {},
  })

  if (!response.ok) {
    console.error(`Query failed: ${response.status} ${await response.text()}`)
    process.exit(1)
  }

  const {result} = await response.json()

  // Walk whatever came back and collect strings that resolve to an icon.
  const counts = new Map()
  const walk = (node) => {
    if (typeof node === 'string') {
      const {status} = classify(node)
      if (status !== 'unknown') counts.set(node, (counts.get(node) ?? 0) + 1)
      return
    }
    if (Array.isArray(node)) return node.forEach(walk)
    if (node && typeof node === 'object') return Object.values(node).forEach(walk)
  }
  walk(result)

  const rows = [...counts.entries()]
    .map(([value, count]) => Object.assign(classify(value), {count}))
    .sort((a, b) => a.status.localeCompare(b.status) || b.count - a.count)

  const byStatus = (status) => rows.filter((row) => row.status === status)

  console.log(`\nScanned ${dataset}: ${rows.length} distinct icon values\n`)

  for (const status of ['unknown', 'brand', 'renamed', 'ok']) {
    const group = byStatus(status)
    if (group.length === 0) continue

    console.log(`${status.toUpperCase()} (${group.length})`)
    for (const row of group.slice(0, 40)) {
      const arrow = row.becomes ? ` -> ${row.becomes}` : ''
      console.log(`  ${row.value}${arrow}  (${row.count})`)
    }
    if (group.length > 40) console.log(`  ... and ${group.length - 40} more`)
    console.log()
  }
}

if (import.meta.url === `file://${process.argv[1]}`) await main()
