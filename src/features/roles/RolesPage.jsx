import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { DataTable } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { PermissionGate } from '@/components/shared/PermissionGate'
import { useAuthorization } from '@/hooks/useAuthorization'
import { extractErrorMessage } from '@/services/api/client'
import { fetchPermissions } from '@/services/api/permissionsApi'
import { createRole, deleteRole, fetchRoles, updateRole } from '@/services/api/rolesApi'
import { RoleFormDialog } from './RoleFormDialog'

function pickPermissionLabel(permission) {
  if (typeof permission === 'string') return permission
  return permission?.name || permission?.label || permission?.slug || null
}

function toPermissionNames(permissionIds = [], permissions = []) {
  const permissionMap = new Map(
    permissions.map((permission) => [String(permission.id ?? permission.name), permission.name]),
  )

  return permissionIds
    .map((permissionId) => permissionMap.get(String(permissionId)))
    .filter(Boolean)
}

export function RolesPage() {
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ column: 'name', direction: 'asc' })
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, perPage: 10, total: 0 })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [activeRole, setActiveRole] = useState(null)
  const { assertPermission } = useAuthorization()

  const loadRoles = async ({ page = pagination.currentPage, searchTerm = search, sortState = sort } = {}) => {
    try {
      setLoading(true)
      const result = await fetchRoles({
        page,
        search: searchTerm,
        sort_by: sortState.column,
        sort_direction: sortState.direction,
      })
      setRoles(result.items)
      setPagination(result.meta)
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to load roles.'))
    } finally {
      setLoading(false)
    }
  }

  const loadPermissions = async () => {
    try {
      const result = await fetchPermissions({ page: 1, per_page: 100 })
      setPermissions(result.items)
    } catch (error) {
      setPermissions([])
      toast.error(extractErrorMessage(error, 'Failed to load permissions list.'))
    }
  }

  useEffect(() => {
    loadRoles({ page: 1 })
    loadPermissions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => loadRoles({ page: 1, searchTerm: search }), 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const columns = useMemo(
    () => [
      { key: 'name', label: 'Role', sortable: true },
      {
        key: 'permissions',
        label: 'Permissions',
        render: (row) => (
          <div className="flex flex-wrap gap-1">
            {(row.permissions || []).length ? (
              (row.permissions || []).map((permission, index) => (
                <Badge key={permission?.id || `${pickPermissionLabel(permission) || 'permission'}-${index}`} variant="secondary">
                  {pickPermissionLabel(permission) || 'Unknown permission'}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">None</span>
            )}
          </div>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (row) => (
          <div className="flex items-center gap-2">
            <PermissionGate permissions={['roles.update']} mode="disable" disabledReason="Missing roles.update permission">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveRole(row)
                  setDialogOpen(true)
                }}
              >
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Edit
              </Button>
            </PermissionGate>
            <PermissionGate permissions={['roles.delete']}>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setActiveRole(row)
                  setDeleteOpen(true)
                }}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Delete
              </Button>
            </PermissionGate>
          </div>
        ),
      },
    ],
    [],
  )

  const handleSort = (column) => {
    const nextDirection = sort.column === column && sort.direction === 'asc' ? 'desc' : 'asc'
    const nextSort = { column, direction: nextDirection }
    setSort(nextSort)
    loadRoles({ page: 1, sortState: nextSort })
  }

  const handleSubmit = async (payload) => {
    try {
      setSaving(true)
      const isEditing = Boolean(activeRole)
      if (
        !assertPermission([isEditing ? 'roles.update' : 'roles.create'], {
          action: isEditing ? 'roles.update' : 'roles.create',
        })
      ) {
        return
      }

      const { permission_ids = [], ...rolePayload } = payload
      const requestPayload = {
        ...rolePayload,
        permissions: toPermissionNames(permission_ids, permissions),
      }
      if (activeRole) {
        await updateRole(activeRole.id, requestPayload)
        toast.success('Role updated successfully.')
      } else {
        await createRole(requestPayload)
        toast.success('Role created successfully.')
      }
      setDialogOpen(false)
      setActiveRole(null)
      await loadRoles()
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to save role.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!activeRole) return
    if (!assertPermission(['roles.delete'], { action: 'roles.delete' })) return

    try {
      setSaving(true)
      await deleteRole(activeRole.id)
      toast.success('Role deleted.')
      setDeleteOpen(false)
      setActiveRole(null)
      await loadRoles()
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to delete role.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role Management"
        description="Create roles and assign grouped permissions."
        actions={
          <PermissionGate permissions={['roles.create']} mode="disable" disabledReason="Missing roles.create permission">
            <Button
              onClick={() => {
                setActiveRole(null)
                setDialogOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Role
            </Button>
          </PermissionGate>
        }
      />

      <DataTable
        columns={columns}
        rows={roles}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => loadRoles({ page })}
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSort={handleSort}
      />

      <RoleFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        loading={saving}
        role={activeRole}
        permissions={permissions}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete role"
        description={`Are you sure you want to delete ${activeRole?.name || 'this role'}?`}
        onConfirm={handleDelete}
        loading={saving}
      />
    </div>
  )
}
