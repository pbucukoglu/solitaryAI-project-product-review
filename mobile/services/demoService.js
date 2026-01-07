import AsyncStorage from '@react-native-async-storage/async-storage';
import { demoProducts, getDemoReviewsByProductId, addDemoReview } from '../data/demoData';

const DEMO_MODE_KEY = '@demo_mode_active';
const BASE_URL_KEY = '@base_url';

// Default base URL (Render.com cloud deployment)
const DEFAULT_BASE_URL = 'https://product-review-api.onrender.com';

export const demoService = {
  // Check if we should use demo mode
  async shouldUseDemoMode() {
    try {
      const value = await AsyncStorage.getItem(DEMO_MODE_KEY);
      return value === 'true';
    } catch (error) {
      console.error('Error checking demo mode:', error);
      return false;
    }
  },

  // Set demo mode
  async setDemoMode(isDemo) {
    try {
      await AsyncStorage.setItem(DEMO_MODE_KEY, isDemo.toString());
    } catch (error) {
      console.error('Error setting demo mode:', error);
    }
  },

  // Get base URL
  async getBaseUrl() {
    try {
      // Try to get saved URL first
      const savedUrl = await AsyncStorage.getItem(BASE_URL_KEY);
      if (savedUrl) {
        return savedUrl;
      }
      
      // Default to Render.com URL (change this to your actual URL)
      return DEFAULT_BASE_URL;
    } catch (error) {
      console.error('Failed to get base URL:', error);
      return DEFAULT_BASE_URL; // Fallback to Render
    }
  },

  // Set base URL
  async setBaseUrl(url) {
    try {
      await AsyncStorage.setItem(BASE_URL_KEY, url);
    } catch (error) {
      console.error('Error setting base URL:', error);
    }
  },

  // Test connection to backend
  async testConnection(baseUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${baseUrl}/api/products?page=0&size=1`, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  },

  // API wrapper with automatic fallback to demo data
  async apiCall(apiFunction, ...args) {
    const baseUrl = await this.getBaseUrl();
    
    try {
      // Try API call with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000); // 7 second timeout

      const result = await apiFunction(baseUrl, ...args, { signal: controller.signal });
      
      clearTimeout(timeoutId);
      
      // If successful, ensure demo mode is disabled
      await this.setDemoMode(false);
      return result;
    } catch (error) {
      console.log('API call failed, falling back to demo mode:', error.message);
      
      // Enable demo mode
      await this.setDemoMode(true);
      
      // Return demo data
      throw new Error('DEMO_MODE_FALLBACK');
    }
  },

  // Demo data methods
  async getDemoProducts(page = 0, size = 10, filters = {}) {
    let filteredProducts = [...demoProducts];

    // Apply filters
    if (filters.category) {
      filteredProducts = filteredProducts.filter(p => p.category === filters.category);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(searchLower) || 
        p.description.toLowerCase().includes(searchLower)
      );
    }
    if (filters.minRating) {
      filteredProducts = filteredProducts.filter(p => p.averageRating >= filters.minRating);
    }
    if (filters.minPrice) {
      filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(filters.minPrice));
    }
    if (filters.maxPrice) {
      filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(filters.maxPrice));
    }

    // Apply sorting
    if (filters.sortBy) {
      filteredProducts.sort((a, b) => {
        let aVal = a[filters.sortBy];
        let bVal = b[filters.sortBy];

        // Handle null ratings (Amazon-style: nulls last)
        if (filters.sortBy === 'averageRating') {
          if (aVal === null) aVal = -1;
          if (bVal === null) bVal = -1;
        }

        if (filters.sortDir === 'DESC') {
          return bVal > aVal ? 1 : -1;
        } else {
          return aVal > bVal ? 1 : -1;
        }
      });
    }

    // Pagination
    const startIndex = page * size;
    const endIndex = startIndex + size;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    return {
      content: paginatedProducts,
      totalElements: filteredProducts.length,
      totalPages: Math.ceil(filteredProducts.length / size),
      size: size,
      number: page,
      first: page === 0,
      last: endIndex >= filteredProducts.length,
    };
  },

  async getDemoProductById(id) {
    const product = demoProducts.find(p => p.id === parseInt(id));
    if (!product) {
      throw new Error('Product not found');
    }

    const reviews = getDemoReviewsByProductId(id);
    
    return {
      ...product,
      reviews: reviews,
    };
  },

  async addDemoReview(productId, reviewData) {
    const newReview = addDemoReview(productId, reviewData);
    return newReview;
  },

  async updateDemoReview(reviewId, reviewData) {
    // Find and update review in demo data
    for (const productId in demoReviews) {
      const reviewIndex = demoReviews[productId].findIndex(r => r.id === reviewId);
      if (reviewIndex !== -1) {
        demoReviews[productId][reviewIndex] = {
          ...demoReviews[productId][reviewIndex],
          ...reviewData,
        };
        
        // Recalculate product rating
        const product = demoProducts.find(p => p.id === parseInt(productId));
        if (product) {
          const reviews = demoReviews[productId];
          const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
          product.averageRating = Math.round((totalRating / reviews.length) * 10) / 10;
          product.reviewCount = reviews.length;
        }
        
        return demoReviews[productId][reviewIndex];
      }
    }
    throw new Error('Review not found');
  },

  async deleteDemoReview(reviewId) {
    // Find and delete review in demo data
    for (const productId in demoReviews) {
      const reviewIndex = demoReviews[productId].findIndex(r => r.id === reviewId);
      if (reviewIndex !== -1) {
        demoReviews[productId].splice(reviewIndex, 1);
        
        // Recalculate product rating
        const product = demoProducts.find(p => p.id === parseInt(productId));
        if (product) {
          const reviews = demoReviews[productId];
          if (reviews.length > 0) {
            const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
            product.averageRating = Math.round((totalRating / reviews.length) * 10) / 10;
            product.reviewCount = reviews.length;
          } else {
            product.averageRating = null;
            product.reviewCount = 0;
          }
        }
        
        return true;
      }
    }
    throw new Error('Review not found');
  },
};
