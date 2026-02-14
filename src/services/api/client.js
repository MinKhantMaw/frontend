import axios from 'axios'
import { tokenStorage } from '@/lib/storage'

let unauthorizedHandler = null

export function registerUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && unauthorizedHandler) {
      unauthorizedHandler()
    }
    return Promise.reject(error)
  },
)

export function normalizePaginatedResponse(response) {
  const payload = response.data

  if (Array.isArray(payload)) {
    return {
      items: payload,
      meta: { currentPage: 1, lastPage: 1, perPage: payload.length || 10, total: payload.length },
    }
  }

  const nestedData = payload?.data
  const nestedResult = payload?.result

  const data =
    payload?.data?.data ||
    payload?.result?.data ||
    payload?.items ||
    payload?.permissions ||
    payload?.roles ||
    payload?.users ||
    (Array.isArray(nestedData) ? nestedData : null) ||
    (Array.isArray(nestedResult) ? nestedResult : null) ||
    []

  return {
    items: data,
    meta: {
      currentPage: payload.current_page || payload.meta?.current_page || payload.data?.current_page || 1,
      lastPage: payload.last_page || payload.meta?.last_page || payload.data?.last_page || 1,
      perPage: payload.per_page || payload.meta?.per_page || payload.data?.per_page || data.length || 10,
      total: payload.total || payload.meta?.total || payload.data?.total || data.length,
    },
  }
}

export function extractErrorMessage(error, fallback = 'Something went wrong.') {
  const apiMessage = error?.response?.data?.message
  const validationErrors = error?.response?.data?.errors

  if (validationErrors && typeof validationErrors === 'object') {
    const firstKey = Object.keys(validationErrors)[0]
    if (firstKey && validationErrors[firstKey]?.[0]) {
      return validationErrors[firstKey][0]
    }
  }

  return apiMessage || error.message || fallback
}
