import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { demoService } from './demoService';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Increased to 30 seconds for network issues
});

const liveProductIdCacheByDemoId = new Map();

const normalizeProductName = (name) => {
  return String(name || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
};

const resolveLiveProductIdFromDemoProduct = async (demoProduct) => {
  if (!demoProduct) return null;
  const demoId = demoProduct?.id;
  if (demoId !== null && demoId !== undefined && liveProductIdCacheByDemoId.has(demoId)) {
    return liveProductIdCacheByDemoId.get(demoId);
  }

  const baseUrl = await demoService.getBaseUrl();
  const rawName = (demoProduct?.name || '').trim();
  if (!rawName) return null;
  const normalizedName = normalizeProductName(rawName);
  const sanitizedSearch = rawName.replace(/["'`]/g, '').trim();

  const tryFetchJson = async (url) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  try {
    // 1) Try search endpoint first (sanitized for better LIKE matching)
    if (sanitizedSearch) {
      const params = { page: 0, size: 20, search: sanitizedSearch };
      const data = await tryFetchJson(`${baseUrl}${API_ENDPOINTS.PRODUCTS}?${new URLSearchParams(params).toString()}`);
      const match = Array.isArray(data?.content)
        ? data.content.find((p) => normalizeProductName(p?.name) === normalizedName) || data.content[0]
        : null;
      const liveId = match?.id ?? null;
      if (demoId !== null && demoId !== undefined && liveId !== null && liveId !== undefined) {
        liveProductIdCacheByDemoId.set(demoId, liveId);
      }
      if (liveId) return liveId;
    }

    // 2) Fallback: fetch a larger list (covers full seeded dataset in this project)
    const listData = await tryFetchJson(
      `${baseUrl}${API_ENDPOINTS.PRODUCTS}?${new URLSearchParams({ page: 0, size: 200 }).toString()}`
    );
    const listMatch = Array.isArray(listData?.content)
      ? listData.content.find((p) => normalizeProductName(p?.name) === normalizedName)
      : null;
    const fallbackLiveId = listMatch?.id ?? null;
    if (demoId !== null && demoId !== undefined && fallbackLiveId !== null && fallbackLiveId !== undefined) {
      liveProductIdCacheByDemoId.set(demoId, fallbackLiveId);
    }

    if (!fallbackLiveId) {
      console.log('🌐 [API] Could not resolve demo product to live ID:', { demoId, rawName });
    }

    return fallbackLiveId;
  } catch {
    return null;
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
    const filters = { category, search, minRating, minPrice, maxPrice, sortBy, sortDir };
    
    // Instagram-style: Start with demo data immediately, try live API in background
    const demoData = await demoService.getDemoProducts(page, size, filters);
    
    // Try live API in background (non-blocking)
    const baseUrl = await demoService.getBaseUrl();
    const params = { page, size, sortBy, sortDir };
    if (category) params.category = category;
    if (search) params.search = search;
    if (minRating !== null && minRating !== undefined) params.minRating = minRating;
    if (minPrice !== null && minPrice !== undefined) params.minPrice = minPrice;
    if (maxPrice !== null && maxPrice !== undefined) params.maxPrice = maxPrice;
    
    // DEBUG: Log API call
    console.log('🌐 [API] productService.getAll called with params:', params);
    console.log('🌐 [API] Full URL will be:', `${baseUrl}${API_ENDPOINTS.PRODUCTS}?${new URLSearchParams(params).toString()}`);
    
    // Try live API in background
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for background
      
      const response = await fetch(`${baseUrl}${API_ENDPOINTS.PRODUCTS}?${new URLSearchParams(params).toString()}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        
        // DEBUG: Log response
        console.log('✅ [API] Live API Response - switching to live data');
        
        // Success - disable demo mode and return live data
        await demoService.setDemoMode(false);
        return data;
      }
    } catch (error) {
      console.log('🌐 [API] Live API failed, keeping demo data:', error.message);
      // Keep demo mode active
      await demoService.setDemoMode(true);
    }
    
    // Return demo data immediately (Instagram-style)
    return demoData;
  },
  
  getById: async (id) => {
    // Instagram-style: Start with demo data immediately (if available)
    let demoData = null;
    try {
      demoData = await demoService.getDemoProductById(id);
    } catch (e) {
      demoData = null;
    }
    
    // Try live API in background
    try {
      const baseUrl = await demoService.getBaseUrl();

      const resolvedLiveId = await resolveLiveProductIdFromDemoProduct(demoData);
      const effectiveId = resolvedLiveId || id;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${baseUrl}${API_ENDPOINTS.PRODUCTS}/${effectiveId}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [API] Live API Response for product detail - switching to live data');
        await demoService.setDemoMode(false);
        return data;
      }
      if (!response.ok) {
        throw new Error(response.status === 404 ? 'Product not found' : `HTTP_${response.status}`);
      }
    } catch (error) {
      console.log('🌐 [API] Live API failed for product detail, keeping demo data:', error.message);
      await demoService.setDemoMode(true);
      if (!demoData) {
        throw error;
      }
    }
    
    // Return demo data immediately
    return demoData;
  },
};

// Reviews API
export const reviewService = {
  create: async (reviewData) => {
    // Instagram-style: Try live API immediately for reviews (user action)
    try {
      const baseUrl = await demoService.getBaseUrl();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${baseUrl}${API_ENDPOINTS.REVIEWS}`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [API] Review created successfully on live API');
        await demoService.setDemoMode(false);
        return data;
      }
    } catch (error) {
      console.log('🌐 [API] Review creation failed, saving locally:', error.message);
      await demoService.setDemoMode(true);
      return await demoService.addDemoReview(reviewData.productId, reviewData);
    }
  },

  toggleHelpful: async (reviewId, deviceId) => {
    try {
      const baseUrl = await demoService.getBaseUrl();
      const timeoutMs = 5000;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
      );

      const response = await Promise.race([
        fetch(`${baseUrl}${API_ENDPOINTS.REVIEWS}/${reviewId}/helpful?deviceId=${encodeURIComponent(deviceId)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }),
        timeoutPromise,
      ]);

      if (response.ok) {
        const data = await response.json();
        await demoService.setDemoMode(false);
        return data;
      }

      const message = `HTTP_${response.status}`;
      throw new Error(message);
    } catch (error) {
      await demoService.setDemoMode(true);
      throw error;
    }
  },

  update: async (reviewId, reviewData) => {
    // Instagram-style: Try live API immediately for user actions
    try {
      const baseUrl = await demoService.getBaseUrl();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${baseUrl}${API_ENDPOINTS.REVIEWS}/${reviewId}`, {
        method: 'PUT',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [API] Review updated successfully on live API');
        await demoService.setDemoMode(false);
        return data;
      }
    } catch (error) {
      console.log('🌐 [API] Review update failed, updating locally:', error.message);
      await demoService.setDemoMode(true);
      return await demoService.updateDemoReview(reviewId, reviewData);
    }
  },

  delete: async (reviewId, deviceId) => {
    // Instagram-style: Try live API immediately for user actions
    try {
      const baseUrl = await demoService.getBaseUrl();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${baseUrl}${API_ENDPOINTS.REVIEWS}/${reviewId}?deviceId=${deviceId}`, {
        method: 'DELETE',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('✅ [API] Review deleted successfully on live API');
        await demoService.setDemoMode(false);
        return true;
      }
    } catch (error) {
      console.log('🌐 [API] Review delete failed, deleting locally:', error.message);
      await demoService.setDemoMode(true);
      return await demoService.deleteDemoReview(reviewId);
    }
  },
  
  getByProductId: async (productId, page = 0, size = 20, sortBy = 'createdAt', sortDir = 'DESC', minRating = null) => {
    // Instagram-style: Start with demo data immediately (if available)
    let demoReviews = null;
    try {
      demoReviews = await demoService.getDemoProductById(productId);
    } catch (e) {
      demoReviews = null;
    }

    const allDemoItemsRaw = demoReviews?.reviews || [];
    const minRatingNumber = minRating !== null && minRating !== undefined ? Number(minRating) : null;
    const allDemoItems = allDemoItemsRaw
      .filter((r) => {
        if (!minRatingNumber) return true;
        return (Number(r?.rating) || 0) >= minRatingNumber;
      })
      .sort((a, b) => {
        if (sortBy !== 'createdAt') return 0;
        const ad = new Date(a?.createdAt || 0).getTime();
        const bd = new Date(b?.createdAt || 0).getTime();
        return sortDir === 'ASC' ? ad - bd : bd - ad;
      });

    const startIndex = Math.max(0, Number(page) || 0) * (Number(size) || 0);
    const endIndex = startIndex + (Number(size) || 0);
    const pageItems = allDemoItems.slice(startIndex, endIndex);
    const totalElements = allDemoItems.length;
    const totalPages = size > 0 ? Math.max(1, Math.ceil(totalElements / size)) : 1;
    const last = totalPages ? page >= totalPages - 1 : true;

    const demoResponse = {
      content: pageItems,
      totalElements,
      totalPages,
      size: size,
      number: page,
      first: page === 0,
      last,
    };
    
    // Try live API in background
    try {
      const baseUrl = await demoService.getBaseUrl();

      const resolvedLiveId = await resolveLiveProductIdFromDemoProduct(demoReviews);
      const effectiveProductId = resolvedLiveId || productId;

      const params = { page, size, sortBy, sortDir };
      if (minRating !== null && minRating !== undefined) {
        params.minRating = minRating;
      }

      // DEBUG: Log API call
      try {
        console.log('🌐 [API] reviewService.getByProductId called with params:', { productId: effectiveProductId, ...params });
        console.log(
          '🌐 [API] Full URL will be:',
          `${baseUrl}${API_ENDPOINTS.REVIEWS}/product/${effectiveProductId}?${new URLSearchParams(params).toString()}`
        );
      } catch {
        // no-op (avoid crashing on logging)
      }

      const timeoutMs = 5000;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
      );

      const response = await Promise.race([
        fetch(`${baseUrl}${API_ENDPOINTS.REVIEWS}/product/${effectiveProductId}?${new URLSearchParams(params).toString()}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
        timeoutPromise,
      ]);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [API] Live reviews loaded - switching to live data');
        await demoService.setDemoMode(false);
        return data;
      }
      throw new Error(response.status === 404 ? 'Product not found' : `HTTP_${response.status}`);
    } catch (error) {
      console.log('🌐 [API] Live reviews failed, keeping demo reviews:', error.message);
      await demoService.setDemoMode(true);
      if (!demoReviews) {
        throw error;
      }
    }
    
    // Return demo reviews immediately
    return demoResponse;
  },
};

export default api;

