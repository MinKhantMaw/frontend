import { apiClient, normalizePaginatedResponse } from '@/services/api/client'

const base = '/admin/orders'

export async function fetchOrders(params = {}) {
  const response = await apiClient.get(base, { params })
  return normalizePaginatedResponse(response)
}

export async function fetchOrderDetail(id) {
  const { data } = await apiClient.get(`${base}/${id}`)
  return data?.data || data
}

export async function transitionOrderStatus(id, payload) {
  const { data } = await apiClient.patch(`${base}/${id}/status`, payload)
  return data?.data || data
}
