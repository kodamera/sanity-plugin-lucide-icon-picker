import type {LucideProps} from 'lucide-react'
import type {ComponentType} from 'react'

/**
 * A Lucide icon component.
 *
 * Deliberately `ComponentType` rather than lucide's own `LucideIcon`, which is
 * pinned to `ForwardRefExoticComponent`. React 19 makes `forwardRef` optional,
 * so lucide could drop it in a minor without breaking anything here.
 */
export type LucideIconComponent = ComponentType<LucideProps>

/** One selectable icon. */
export interface IconObject {
  /** Lucide's own canonical kebab-case name, e.g. `arrow-right`, `axis-3d`. */
  name: string
  component: LucideIconComponent
  /**
   * Everything this icon can be found by: its canonical name, its PascalCase
   * export name, every deprecated alias lucide still exports for it, and the
   * individual words of each.
   */
  tags: string[]
  /**
   * `tags` pre-lowercased and joined by `\n`, so a search is one `includes`
   * over a single string rather than a loop with a `toLowerCase` per tag.
   * A newline can never appear in the query, so this matches exactly what
   * testing each tag individually would.
   */
  searchText: string
}

/**
 * Configuration options for the Lucide icon picker
 * @public
 */
export interface LucideIconPickerOptions {
  /** Canonical kebab-case names to restrict the picker to. */
  allowedIcons?: string[]
}

/**
 * Value type for selected Lucide icons
 * @public
 */
export type LucideIconPickerValue = string
