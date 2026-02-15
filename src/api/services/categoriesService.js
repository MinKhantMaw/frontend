import { apiClient, normalizePaginatedResponse } from '@/services/api/client'

const base = '/categories'

export async function fetchCategories(params = {}) {
  const response = await apiClient.get(base, { params })
  return normalizePaginatedResponse(response)
}

export async function createCategory(payload) {
  const { data } = await apiClient.post(base, payload)
  return data?.data || data
}

export async function updateCategory(id, payload) {
  const { data } = await apiClient.put(`${base}/${id}`, payload)
  return data?.data || data
}

export async function deleteCategory(id) {
  return apiClient.delete(`${base}/${id}`)
}

