import { apiClient, normalizePaginatedResponse } from '@/services/api/client'

const base = '/admin/products'

export async function fetchProducts(params = {}) {
  const response = await apiClient.get(base, { params })
  return normalizePaginatedResponse(response)
}

export async function fetchProductDetail(id) {
  const { data } = await apiClient.get(`${base}/${id}`)
  return data?.data || data
}

export async function createProduct(payload) {
  const { image, ...productPayload } = payload || {}
  const { data } = await apiClient.post(base, productPayload)
  const created = data?.data || data

  if (image && created?.id) {
    await uploadProductImage(created.id, image)
  }

  return created
}

export async function updateProduct(id, payload) {
  const { image, ...productPayload } = payload || {}
  const { data } = await apiClient.put(`${base}/${id}`, productPayload)
  const updated = data?.data || data

  if (image) {
    await uploadProductImage(id, image)
  }

  return updated
}

export async function deleteProduct(id) {
  return apiClient.delete(`${base}/${id}`)
}

export async function uploadProductImage(productId, file) {
  const formData = new FormData()
  formData.append('image', file)
  const { data } = await apiClient.post(`${base}/${productId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data?.data || data
}
