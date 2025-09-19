import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ApiResponse } from '@/types'

class ApiClient {
  private instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.instance.interceptors.request.use(
      async (config) => {
        const token = await this.getAuthToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor to handle errors
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        return response
      },
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          this.clearAuthToken()
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login'
          }
        }
        return Promise.reject(error)
      }
    )
  }

  private async getAuthToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null

    // Try to get Clerk token first
    if (typeof window !== 'undefined' && (window as any).__clerk) {
      try {
        const clerk = (window as any).__clerk
        const session = await clerk.session
        if (session) {
          const token = await session.getToken()
          return token
        }
      } catch (error) {
        console.warn('Failed to get Clerk token:', error)
      }
    }

    // Fallback to localStorage token for backwards compatibility
    return localStorage.getItem('auth_token')
  }

  private clearAuthToken(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem('auth_token')

    // Also sign out from Clerk if available
    if (typeof window !== 'undefined' && (window as any).__clerk) {
      try {
        (window as any).__clerk.signOut()
      } catch (error) {
        console.warn('Failed to sign out from Clerk:', error)
      }
    }
  }

  public setAuthToken(token: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem('auth_token', token)
  }

  // Generic request methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.get(url, config)
    return response.data
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.post(url, data, config)
    return response.data
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.put(url, data, config)
    return response.data
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.patch(url, data, config)
    return response.data
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.delete(url, config)
    return response.data
  }

  // File upload method
  async uploadFile<T = any>(url: string, file: File, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await this.instance.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    })
    return response.data
  }

  // Authentication methods
  async login(email: string, password: string) {
    return this.post('/auth/login', { email, password })
  }

  async register(data: any) {
    return this.post('/auth/register', data)
  }

  async logout() {
    const response = await this.post('/auth/logout')
    this.clearAuthToken()
    return response
  }

  async refreshToken() {
    return this.post('/auth/refresh')
  }

  // Customer methods
  async getCustomerProfile() {
    return this.get('/customers/profile')
  }

  async updateCustomerLocation(location: any) {
    return this.put('/customers/location', location)
  }

  async getNearbyOffers(params: any) {
    return this.get('/customers/nearby-offers', { params })
  }

  async getFavorites() {
    return this.get('/customers/favorites')
  }

  async addFavorite(vendorId: string) {
    return this.post('/customers/favorites', { vendorId })
  }

  async removeFavorite(vendorId: string) {
    return this.delete(`/customers/favorites/${vendorId}`)
  }

  async getWishlist() {
    return this.get('/customers/wishlist')
  }

  async addToWishlist(productId: string) {
    return this.post('/customers/wishlist', { productId })
  }

  async removeFromWishlist(productId: string) {
    return this.delete(`/customers/wishlist/${productId}`)
  }

  // Vendor methods
  async getVendorProfile() {
    return this.get('/vendors/profile')
  }

  async updateVendorProfile(data: any) {
    return this.put('/vendors/profile', data)
  }

  async getVendorProducts() {
    return this.get('/vendors/products')
  }

  async createProduct(data: any) {
    return this.post('/vendors/products', data)
  }

  async updateProduct(productId: string, data: any) {
    return this.put(`/vendors/products/${productId}`, data)
  }

  async deleteProduct(productId: string) {
    return this.delete(`/vendors/products/${productId}`)
  }

  async getVendorOffers() {
    return this.get('/vendors/offers')
  }

  async createOffer(data: any) {
    return this.post('/vendors/offers', data)
  }

  async updateOffer(offerId: string, data: any) {
    return this.put(`/vendors/offers/${offerId}`, data)
  }

  async deleteOffer(offerId: string) {
    return this.delete(`/vendors/offers/${offerId}`)
  }

  // Search methods
  async searchOffers(params: any) {
    return this.get('/search/offers', { params })
  }

  async getSearchSuggestions(query: string) {
    return this.get('/search/suggestions', { params: { q: query } })
  }

  async getTrendingData() {
    return this.get('/search/trending')
  }

  // Chat methods
  async getConversations() {
    return this.get('/chat/conversations')
  }

  async getConversation(conversationId: string) {
    return this.get(`/chat/conversations/${conversationId}`)
  }

  async sendMessage(conversationId: string, data: any) {
    return this.post(`/chat/conversations/${conversationId}/messages`, data)
  }

  async markMessagesAsRead(conversationId: string) {
    return this.put(`/chat/conversations/${conversationId}/read`)
  }

  // Notification methods
  async getNotifications(page = 1, limit = 20) {
    return this.get('/notifications', { params: { page, limit } })
  }

  async markNotificationsAsRead(notificationIds?: string[]) {
    return this.put('/notifications/read', { notificationIds })
  }

  // Category methods
  async getCategories() {
    return this.get('/categories')
  }

  // Generic vendor/product fetching
  async getVendors(params?: any) {
    return this.get('/vendors', { params })
  }

  async getVendor(vendorId: string) {
    return this.get(`/vendors/${vendorId}`)
  }

  async getProducts(params?: any) {
    return this.get('/products', { params })
  }

  async getProduct(productId: string) {
    return this.get(`/products/${productId}`)
  }

  async getOffers(params?: any) {
    return this.get('/offers', { params })
  }

  async getOffer(offerId: string) {
    return this.get(`/offers/${offerId}`)
  }
}

export const apiClient = new ApiClient()
export default apiClient