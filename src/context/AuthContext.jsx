/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { permissionCacheStorage, refreshTokenStorage, tokenStorage, userStorage } from '@/lib/storage'
import { loginRequest, logoutRequest, meRequest } from '@/services/api/authApi'
import { extractErrorMessage, registerUnauthorizedHandler } from '@/services/api/client'

const AuthContext = createContext(null)
const SUPER_ADMIN_ROLE = 'superadmin'

function normalizeAccessKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function toArray(value) {
  if (Array.isArray(value)) return value
  if (!value) return []
  return [value]
}

function pickName(item) {
  if (typeof item === 'string') return item
  if (!item || typeof item !== 'object') return null
  return item.name || item.slug || item.label || item.title || null
}

function extractRoleNames(user) {
  const sources = [user?.roles, user?.role, user?.role_names, user?.roles_name, user?.assigned_roles]
  return sources.flatMap((source) => toArray(source)).map(pickName).filter(Boolean)
}

function extractPermissionNames(user) {
  const directPermissions = toArray(user?.permissions).map(pickName).filter(Boolean)
  const rolePermissions = toArray(user?.roles).flatMap((role) => toArray(role?.permissions).map(pickName).filter(Boolean))
  return [...new Set([...directPermissions, ...rolePermissions])]
}

function isSuperAdmin(user) {
  if (user?.is_super_admin === true) return true
  const roleNames = extractRoleNames(user)
  return roleNames.some((roleName) => normalizeAccessKey(roleName) === SUPER_ADMIN_ROLE)
}

function collectPermissions(user) {
  if (!user) return []
  return extractPermissionNames(user)
}

function getCachedPermissions() {
  const cache = permissionCacheStorage.get()
  if (!cache?.cached_at || !Array.isArray(cache.permissions)) return []

  const maxAgeMs = 5 * 60 * 1000
  return Date.now() - cache.cached_at <= maxAgeMs ? cache.permissions : []
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => userStorage.get())
  const [roles, setRoles] = useState(() => extractRoleNames(userStorage.get()))
  const [permissions, setPermissions] = useState(() => {
    const userPermissions = collectPermissions(userStorage.get())
    if (userPermissions.length) return userPermissions
    return getCachedPermissions()
  })
  const [isSuperAdminUser, setIsSuperAdminUser] = useState(() => isSuperAdmin(userStorage.get()))
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(tokenStorage.get()))

  const resetSession = useCallback((notify = false) => {
    tokenStorage.clear()
    refreshTokenStorage.clear()
    userStorage.clear()
    permissionCacheStorage.clear()
    setUser(null)
    setRoles([])
    setPermissions([])
    setIsSuperAdminUser(false)
    setIsAuthenticated(false)
    if (notify) toast.error('Your session has expired. Please log in again.')
  }, [])

  const hydrateUser = useCallback(async () => {
    const token = tokenStorage.get()
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await meRequest()
      const me = response.data || response.user || response
      const nextPermissions = collectPermissions(me)
      const nextRoles = extractRoleNames(me)
      setUser(me)
      setRoles(nextRoles)
      setPermissions(nextPermissions)
      setIsSuperAdminUser(isSuperAdmin(me))
      userStorage.set(me)
      permissionCacheStorage.set(nextPermissions)
      setIsAuthenticated(true)
    } catch {
      resetSession(false)
    } finally {
      setLoading(false)
    }
  }, [resetSession])

  useEffect(() => {
    registerUnauthorizedHandler(() => resetSession(true))
    hydrateUser()
  }, [hydrateUser, resetSession])

  const login = useCallback(async (credentials) => {
    try {
      const payload = await loginRequest(credentials)
      if (!payload.token) throw new Error('No access token returned by API')

      tokenStorage.set(payload.token)
      if (payload.refreshToken) refreshTokenStorage.set(payload.refreshToken)

      let authenticatedUser = payload.user
      if (!authenticatedUser) {
        const response = await meRequest()
        authenticatedUser = response.data || response.user || response
      }

      setUser(authenticatedUser)
      const nextPermissions = collectPermissions(authenticatedUser)
      const nextRoles = extractRoleNames(authenticatedUser)
      setRoles(nextRoles)
      setPermissions(nextPermissions)
      setIsSuperAdminUser(isSuperAdmin(authenticatedUser))
      userStorage.set(authenticatedUser)
      permissionCacheStorage.set(nextPermissions)
      setIsAuthenticated(true)
      toast.success('Welcome back')
      return { ok: true }
    } catch (error) {
      const message = extractErrorMessage(error, 'Unable to login.')
      toast.error(message)
      return { ok: false, message }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } catch {
      // Ignore logout errors so local session can still be cleared.
    } finally {
      resetSession(false)
      toast.success('Logged out successfully')
    }
  }, [resetSession])

  const hasPermission = useCallback(
    (required = []) => {
      if (isSuperAdminUser || permissions.includes('*')) return true
      if (!required.length) return true
      return required.every((permission) => permissions.includes(permission))
    },
    [isSuperAdminUser, permissions],
  )

  const hasRole = useCallback(
    (requiredRoles = []) => {
      if (isSuperAdminUser) return true
      if (!requiredRoles.length) return true
      const normalizedUserRoles = roles.map((role) => normalizeAccessKey(role))
      return requiredRoles.every((role) => normalizedUserRoles.includes(normalizeAccessKey(role)))
    },
    [isSuperAdminUser, roles],
  )

  const value = useMemo(
    () => ({
      user,
      roles,
      permissions,
      isSuperAdmin: isSuperAdminUser,
      isAuthenticated,
      loading,
      login,
      logout,
      hasPermission,
      hasRole,
    }),
    [user, roles, permissions, isSuperAdminUser, isAuthenticated, loading, login, logout, hasPermission, hasRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
