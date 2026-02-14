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
import {
  createPermission,
  deletePermission,
  fetchPermissions,
  updatePermission,
} from '@/services/api/permissionsApi'
import { PermissionFormDialog } from './PermissionFormDialog'

export function PermissionsPage() {
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ column: 'name', direction: 'asc' })
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, perPage: 10, total: 0 })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [activePermission, setActivePermission] = useState(null)
  const { assertPermission } = useAuthorization()

  const loadPermissions = async ({ page = pagination.currentPage, searchTerm = search, sortState = sort } = {}) => {
    try {
      setLoading(true)
      const result = await fetchPermissions({
        page,
        search: searchTerm,
        sort_by: sortState.column,
        sort_direction: sortState.direction,
      })
      setPermissions(result.items)
      setPagination(result.meta)
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to load permissions.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPermissions({ page: 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => loadPermissions({ page: 1, searchTerm: search }), 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const columns = useMemo(
    () => [
      { key: 'name', label: 'Permission', sortable: true },
      {
        key: 'guard_name',
        label: 'Guard',
        sortable: true,
        render: (row) => <Badge variant="outline">{row.guard_name || 'api'}</Badge>,
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (row) => (
          <div className="flex items-center gap-2">
            <PermissionGate permissions={['permissions.update']} mode="disable" disabledReason="Missing permissions.update permission">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActivePermission(row)
                  setDialogOpen(true)
                }}
              >
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Edit
              </Button>
            </PermissionGate>
            <PermissionGate permissions={['permissions.delete']}>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setActivePermission(row)
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
    loadPermissions({ page: 1, sortState: nextSort })
  }

  const handleSubmit = async (payload) => {
    try {
      setSaving(true)
      const isEditing = Boolean(activePermission)
      if (
        !assertPermission([isEditing ? 'permissions.update' : 'permissions.create'], {
          action: isEditing ? 'permissions.update' : 'permissions.create',
        })
      ) {
        return
      }

      if (activePermission) {
        await updatePermission(activePermission.id, payload)
        toast.success('Permission updated successfully.')
      } else {
        await createPermission(payload)
        toast.success('Permission created successfully.')
      }
      setDialogOpen(false)
      setActivePermission(null)
      await loadPermissions()
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to save permission.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!activePermission) return
    if (!assertPermission(['permissions.delete'], { action: 'permissions.delete' })) return

    try {
      setSaving(true)
      await deletePermission(activePermission.id)
      toast.success('Permission deleted.')
      setDeleteOpen(false)
      setActivePermission(null)
      await loadPermissions()
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to delete permission.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permission Management"
        description="Define permissions used by route guards and role assignments."
        actions={
          <PermissionGate permissions={['permissions.create']} mode="disable" disabledReason="Missing permissions.create permission">
            <Button
              onClick={() => {
                setActivePermission(null)
                setDialogOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Permission
            </Button>
          </PermissionGate>
        }
      />

      <DataTable
        columns={columns}
        rows={permissions}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => loadPermissions({ page })}
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSort={handleSort}
      />

      <PermissionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        loading={saving}
        permission={activePermission}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete permission"
        description={`Are you sure you want to delete ${activePermission?.name || 'this permission'}?`}
        onConfirm={handleDelete}
        loading={saving}
      />
    </div>
  )
}
