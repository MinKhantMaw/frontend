export function getProductImageUrl(product) {
  const image = product?.image
  const images = Array.isArray(product?.images) ? product.images : []

  const candidates = [
    product?.image_url,
    product?.imageUrl,
    product?.thumbnail_url,
    product?.thumbnailUrl,
    typeof image === 'string' ? image : null,
    image?.url,
    image?.src,
    image?.path,
    image?.original_url,
    ...images.flatMap((item) => [item?.url, item?.src, item?.path, item?.original_url, typeof item === 'string' ? item : null]),
  ].filter((value) => typeof value === 'string' && value.trim().length > 0)

  const first = candidates[0]
  if (!first) return null

  if (/^(https?:\/\/|data:|blob:)/i.test(first)) return first
  if (first.startsWith('/')) return first
  return `/${first}`
}

export function getCategoryName(product) {
  return product?.category?.name || product?.category_name || '-'
}

