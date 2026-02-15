import { useEffect, useMemo, useState } from 'react'
import { Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { extractErrorMessage } from '@/services/api/client'
import { fetchPermissions } from '@/services/api/permissionsApi'
import { fetchRoles } from '@/services/api/rolesApi'

function normalizePermissionName(permission) {
  if (typeof permission === 'string') return permission
  return permission?.name || permission?.label || permission?.slug || null
}

export function PermissionMatrixPage() {
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [rolesResult, permissionsResult] = await Promise.all([
          fetchRoles({ page: 1, per_page: 100 }),
          fetchPermissions({ page: 1, per_page: 100 }),
        ])

        setRoles(rolesResult.items || [])
        setPermissions((permissionsResult.items || []).map((permission) => normalizePermissionName(permission)).filter(Boolean))
      } catch (error) {
        toast.error(extractErrorMessage(error, 'Failed to load permission matrix.'))
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const rolePermissionMap = useMemo(() => {
    const map = new Map()

    roles.forEach((role) => {
      const names = (role.permissions || []).map((permission) => normalizePermissionName(permission)).filter(Boolean)
      map.set(role.id, new Set(names))
    })

    return map
  }, [roles])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permission Matrix"
        description="Visual matrix of role-permission assignments for quick authorization audits."
      />

      <div className="surface-ring elevate-soft fade-rise rounded-2xl border bg-card/95 p-4 md:p-5">
        {loading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-48">Permission</TableHead>
                  {roles.map((role) => (
                    <TableHead key={role.id} className="min-w-36 text-center">
                      {role.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((permission) => (
                  <TableRow key={permission}>
                    <TableCell className="font-medium">{permission}</TableCell>
                    {roles.map((role) => {
                      const granted = rolePermissionMap.get(role.id)?.has(permission)
                      return (
                        <TableCell key={`${role.id}-${permission}`} className="text-center">
                          {granted ? (
                            <Check className="mx-auto h-4 w-4 text-emerald-600" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-muted-foreground/70" />
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
