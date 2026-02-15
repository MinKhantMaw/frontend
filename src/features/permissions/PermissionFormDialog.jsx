/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const initialState = {
  name: '',
  guard_name: 'api',
  description: '',
}

export function PermissionFormDialog({ open, onOpenChange, onSubmit, loading, permission }) {
  const [form, setForm] = useState(initialState)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (permission) {
      setForm({
        name: permission.name || '',
        guard_name: permission.guard_name || 'api',
        description: permission.description || '',
      })
    } else {
      setForm(initialState)
    }
    setErrors({})
  }, [permission, open])

  const handleSubmit = async (event) => {
    event.preventDefault()

    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Permission name is required.'
    if (!form.guard_name.trim()) nextErrors.guard_name = 'Guard name is required.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    await onSubmit(form)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{permission ? 'Edit Permission' : 'Create Permission'}</DialogTitle>
          <DialogDescription>Use names like users.show, users.create, roles.update, permissions.delete, etc.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="guard_name">Guard Name</Label>
            <Input
              id="guard_name"
              value={form.guard_name}
              onChange={(e) => setForm((prev) => ({ ...prev, guard_name: e.target.value }))}
            />
            {errors.guard_name ? <p className="text-xs text-destructive">{errors.guard_name}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
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
