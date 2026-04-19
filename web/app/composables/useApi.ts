interface ApiOptions {
  headers?: Record<string, string>
  query?: Record<string, unknown>
  body?: Record<string, unknown> | BodyInit | null
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'CONNECT' | 'OPTIONS' | 'TRACE'
}

interface ApiResponse<T> {
  ok: boolean
  data?: T
  error?: {
    message?: string
  }
}

interface FetchError {
  data?: {
    error?: {
      message?: string
    }
  }
  message?: string
}

export const useApi = () => {
  const userStore = useUserStore()
  const runtimeConfig = useRuntimeConfig()
  const baseURL = runtimeConfig.public.apiBase || ''

  const request = async <T>(url: string, options: ApiOptions = {}): Promise<T> => {
    const headers: Record<string, string> = {
      ...options.headers as Record<string, string>
    }

    if (userStore.accessToken) {
      headers['Authorization'] = `Bearer ${userStore.accessToken}`
    }

    try {
      const response = await $fetch<ApiResponse<T>>(url, {
        baseURL,
        method: options.method,
        query: options.query,
        body: options.body,
        headers
      })

      if (response && response.ok) {
        return response.data as T
      } else {
        throw new Error(response?.error?.message || 'API request failed')
      }
    } catch (err: unknown) {
      const fetchError = err as FetchError
      const message = fetchError.data?.error?.message || fetchError.message || 'Unknown network error'
      throw new Error(message)
    }
  }

  return {
    get: <T>(url: string, options?: Omit<ApiOptions, 'method' | 'body'>) => request<T>(url, { ...options, method: 'GET' }),
    post: <T>(url: string, body?: Record<string, unknown> | BodyInit | null, options?: Omit<ApiOptions, 'method'>) => request<T>(url, { ...options, method: 'POST', body }),
    put: <T>(url: string, body?: Record<string, unknown> | BodyInit | null, options?: Omit<ApiOptions, 'method'>) => request<T>(url, { ...options, method: 'PUT', body }),
    delete: <T>(url: string, options?: Omit<ApiOptions, 'method' | 'body'>) => request<T>(url, { ...options, method: 'DELETE' })
  }
}
