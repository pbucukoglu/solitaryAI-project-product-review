import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Increased to 30 seconds for network issues
});

const fetchJsonWithTimeout = async (url, options = {}, timeoutMs = 15000) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
  );

  const response = await Promise.race([
    fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      ...options,
    }),
    timeoutPromise,
  ]);

  const status = response.status;

  // 204 No Content: do not attempt to parse
  if (status === 204) {
    return null;
  }

  const rawText = await response.text();

  if (!response.ok) {
    const messageFromBody = (rawText || '').trim();
    const fallback = status === 404 ? 'Not found' : `HTTP_${status}`;
    const err = new Error(messageFromBody || fallback);
    err.status = status;
    err.body = messageFromBody || null;
    throw err;
  }

  const trimmed = (rawText || '').trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
};

// Products API
export const productService = {
  getAll: async (
    page = 0,
    size = 20,
    sortBy = 'createdAt',
    sortDir = 'DESC',
    category = null,
    search = null,
    minRating = null,
    minPrice = null,
    maxPrice = null
  ) => {
    const params = { page, size, sortBy, sortDir };
    if (category) params.category = category;
    if (search) params.search = search;
    if (minRating !== null && minRating !== undefined) params.minRating = minRating;
    if (minPrice !== null && minPrice !== undefined) params.minPrice = minPrice;
    if (maxPrice !== null && maxPrice !== undefined) params.maxPrice = maxPrice;
    
    // DEBUG: Log API call
    console.log('🌐 [API] productService.getAll called with params:', params);
    console.log('🌐 [API] Full URL will be:', `${API_BASE_URL}${API_ENDPOINTS.PRODUCTS}?${new URLSearchParams(params).toString()}`);
    const response = await fetchJsonWithTimeout(
      `${API_BASE_URL}${API_ENDPOINTS.PRODUCTS}?${new URLSearchParams(params).toString()}`,
      { method: 'GET' },
      15000
    );
    console.log('🌐 [API] productService.getAll response content:', JSON.stringify(response.content || response, null, 2));
    return response;
  },
  
  getById: async (id) => {
    if (!id) {
      console.error('🔍 [API] Error: productService.getById called with undefined id');
      throw new Error('Not found');
    }
    return await fetchJsonWithTimeout(`${API_BASE_URL}${API_ENDPOINTS.PRODUCTS}/${id}`, { method: 'GET' }, 15000);
  },

  getReviewSummary: async (productId, limit = 30, lang = 'en') => {
    if (!productId) {
      throw new Error('Not found');
    }
    const safeLimit = Number.isFinite(Number(limit)) ? Number(limit) : 30;
    const safeLang = (lang || 'en').toString();
    return await fetchJsonWithTimeout(
      `${API_BASE_URL}${API_ENDPOINTS.PRODUCTS}/${productId}/review-summary?limit=${encodeURIComponent(safeLimit)}&lang=${encodeURIComponent(safeLang)}`,
      { method: 'GET' },
      15000
    );
  },
};

// Reviews API
export const reviewService = {
  create: async (reviewData) => {
    return await fetchJsonWithTimeout(
      `${API_BASE_URL}${API_ENDPOINTS.REVIEWS}`,
      { method: 'POST', body: JSON.stringify(reviewData) },
      15000
    );
  },

  toggleHelpful: async (reviewId, deviceId) => {
    return await fetchJsonWithTimeout(
      `${API_BASE_URL}${API_ENDPOINTS.REVIEWS}/${reviewId}/helpful?deviceId=${encodeURIComponent(deviceId)}`,
      { method: 'POST' },
      15000
    );
  },

  update: async (reviewId, reviewData) => {
    return await fetchJsonWithTimeout(
      `${API_BASE_URL}${API_ENDPOINTS.REVIEWS}/${reviewId}`,
      { method: 'PUT', body: JSON.stringify(reviewData) },
      15000
    );
  },

  delete: async (reviewId, deviceId) => {
    await fetchJsonWithTimeout(
      `${API_BASE_URL}${API_ENDPOINTS.REVIEWS}/${reviewId}?deviceId=${deviceId}`,
      { method: 'DELETE' },
      15000
    );
    return true;
  },
  
  getByProductId: async (productId, page = 0, size = 20, sortBy = 'createdAt', sortDir = 'DESC', minRating = null) => {
    console.log('🌐 [API] reviewService.getByProductId called with productId:', productId);
    const params = { page, size, sortBy, sortDir };
    if (minRating !== null && minRating !== undefined) {
      params.minRating = minRating;
    }

    try {
      console.log('🌐 [API] reviewService.getByProductId called with params:', { productId, ...params });
      console.log(
        '🌐 [API] Full URL will be:',
        `${API_BASE_URL}${API_ENDPOINTS.REVIEWS}/product/${productId}?${new URLSearchParams(params).toString()}`
      );
    } catch {
      // no-op
    }

    return await fetchJsonWithTimeout(
      `${API_BASE_URL}${API_ENDPOINTS.REVIEWS}/product/${productId}?${new URLSearchParams(params).toString()}`,
      { method: 'GET' },
      15000
    );
  },
};

export default api;
