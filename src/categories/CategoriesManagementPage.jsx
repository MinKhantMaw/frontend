import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createCategory, deleteCategory, fetchCategories, updateCategory } from '@/api'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { DataTable } from '@/components/shared/DataTable'
import { ModalForm } from '@/components/shared/ModalForm'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { extractErrorMessage } from '@/services/api/client'

const defaultPagination = { currentPage: 1, lastPage: 1, perPage: 10, total: 0 }
const defaultForm = { name: '', slug: '', parent_id: '' }

export function CategoriesManagementPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState(defaultPagination)
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [errors, setErrors] = useState({})

  const loadCategories = async ({ targetPage = page } = {}) => {
    try {
      setLoading(true)
      const result = await fetchCategories({ page: targetPage, search: search || undefined })
      setRows(result.items)
      setPagination(result.meta)
      setPage(result.meta?.currentPage || targetPage)
    } catch (error) {
      setRows([])
      toast.error(extractErrorMessage(error, 'Failed to load categories.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => loadCategories({ targetPage: page }), 250)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search])

  useEffect(() => {
    setPage(1)
  }, [search])

  const columns = useMemo(
    () => [
      { key: 'name', label: 'Name' },
      { key: 'slug', label: 'Slug' },
      { key: 'parent', label: 'Parent', render: (row) => row.parent?.name || row.parent_name || '-' },
      {
        key: 'actions',
        label: 'Actions',
        render: (row) => (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveCategory(row)
                setForm({
                  name: row.name || '',
                  slug: row.slug || '',
                  parent_id: row.parent_id || '',
                })
                setErrors({})
                setDialogOpen(true)
              }}
            >
              <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setActiveCategory(row)
                setDeleteOpen(true)
              }}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  const validateForm = () => {
    const nextErrors = {}
    if (!form.name?.trim()) nextErrors.name = 'Name is required.'
    if (!form.slug?.trim()) nextErrors.slug = 'Slug is required.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const resetForm = () => {
    setForm(defaultForm)
    setErrors({})
    setActiveCategory(null)
  }

  const handleSave = async () => {
    if (!validateForm()) return
    try {
      setSaving(true)
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        parent_id: form.parent_id ? Number(form.parent_id) : null,
      }
      if (activeCategory) {
        await updateCategory(activeCategory.id, payload)
        toast.success('Category updated.')
      } else {
        await createCategory(payload)
        toast.success('Category created.')
      }
      setDialogOpen(false)
      resetForm()
      await loadCategories({ targetPage: page })
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to save category.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!activeCategory) return
    try {
      setSaving(true)
      await deleteCategory(activeCategory.id)
      toast.success('Category deleted.')
      setDeleteOpen(false)
      resetForm()
      await loadCategories({ targetPage: page })
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to delete category.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Category Management"
        description="Manage category hierarchy with slug-based routing metadata."
        actions={
          <Button
            onClick={() => {
              resetForm()
              setDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Category
          </Button>
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        search={search}
        onSearchChange={setSearch}
        sort={{ column: 'name', direction: 'asc' }}
        onSort={() => {}}
      />

      <ModalForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={activeCategory ? 'Edit Category' : 'Create Category'}
        onSubmit={handleSave}
        loading={saving}
        submitText={activeCategory ? 'Update Category' : 'Create Category'}
      >
        <div className="grid gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Slug</label>
            <Input value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} />
            {errors.slug ? <p className="text-xs text-destructive">{errors.slug}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Parent Category ID</label>
            <Input
              type="number"
              min="1"
              value={form.parent_id}
              onChange={(event) => setForm((prev) => ({ ...prev, parent_id: event.target.value }))}
            />
          </div>
        </div>
      </ModalForm>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete category"
        description={`Are you sure you want to delete ${activeCategory?.name || 'this category'}?`}
        onConfirm={handleDelete}
        loading={saving}
      />
    </div>
  )
}

