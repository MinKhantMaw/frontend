import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { fetchProductDetail } from '@/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { extractErrorMessage } from '@/services/api/client'
import { getCategoryName, getProductImageUrl } from '@/catalog/productUtils'

function renderValue(value) {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.length ? JSON.stringify(value) : '-'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function ProductDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState(null)

  useEffect(() => {
    const loadDetail = async () => {
      if (!id) return
      try {
        setLoading(true)
        const detail = await fetchProductDetail(id)
        setProduct(detail)
      } catch (error) {
        toast.error(extractErrorMessage(error, 'Failed to load product detail.'))
        navigate('/products')
      } finally {
        setLoading(false)
      }
    }

    loadDetail()
  }, [id, navigate])

  const imageUrl = getProductImageUrl(product)
  const infoRows = useMemo(
    () => [
      ['ID', product?.id],
      ['Name', product?.name],
      ['Slug', product?.slug],
      ['SKU', product?.sku],
      ['Price', product?.price],
      ['Stock', product?.stock],
      ['Status', product?.status],
      ['Category', getCategoryName(product)],
      ['Description', product?.description || product?.short_description],
      ['Created At', product?.created_at],
      ['Updated At', product?.updated_at],
    ],
    [product],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={loading ? 'Product Details' : product?.name || 'Product Details'}
        description="View all available product information."
        actions={
          <Button variant="outline" onClick={() => navigate('/products')}>
            <ArrowLeft className="h-4 w-4" />
            Back to products
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-[280px_1fr]">
          <div className="overflow-hidden rounded-lg border bg-muted/20">
            {imageUrl ? (
              <img src={imageUrl} alt={product?.name || 'Product image'} className="h-64 w-full object-cover" />
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">No image</div>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {infoRows.map(([label, value]) => (
              <div key={label} className="rounded-lg border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                {label === 'Status' ? (
                  <Badge className="mt-2" variant={String(value) === 'active' ? 'default' : 'secondary'}>
                    {renderValue(value)}
                  </Badge>
                ) : (
                  <p className="mt-2 break-words text-sm">{renderValue(value)}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Raw Product Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-h-[28rem] overflow-auto rounded-lg bg-muted p-4 text-xs">{JSON.stringify(product || {}, null, 2)}</pre>
        </CardContent>
      </Card>
    </div>
  )
}

