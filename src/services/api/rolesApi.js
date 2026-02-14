import { apiClient, normalizePaginatedResponse } from './client'

export async function fetchRoles(params = {}) {
  const response = await apiClient.get('/roles', { params })
  return normalizePaginatedResponse(response)
}

export async function createRole(payload) {
  const { data } = await apiClient.post('/roles', payload)
  return data
}

export async function updateRole(id, payload) {
  const { data } = await apiClient.put(`/roles/${id}`, payload)
  return data
}

export async function deleteRole(id) {
  return apiClient.delete(`/roles/${id}`)
}

const syncRolePermissionEndpoints = [
  { method: 'put', path: (roleId) => `/roles/${roleId}/permissions` },
  { method: 'post', path: (roleId) => `/roles/${roleId}/permissions` },
  { method: 'put', path: (roleId) => `/roles/${roleId}/sync-permissions` },
  { method: 'post', path: (roleId) => `/roles/${roleId}/sync-permissions` },
]

const syncRolePermissionPayloads = (permissionIds) => [
  { permission_ids: permissionIds },
  { permissions: permissionIds },
  { permissionIds },
]

export async function syncRolePermissions(roleId, permissionIds = []) {
  let lastError = null

  for (const endpoint of syncRolePermissionEndpoints) {
    for (const payload of syncRolePermissionPayloads(permissionIds)) {
      try {
        const { data } = await apiClient[endpoint.method](endpoint.path(roleId), payload)
        return data
      } catch (error) {
        const status = error?.response?.status
        if (![404, 405, 422].includes(status)) throw error
        lastError = error
      }
    }
  }

  throw lastError || new Error('Failed to sync role permissions.')
}
