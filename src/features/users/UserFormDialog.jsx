/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
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
  email: '',
  password: '',
  password_confirmation: '',
  role_ids: [],
}

function resolveUserRoleIds(userRoles = [], availableRoles = []) {
  const roleNameToId = new Map(availableRoles.map((role) => [String(role.name).toLowerCase(), role.id]))

  return userRoles
    .map((role) => {
      if (typeof role === 'number') return role
      if (typeof role === 'string') return roleNameToId.get(role.toLowerCase()) ?? null
      if (!role || typeof role !== 'object') return null
      if (role.id) return role.id
      if (role.name) return roleNameToId.get(String(role.name).toLowerCase()) ?? null
      return null
    })
    .filter(Boolean)
}

export function UserFormDialog({ open, onOpenChange, onSubmit, loading, user, roles = [] }) {
  const [form, setForm] = useState(initialState)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        password: '',
        password_confirmation: '',
        role_ids: resolveUserRoleIds(user.roles || [], roles),
      })
    } else {
      setForm(initialState)
    }
    setErrors({})
  }, [user, open, roles])

  const title = useMemo(() => (user ? 'Edit User' : 'Create User'), [user])

  const handleSubmit = async (event) => {
    event.preventDefault()

    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Name is required.'
    if (!form.email.trim()) nextErrors.email = 'Email is required.'
    if (!user && !form.password) nextErrors.password = 'Password is required.'
    if (form.password && form.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.'
    if (form.password && form.password !== form.password_confirmation) {
      nextErrors.password_confirmation = 'Passwords do not match.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    await onSubmit(form)
  }

  const handleRolesChange = (event) => {
    const selected = Array.from(event.target.selectedOptions).map((option) => Number(option.value))
    setForm((prev) => ({ ...prev, role_ids: selected }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Provide account details and assign one or more roles.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
            {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              />
              {errors.password ? <p className="text-xs text-destructive">{errors.password}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_confirmation">Confirm Password</Label>
              <Input
                id="password_confirmation"
                type="password"
                value={form.password_confirmation}
                onChange={(e) => setForm((prev) => ({ ...prev, password_confirmation: e.target.value }))}
              />
              {errors.password_confirmation ? <p className="text-xs text-destructive">{errors.password_confirmation}</p> : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Roles</Label>
            <select
              multiple
              value={form.role_ids.map(String)}
              onChange={handleRolesChange}
              className="h-36 w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">Hold Ctrl/Cmd to select multiple roles.</p>
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
