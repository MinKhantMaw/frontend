import { useCallback } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { permissionAuditStorage } from '@/lib/storage'

export function useAuthorization() {
  const { hasPermission, user } = useAuth()

  const can = useCallback(
    (requiredPermissions = []) => hasPermission(requiredPermissions),
    [hasPermission],
  )

  const logDenied = useCallback(
    ({ permissions = [], action = 'unknown', source = 'ui' }) => {
      permissionAuditStorage.add({
        timestamp: new Date().toISOString(),
        user_id: user?.id || null,
        user_email: user?.email || null,
        permissions,
        action,
        source,
      })
    },
    [user?.email, user?.id],
  )

  const assertPermission = useCallback(
    (requiredPermissions = [], options = {}) => {
      if (can(requiredPermissions)) return true

      const {
        deniedMessage = 'You do not have permission for this action.',
        action = 'unknown',
        source = 'ui',
      } = options

      logDenied({ permissions: requiredPermissions, action, source })
      toast.error(deniedMessage)
      return false
    },
    [can, logDenied],
  )

  return {
    can,
    assertPermission,
    logDenied,
  }
}
