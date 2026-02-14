import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PermissionGate } from '@/components/shared/PermissionGate'
import { UserFormDialog } from './UserFormDialog'
import { useAuthorization } from '@/hooks/useAuthorization'
import { createUser, deleteUser, fetchUsers, updateUser } from '@/services/api/usersApi'
import { fetchRoles } from '@/services/api/rolesApi'
import { extractErrorMessage } from '@/services/api/client'

function pickRoleLabel(role) {
  if (typeof role === 'string') return role
  return role?.name || role?.label || role?.slug || role?.role_name || null
}

function toRoleNames(roleIds = [], roles = []) {
  const roleMap = new Map(roles.map((role) => [role.id, role.name]))
  return roleIds.map((roleId) => roleMap.get(roleId)).filter(Boolean)
}

export function UsersPage() {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ column: 'name', direction: 'asc' })
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, perPage: 10, total: 0 })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [activeUser, setActiveUser] = useState(null)
  const { assertPermission } = useAuthorization()

  const loadUsers = async ({ page = pagination.currentPage, searchTerm = search, sortState = sort } = {}) => {
    try {
      setLoading(true)
      const result = await fetchUsers({
        page,
        search: searchTerm,
        sort_by: sortState.column,
        sort_direction: sortState.direction,
      })
      setUsers(result.items)
      setPagination(result.meta)
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to load users.'))
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const result = await fetchRoles({ page: 1, per_page: 100 })
      setRoles(result.items)
    } catch {
      // optional auxiliary data
    }
  }

  useEffect(() => {
    loadUsers({ page: 1 })
    loadRoles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers({ page: 1, searchTerm: search })
    }, 400)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const columns = useMemo(
    () => [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
      {
        key: 'roles',
        label: 'Roles',
        render: (row) => (
          <div className="flex flex-wrap gap-1">
            {(row.roles || []).length ? (
              row.roles.map((role, index) => (
                <Badge key={role?.id || `${pickRoleLabel(role) || 'role'}-${index}`} variant="secondary">
                  {pickRoleLabel(role) || 'Unknown role'}
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
            <PermissionGate permissions={['users.update']} mode="disable" disabledReason="Missing users.update permission">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveUser(row)
                  setDialogOpen(true)
                }}
              >
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Edit
              </Button>
            </PermissionGate>
            <PermissionGate permissions={['users.delete']}>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setActiveUser(row)
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
    loadUsers({ page: 1, sortState: nextSort })
  }

  const handleSubmit = async (payload) => {
    try {
      setSaving(true)
      const isEditing = Boolean(activeUser)
      if (
        !assertPermission([isEditing ? 'users.update' : 'users.create'], {
          action: isEditing ? 'users.update' : 'users.create',
        })
      ) {
        return
      }

      const { role_ids = [], ...userPayload } = payload
      const rolesPayload = toRoleNames(role_ids, roles)
      const requestPayload = { ...userPayload, roles: rolesPayload }
      if (activeUser) {
        await updateUser(activeUser.id, requestPayload)
        toast.success('User updated successfully.')
      } else {
        await createUser(requestPayload)
        toast.success('User created successfully.')
      }
      setDialogOpen(false)
      setActiveUser(null)
      await loadUsers()
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to save user.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!activeUser) return
    if (!assertPermission(['users.delete'], { action: 'users.delete' })) return

    try {
      setSaving(true)
      await deleteUser(activeUser.id)
      toast.success('User deleted.')
      setDeleteOpen(false)
      setActiveUser(null)
      await loadUsers()
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to delete user.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage users, assign roles, and control account access."
        actions={
          <PermissionGate permissions={['users.create']} mode="disable" disabledReason="Missing users.create permission">
            <Button
              onClick={() => {
                setActiveUser(null)
                setDialogOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New User
            </Button>
          </PermissionGate>
        }
      />

      <DataTable
        columns={columns}
        rows={users}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => loadUsers({ page })}
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSort={handleSort}
      />

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        loading={saving}
        user={activeUser}
        roles={roles}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete user"
        description={`Are you sure you want to delete ${activeUser?.name || 'this user'}? This action cannot be undone.`}
        onConfirm={handleDelete}
        loading={saving}
      />
    </div>
  )
}
