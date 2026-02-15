import { apiClient, normalizePaginatedResponse } from './client'

export async function fetchUsers(params = {}) {
  const response = await apiClient.get('/users', { params })
  return normalizePaginatedResponse(response)
}

export async function fetchUserProfile(id) {
  const { data } = await apiClient.get(`/users/${id}`)
  return data?.data || data
}

export async function createUser(payload) {
  const { data } = await apiClient.post('/users', payload)
  return data
}

export async function updateUser(id, payload) {
  const { data } = await apiClient.put(`/users/${id}`, payload)
  return data
}

export async function deleteUser(id) {
  return apiClient.delete(`/users/${id}`)
}

const attachUserRoleEndpoints = [
  { method: 'post', path: (userId) => `/users/${userId}/roles` },
  { method: 'put', path: (userId) => `/users/${userId}/roles` },
  { method: 'post', path: (userId) => `/users/${userId}/assign-roles` },
  { method: 'put', path: (userId) => `/users/${userId}/sync-roles` },
]

const attachUserRolePayloads = (roleIds) => [{ role_ids: roleIds }, { roles: roleIds }, { roleIds }]

export async function assignUserRoles(userId, roleIds = []) {
  let lastError = null

  for (const endpoint of attachUserRoleEndpoints) {
    for (const payload of attachUserRolePayloads(roleIds)) {
      try {
        const { data } = await apiClient[endpoint.method](endpoint.path(userId), payload)
        return data
      } catch (error) {
        const status = error?.response?.status
        if (![404, 405, 422].includes(status)) throw error
        lastError = error
      }
    }
  }

  throw lastError || new Error('Failed to attach roles to user.')
}
