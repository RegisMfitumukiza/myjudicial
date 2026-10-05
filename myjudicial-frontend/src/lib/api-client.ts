/**
 * Centralized API client utility
 * Handles backend API calls with proper URL construction
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || '/api/v1';

async function safeJson(response: Response): Promise<any> {
  if (response.status === 204) return null;
  try {
    const text = await response.text();
    if (!text || !text.trim()) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const apiClient = {
  /**
   * Get the full backend API URL for an endpoint
   * @param endpoint - API endpoint path (e.g., '/geocoding/rwanda-locations')
   * @returns Full URL (e.g., 'http://localhost:4000/api/v1/geocoding/rwanda-locations')
   */
  getUrl: (endpoint: string): string => {
    // Remove leading slash from endpoint if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${API_BASE_URL}${API_PREFIX}/${cleanEndpoint}`;
  },

  /**
   * Make a GET request to the backend API
   * @param endpoint - API endpoint path
   * @param options - Additional fetch options
   * @returns Promise with response data
   */
  get: async (endpoint: string, options?: RequestInit) => {
    const response = await fetch(apiClient.getUrl(endpoint), {
      method: 'GET',
      ...options,
    });
    return safeJson(response);
  },

  /**
   * Make a POST request to the backend API
   * @param endpoint - API endpoint path
   * @param data - Request body data
   * @param options - Additional fetch options
   * @returns Promise with response data
   */
  post: async (endpoint: string, data?: any, options?: RequestInit) => {
    const response = await fetch(apiClient.getUrl(endpoint), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    return safeJson(response);
  },

  /**
   * Make a PUT request to the backend API
   * @param endpoint - API endpoint path
   * @param data - Request body data
   * @param options - Additional fetch options
   * @returns Promise with response data
   */
  put: async (endpoint: string, data?: any, options?: RequestInit) => {
    const response = await fetch(apiClient.getUrl(endpoint), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    return safeJson(response);
  },

  /**
   * Make a DELETE request to the backend API
   * @param endpoint - API endpoint path
   * @param options - Additional fetch options
   * @returns Promise with response data
   */
  delete: async (endpoint: string, options?: RequestInit) => {
    const response = await fetch(apiClient.getUrl(endpoint), {
      method: 'DELETE',
      ...options,
    });
    return safeJson(response);
  },
};