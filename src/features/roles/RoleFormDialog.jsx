/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import { groupPermissions } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const initialState = {
  name: '',
  permission_ids: [],
}

function normalizePermission(permission) {
  if (typeof permission === 'string') {
    return { id: permission, name: permission }
  }

  if (!permission || typeof permission !== 'object') {
    return null
  }

  const name = permission.name || permission.label || permission.slug
  if (!name) return null

  return {
    ...permission,
    id: permission.id ?? name,
    name,
  }
}

function resolveRolePermissionIds(rolePermissions = [], availablePermissions = []) {
  const normalizedAvailable = availablePermissions.map(normalizePermission).filter(Boolean)
  const permissionNameToId = new Map(normalizedAvailable.map((permission) => [permission.name, permission.id]))

  return rolePermissions
    .map((permission) => {
      if (typeof permission === 'string') return permissionNameToId.get(permission) ?? permission
      if (!permission || typeof permission !== 'object') return null
      if (permission.id) return permission.id
      if (permission.name) return permissionNameToId.get(permission.name) ?? permission.name
      return null
    })
    .filter(Boolean)
}

export function RoleFormDialog({ open, onOpenChange, onSubmit, loading, role, permissions = [] }) {
  const [form, setForm] = useState(initialState)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (role) {
      setForm({
        name: role.name || '',
        permission_ids: resolveRolePermissionIds(role.permissions || [], permissions),
      })
    } else {
      setForm(initialState)
    }
    setErrors({})
  }, [role, open, permissions])

  const normalizedPermissions = useMemo(
    () => permissions.map(normalizePermission).filter(Boolean),
    [permissions],
  )
  const groupedPermissions = useMemo(() => groupPermissions(normalizedPermissions), [normalizedPermissions])

  const handleSubmit = async (event) => {
    event.preventDefault()

    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Role name is required.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    await onSubmit(form)
  }

  const togglePermission = (permissionId) => {
    setForm((prev) => ({
      ...prev,
      permission_ids: prev.permission_ids.includes(permissionId)
        ? prev.permission_ids.filter((id) => id !== permissionId)
        : [...prev.permission_ids, permissionId],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{role ? 'Edit Role' : 'Create Role'}</DialogTitle>
          <DialogDescription>Assign one or more permissions to this role.</DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Role Name</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
          </div>

          <div className="max-h-72 space-y-4 overflow-y-auto rounded-xl border bg-background/40 p-3.5">
            {Object.keys(groupedPermissions).length === 0 ? (
              <p className="text-sm text-muted-foreground">No permissions found.</p>
            ) : (
              Object.entries(groupedPermissions).map(([group, items]) => (
                <div key={group} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{group}</p>
                  <div className="grid gap-2 md:grid-cols-2">
                    {items.map((permission) => (
                      <label key={permission.id} className="flex items-center gap-2 rounded-lg border bg-card/80 p-2.5 text-sm">
                        <Checkbox
                          checked={form.permission_ids.includes(permission.id)}
                          onCheckedChange={() => togglePermission(permission.id)}
                        />
                        {permission.name}
                      </label>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
