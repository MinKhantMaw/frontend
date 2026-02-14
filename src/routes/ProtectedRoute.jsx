import { useEffect, useRef } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/AuthContext'
import { useAuthorization } from '@/hooks/useAuthorization'

export function ProtectedRoute({ requiredPermissions = [], requiredRoles = [] }) {
  const { isAuthenticated, loading, hasPermission, hasRole } = useAuth()
  const { assertPermission } = useAuthorization()
  const deniedKeyRef = useRef('')
  const location = useLocation()
  const missingPermissions = !hasPermission(requiredPermissions)
  const missingRoles = !hasRole(requiredRoles)
  const unauthorized = !loading && isAuthenticated && (missingPermissions || missingRoles)

  useEffect(() => {
    if (!unauthorized) return

    const deniedKey = `${location.pathname}:${requiredPermissions.join(',')}:${requiredRoles.join(',')}`
    if (deniedKeyRef.current === deniedKey) return

    deniedKeyRef.current = deniedKey
    const missingRequirements = [
      ...requiredPermissions.filter((permission) => !hasPermission([permission])),
      ...requiredRoles.filter((role) => !hasRole([role])).map((role) => `role:${role}`),
    ]
    assertPermission(missingRequirements, {
      deniedMessage: 'Access denied for this page.',
      action: `route:${location.pathname}`,
      source: 'route-guard',
    })
  }, [assertPermission, hasPermission, hasRole, location.pathname, requiredPermissions, requiredRoles, unauthorized])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <Skeleton className="mb-4 h-10 w-1/3" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (unauthorized) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
