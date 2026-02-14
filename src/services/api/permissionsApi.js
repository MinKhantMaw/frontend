import { apiClient, normalizePaginatedResponse } from './client'

export async function fetchPermissions(params = {}) {
  const response = await apiClient.get('/permissions', { params })
  return normalizePaginatedResponse(response)
}

export async function createPermission(payload) {
  const { data } = await apiClient.post('/permissions', payload)
  return data
}

export async function updatePermission(id, payload) {
  const { data } = await apiClient.put(`/permissions/${id}`, payload)
  return data
}

export async function deletePermission(id) {
  return apiClient.delete(`/permissions/${id}`)
}
