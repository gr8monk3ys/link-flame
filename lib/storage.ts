/**
 * localStorage helpers (react-best-practices 4.4).
 *
 * - Never throw: getItem/setItem throw in Safari private mode, when storage is
 *   disabled, and on quota errors.
 * - Versioned keys: a schema change bumps the suffix instead of parsing an old
 *   shape. `legacyKey` migrates a value stored under the pre-versioning key
 *   once, so existing guest carts and saved items survive the rename.
 */
export function storageGet(key: string, legacyKey?: string): string | null {
  try {
    const value = localStorage.getItem(key)
    if (value !== null || !legacyKey) return value
    const legacy = localStorage.getItem(legacyKey)
    if (legacy !== null) {
      localStorage.setItem(key, legacy)
      localStorage.removeItem(legacyKey)
    }
    return legacy
  } catch {
    return null
  }
}

export function storageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function storageRemove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // Storage unavailable; nothing to remove.
  }
}
