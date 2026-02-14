const TOKEN_KEY = 'admin_token'
const USER_KEY = 'admin_user'
const THEME_KEY = 'admin_theme'
const PERMISSION_CACHE_KEY = 'admin_permissions_cache'
const PERMISSION_AUDIT_KEY = 'admin_permission_audit_log'

function safeReadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function safeWriteJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore quota/private mode errors
  }
}

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export const userStorage = {
  get: () => {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  },
  set: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  clear: () => localStorage.removeItem(USER_KEY),
}

export const themeStorage = {
  get: () => localStorage.getItem(THEME_KEY),
  set: (theme) => localStorage.setItem(THEME_KEY, theme),
}

export const permissionCacheStorage = {
  get: () => safeReadJson(PERMISSION_CACHE_KEY, null),
  set: (permissions) => safeWriteJson(PERMISSION_CACHE_KEY, {
    permissions,
    cached_at: Date.now(),
  }),
  clear: () => localStorage.removeItem(PERMISSION_CACHE_KEY),
}

export const permissionAuditStorage = {
  get: () => safeReadJson(PERMISSION_AUDIT_KEY, []),
  add: (entry) => {
    const current = safeReadJson(PERMISSION_AUDIT_KEY, [])
    const next = [entry, ...current].slice(0, 200)
    safeWriteJson(PERMISSION_AUDIT_KEY, next)
  },
  clear: () => localStorage.removeItem(PERMISSION_AUDIT_KEY),
}
