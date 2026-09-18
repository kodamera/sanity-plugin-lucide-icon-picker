/** Types for the dataset audit script, so the plugin's tests can import it. */

export type IconValueStatus = 'brand' | 'ok' | 'renamed' | 'unknown'

export interface IconValueClassification {
  value: string
  status: IconValueStatus
  /** Only set when `status` is 'renamed': the canonical name it maps to. */
  becomes?: string
}

/** Brand icons lucide deleted in 1.x, which this plugin bundles copies of. */
export declare const REMOVED_BRAND_ICONS: readonly string[]

/** Classify a single stored `lucide-icon` value. */
export declare const classify: (value: string) => IconValueClassification

export declare const toKebabCase: (name: string) => string
export declare const toLegacyKebabCase: (name: string) => string
