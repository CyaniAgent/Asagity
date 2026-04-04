export const useApi = () => {
  const userStore = useUserStore()
  const runtimeConfig = useRuntimeConfig()
  const baseURL = runtimeConfig.public.apiBase || ''

  const request = async <T = any>(url: string, options: any = {}) => {
    // Inject Authorization header if token exists
    const headers = {
      ...options.headers,
    }

    if (userStore.accessToken) {
      headers['Authorization'] = `Bearer ${userStore.accessToken}`
    }

    try {
      const response = await $fetch<any>(url, {
        baseURL,
        ...options,
        headers,
      })

      // Go backend uses { ok: boolean, data: any, error?: any } envelope
      if (response && response.ok) {
        return response.data as T
      } else {
        throw new Error(response?.error?.message || 'API request failed')
      }
    } catch (err: any) {
      const message = err.data?.error?.message || err.message || 'Unknown network error'
      throw new Error(message)
    }
  }

  return {
    get: <T = any>(url: string, options?: any) => request<T>(url, { ...options, method: 'GET' }),
    post: <T = any>(url: string, body?: any, options?: any) => request<T>(url, { ...options, method: 'POST', body }),
    put: <T = any>(url: string, body?: any, options?: any) => request<T>(url, { ...options, method: 'PUT', body }),
    delete: <T = any>(url: string, options?: any) => request<T>(url, { ...options, method: 'DELETE' }),
  }
}
