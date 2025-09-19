import { auth } from '@clerk/nextjs/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface RequestConfig extends RequestInit {
  params?: Record<string, string>;
}

export class ApiClient {
  static async request<T = any>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<T> {
    const { getToken } = await auth();
    const token = await getToken();

    const url = new URL(`${API_BASE_URL}${endpoint}`);

    if (config?.params) {
      Object.entries(config.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const headers = new Headers(config?.headers);

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    if (!headers.has('Content-Type') && config?.body && typeof config.body === 'string') {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url.toString(), {
      ...config,
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: `HTTP error! status: ${response.status}`
      }));
      throw new Error(error.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  static async get<T = any>(endpoint: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      params
    });
  }

  static async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE'
    });
  }
}

// Client-side API client for use in React components
export class ClientApiClient {
  static async request<T = any>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<T> {
    const url = new URL(`${API_BASE_URL}${endpoint}`);

    if (config?.params) {
      Object.entries(config.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const headers = new Headers(config?.headers);

    // Get token from Clerk on client side
    if (typeof window !== 'undefined' && window.Clerk) {
      try {
        const token = await window.Clerk.session?.getToken();
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
      } catch (error) {
        console.error('Failed to get Clerk token:', error);
      }
    }

    if (!headers.has('Content-Type') && config?.body && typeof config.body === 'string') {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url.toString(), {
      ...config,
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: `HTTP error! status: ${response.status}`
      }));
      throw new Error(error.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  static async get<T = any>(endpoint: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      params
    });
  }

  static async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE'
    });
  }
}