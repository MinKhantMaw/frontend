import { useEffect, useMemo, useState } from 'react'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { createProduct, deleteProduct, fetchCategories, fetchProducts, updateProduct } from '@/api'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { DataTable } from '@/components/shared/DataTable'
import { ModalForm } from '@/components/shared/ModalForm'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getProductImageUrl } from '@/catalog/productUtils'
import { extractErrorMessage } from '@/services/api/client'

const defaultPagination = { currentPage: 1, lastPage: 1, perPage: 10, total: 0 }
const defaultForm = {
  name: '',
  slug: '',
  sku: '',
  price: '',
  stock: '',
  status: 'active',
  category_id: '',
  image: null,
}

export function CatalogManagementPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pagination, setPagination] = useState(defaultPagination)
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [activeProduct, setActiveProduct] = useState(null)
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(defaultForm)
  const [errors, setErrors] = useState({})

  const loadProducts = async ({ targetPage = page } = {}) => {
    try {
      setLoading(true)
      const result = await fetchProducts({
        page: targetPage,
        search: search || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      })
      setRows(result.items)
      setPagination(result.meta)
      setPage(result.meta?.currentPage || targetPage)
    } catch (error) {
      setRows([])
      toast.error(extractErrorMessage(error, 'Failed to load products.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => loadProducts({ targetPage: page }), 250)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter])

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await fetchCategories({ page: 1, per_page: 1000 })
        setCategories(result.items || [])
      } catch {
        setCategories([])
      }
    }

    loadCategories()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  const columns = useMemo(
    () => [
      {
        key: 'image',
        label: 'Image',
        render: (row) => {
          const imageUrl = getProductImageUrl(row)
          return imageUrl ? (
            <img src={imageUrl} alt={row.name || 'Product'} className="h-12 w-12 rounded-md border object-cover" />
          ) : (
            <span className="text-xs text-muted-foreground">No image</span>
          )
        },
      },
      { key: 'name', label: 'Product' },
      { key: 'sku', label: 'SKU' },
      { key: 'price', label: 'Price', render: (row) => Number(row.price || 0).toLocaleString() },
      { key: 'stock', label: 'Stock' },
      {
        key: 'status',
        label: 'Status',
        render: (row) => <Badge variant={String(row.status) === 'active' ? 'default' : 'secondary'}>{row.status || 'inactive'}</Badge>,
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (row) => (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate(`/products/${row.id}`)}>
              <Eye className="mr-1 h-3.5 w-3.5" /> Detail
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveProduct(row)
                setForm({
                  name: row.name || '',
                  slug: row.slug || '',
                  sku: row.sku || '',
                  price: row.price || '',
                  stock: row.stock || '',
                  status: row.status || 'active',
                  category_id: row.category_id || '',
                  image: null,
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
                setActiveProduct(row)
                setDeleteOpen(true)
              }}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        ),
      },
    ],
    [navigate],
  )

  const validateForm = () => {
    const nextErrors = {}
    if (!form.name?.trim()) nextErrors.name = 'Name is required.'
    if (!form.slug?.trim()) nextErrors.slug = 'Slug is required.'
    if (!form.sku?.trim()) nextErrors.sku = 'SKU is required.'
    if (Number(form.price) <= 0) nextErrors.price = 'Price must be greater than 0.'
    if (Number(form.stock) < 0) nextErrors.stock = 'Stock cannot be negative.'
    if (!form.category_id) nextErrors.category_id = 'Category is required.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const resetForm = () => {
    setForm(defaultForm)
    setErrors({})
    setActiveProduct(null)
  }

  const handleSave = async () => {
    if (!validateForm()) return

    try {
      setSaving(true)
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        sku: form.sku.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        status: form.status,
        category_id: form.category_id ? Number(form.category_id) : undefined,
        image: form.image,
      }

      if (activeProduct) {
        await updateProduct(activeProduct.id, payload)
        toast.success('Product updated.')
      } else {
        await createProduct(payload)
        toast.success('Product created.')
      }

      setDialogOpen(false)
      resetForm()
      await loadProducts({ targetPage: page })
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to save product.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!activeProduct) return
    try {
      setSaving(true)
      await deleteProduct(activeProduct.id)
      toast.success('Product deleted.')
      setDeleteOpen(false)
      resetForm()
      await loadProducts({ targetPage: page })
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to delete product.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Management"
        description="Create, edit, filter, and remove products with server-side pagination."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 rounded-[calc(var(--radius)-2px)] border bg-background/75 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Statuses</option>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
            <Button
              onClick={() => {
                resetForm()
                setDialogOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Product
            </Button>
          </div>
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
        sort={{ column: 'created_at', direction: 'desc' }}
        onSort={() => {}}
      />

      <ModalForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={activeProduct ? 'Edit Product' : 'Create Product'}
        description="Use server-side validation as source of truth; client checks prevent obvious invalid input."
        onSubmit={handleSave}
        loading={saving}
        submitText={activeProduct ? 'Update Product' : 'Create Product'}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">SKU</label>
            <Input value={form.sku} onChange={(event) => setForm((prev) => ({ ...prev, sku: event.target.value }))} />
            {errors.sku ? <p className="text-xs text-destructive">{errors.sku}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Slug</label>
            <Input value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} />
            {errors.slug ? <p className="text-xs text-destructive">{errors.slug}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Price</label>
            <Input type="number" min="0" value={form.price} onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))} />
            {errors.price ? <p className="text-xs text-destructive">{errors.price}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Stock</label>
            <Input type="number" min="0" value={form.stock} onChange={(event) => setForm((prev) => ({ ...prev, stock: event.target.value }))} />
            {errors.stock ? <p className="text-xs text-destructive">{errors.stock}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <select
              value={form.category_id}
              onChange={(event) => setForm((prev) => ({ ...prev, category_id: event.target.value }))}
              className="h-10 w-full rounded-[calc(var(--radius)-2px)] border bg-background/75 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.name || category.slug || `Category #${category.id}`}
                </option>
              ))}
            </select>
            {errors.category_id ? <p className="text-xs text-destructive">{errors.category_id}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <select
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
              className="h-10 w-full rounded-[calc(var(--radius)-2px)] border bg-background/75 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Image</label>
            <Input type="file" accept="image/*" onChange={(event) => setForm((prev) => ({ ...prev, image: event.target.files?.[0] || null }))} />
          </div>
        </div>
      </ModalForm>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete product"
        description={`Are you sure you want to delete ${activeProduct?.name || 'this product'}?`}
        onConfirm={handleDelete}
        loading={saving}
      />
    </div>
  )
}
