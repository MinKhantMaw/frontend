import axios from 'axios'
import { refreshTokenStorage, tokenStorage } from '@/lib/storage'

const authMode = String(import.meta.env.VITE_AUTH_MODE || 'jwt').toLowerCase()
const useSanctumCookies = authMode === 'sanctum'
const requestTimeout = Number(import.meta.env.VITE_API_TIMEOUT || 15000)

let unauthorizedHandler = null
let refreshingToken = false
let refreshPromise = null
const queuedRequests = []

const defaultDevApiBase = 'http://localhost:8000/api/v1'
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? defaultDevApiBase : '/api/v1')
const baseURL = rawBaseUrl.replace(/\/$/, '')
const apiRoot = (import.meta.env.VITE_API_ROOT_URL || baseURL.replace(/\/admin$/, '')).replace(/\/$/, '')

function resolveRefreshPath() {
  const configured = import.meta.env.VITE_AUTH_REFRESH_PATH
  if (configured) return configured
  return '/auth/refresh'
}

function resolveCsrfPath() {
  const configured = import.meta.env.VITE_SANCTUM_CSRF_PATH
  if (configured) return configured
  return '/sanctum/csrf-cookie'
}

function queueRequest(resolve, reject) {
  queuedRequests.push({ resolve, reject })
}

function flushQueue(error = null) {
  while (queuedRequests.length) {
    const queued = queuedRequests.shift()
    if (!queued) continue
    if (error) queued.reject(error)
    else queued.resolve()
  }
}

function tokenFromPayload(payload = {}) {
  const candidates = [
    payload?.access_token,
    payload?.accessToken,
    payload?.token,
    payload?.data?.access_token,
    payload?.data?.accessToken,
    payload?.data?.token,
    payload?.result?.access_token,
    payload?.result?.accessToken,
    payload?.result?.token,
  ]

  return candidates.find((candidate) => typeof candidate === 'string' && candidate.length > 0) || null
}

function refreshTokenFromPayload(payload = {}) {
  const candidates = [
    payload?.refresh_token,
    payload?.refreshToken,
    payload?.data?.refresh_token,
    payload?.data?.refreshToken,
    payload?.result?.refresh_token,
    payload?.result?.refreshToken,
  ]

  return candidates.find((candidate) => typeof candidate === 'string' && candidate.length > 0) || null
}

async function runRefresh() {
  const refreshPath = resolveRefreshPath()
  const refreshToken = refreshTokenStorage.get()
  const payload = refreshToken ? { refresh_token: refreshToken } : {}
  const response = await axios.post(`${apiRoot}${refreshPath}`, payload, {
    headers: { Accept: 'application/json' },
    withCredentials: useSanctumCookies,
    timeout: requestTimeout,
  })

  const nextToken = tokenFromPayload(response?.data || {})
  if (nextToken) tokenStorage.set(nextToken)

  const nextRefreshToken = refreshTokenFromPayload(response?.data || {})
  if (nextRefreshToken) refreshTokenStorage.set(nextRefreshToken)
}

async function ensureSanctumCsrf() {
  if (!useSanctumCookies) return
  await axios.get(resolveCsrfPath(), { withCredentials: true, timeout: requestTimeout })
}

export function registerUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

export async function requestSanctumCsrfCookie() {
  await ensureSanctumCsrf()
}

export const apiClient = axios.create({
  baseURL,
  timeout: requestTimeout,
  withCredentials: useSanctumCookies,
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
  if (!config.headers['X-Request-ID'] && globalThis.crypto?.randomUUID) {
    config.headers['X-Request-ID'] = globalThis.crypto.randomUUID()
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status
    const originalRequest = error?.config
    const shouldTryRefresh = status === 401 && originalRequest && !originalRequest.__isRetryRequest && authMode !== 'sanctum'

    if (!shouldTryRefresh) {
      if (status === 401 && unauthorizedHandler) unauthorizedHandler()
      return Promise.reject(error)
    }

    if (refreshingToken) {
      return new Promise((resolve, reject) => {
        queueRequest(
          async () => {
            try {
              originalRequest.__isRetryRequest = true
              resolve(await apiClient(originalRequest))
            } catch (requestError) {
              reject(requestError)
            }
          },
          reject,
        )
      })
    }

    try {
      refreshingToken = true
      refreshPromise = runRefresh()
      await refreshPromise
      flushQueue()
      originalRequest.__isRetryRequest = true
      return await apiClient(originalRequest)
    } catch (refreshError) {
      flushQueue(refreshError)
      if (unauthorizedHandler) unauthorizedHandler()
      return Promise.reject(refreshError)
    } finally {
      refreshingToken = false
      refreshPromise = null
    }
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
    payload?.products ||
    payload?.categories ||
    payload?.orders ||
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
