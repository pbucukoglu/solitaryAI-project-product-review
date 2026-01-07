import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import {
  Animated,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { productService } from '../services/api';
import { wishlistService } from '../services/wishlist';
import { demoService } from '../services/demoService';
import { useTheme } from '../context/ThemeContext';

import OfflineBanner from '../components/OfflineBanner';
import DemoBanner from '../components/DemoBanner';
import Skeleton, { SkeletonRow } from '../components/Skeleton';
import ProductCard from '../components/ProductCard';

const ProductListScreen = ({ navigation }) => {
  const { theme } = useTheme();

  const entranceProgress = useRef(new Animated.Value(0)).current;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('DESC');
  const [showFilters, setShowFilters] = useState(false);
  const [categories] = useState(['Electronics', 'Clothing', 'Books', 'Home & Kitchen', 'Sports & Outdoors']);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [showFavorites, setShowFavorites] = useState(false);
  const [minRating, setMinRating] = useState(null);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);

  const [favoritesToggleWidth, setFavoritesToggleWidth] = useState(0);
  const favoritesIndicatorX = useRef(new Animated.Value(0)).current;
  const filterModalSlideY = useRef(new Animated.Value(100)).current;
  const filterModalOpacity = useRef(new Animated.Value(0)).current;
  const filterModalScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (showFilters) {
      Animated.parallel([
        Animated.spring(filterModalSlideY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 8,
        }),
        Animated.timing(filterModalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(filterModalScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(filterModalSlideY, {
          toValue: 100,
          useNativeDriver: true,
          tension: 65,
          friction: 8,
        }),
        Animated.timing(filterModalOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(filterModalScale, {
          toValue: 0.95,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
    }
  }, [showFilters]);

  const sortOptions = useMemo(
    () => [
      { label: 'Newest', sortBy: 'createdAt', sortDir: 'DESC' },
      { label: 'Price: Low to High', sortBy: 'price', sortDir: 'ASC' },
      { label: 'Price: High to Low', sortBy: 'price', sortDir: 'DESC' },
      { label: 'Rating: High to Low', sortBy: 'averageRating', sortDir: 'DESC' },
      { label: 'Name: A–Z', sortBy: 'name', sortDir: 'ASC' },
    ],
    []
  );

  const selectedSortLabel = useMemo(() => {
    const found = sortOptions.find((s) => s.sortBy === sortBy && s.sortDir === sortDir);
    if (found) return found.label;
    return 'Custom';
  }, [sortBy, sortDir, sortOptions]);

  useEffect(() => {
    if (!favoritesToggleWidth) return;
    const segmentWidth = favoritesToggleWidth / 2;
    Animated.spring(favoritesIndicatorX, {
      toValue: showFavorites ? segmentWidth : 0,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  }, [showFavorites, favoritesToggleWidth, favoritesIndicatorX]);

  const loadWishlist = React.useCallback(async () => {
    try {
      const ids = await wishlistService.getIds();
      setFavoriteIds(new Set(ids));
    } catch (e) {
      console.error('Error loading wishlist:', e);
    }
  }, []);

  const toggleFavorite = React.useCallback(async (productId) => {
    try {
      const ids = await wishlistService.toggle(productId);
      setFavoriteIds(new Set(ids));
    } catch (e) {
      console.error('Error toggling wishlist:', e);
    }
  }, []);

  // Check demo mode status
  const checkDemoMode = useCallback(async () => {
    const demoMode = await demoService.shouldUseDemoMode();
    setIsDemoMode(demoMode);
  }, []);

  // Try to reconnect to live API
  const tryReconnect = useCallback(async () => {
    const baseUrl = await demoService.getBaseUrl();
    const isConnected = await demoService.testConnection(baseUrl);
    if (isConnected) {
      await demoService.setDemoMode(false);
      setIsDemoMode(false);
      // Reload products with live API
      loadProducts(0, false);
    }
  }, []);

  const loadProducts = async (pageNum = 0, append = false, overrideFilters = null) => {
    try {
      setLoadError(null);
      setLoading(pageNum === 0);
      // Use override filters if provided (from timer), otherwise use current state
      const filters = overrideFilters || {
        sortBy,
        sortDir,
        selectedCategory,
        searchQuery,
        minRating,
        minPrice,
        maxPrice,
      };
      
      // DEBUG: Log what we're sending to API
      const debugInfo = {
        pageNum,
        append,
        overrideFilters: overrideFilters !== null,
        filters: {
          sortBy: filters.sortBy,
          sortDir: filters.sortDir,
          category: filters.selectedCategory,
          search: filters.searchQuery,
          minRating: filters.minRating,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
        },
        currentState: {
          sortBy,
          sortDir,
          selectedCategory,
          searchQuery,
          minRating,
          minPrice,
          maxPrice,
        }
      };
      console.log('🔍 [ProductList] loadProducts called with:', JSON.stringify(debugInfo, null, 2));
      
      const minPriceNumber = filters.minPrice && filters.minPrice.trim().length > 0 ? Number(filters.minPrice) : null;
      const maxPriceNumber = filters.maxPrice && filters.maxPrice.trim().length > 0 ? Number(filters.maxPrice) : null;

      const response = await productService.getAll(
        pageNum, 
        20, 
        filters.sortBy, 
        filters.sortDir, 
        filters.selectedCategory, 
        filters.searchQuery || null,
        filters.minRating,
        Number.isFinite(minPriceNumber) ? minPriceNumber : null,
        Number.isFinite(maxPriceNumber) ? maxPriceNumber : null
      );
      
      // Check if we're in demo mode after the API call
      await checkDemoMode();
      
      // DEBUG: Log response
      console.log('✅ [ProductList] API Response:', {
        totalElements: response.totalElements,
        productsCount: response.content?.length || 0,
        firstProduct: response.content?.[0]?.name || 'none',
        allProductNames: response.content?.map(p => p.name).join(', ') || 'none'
      });
      
      if (append) {
        setProducts((prev) => {
          const merged = [...(prev || []), ...(response.content || [])];
          const seen = new Set();
          const deduped = [];
          for (const p of merged) {
            const id = p?.id;
            if (id === null || id === undefined) continue;
            if (seen.has(id)) continue;
            seen.add(id);
            deduped.push(p);
          }
          return deduped;
        });
      } else {
        setProducts(response.content);
      }
      
      setHasMore(!response.last);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading products:', error);
      // Don't show error for demo mode fallback - the API service handles it
      if (!error.message || !error.message.includes('DEMO_MODE_FALLBACK')) {
        setLoadError('Failed to load products.');
        Alert.alert('Error', `Failed to load products. ${error.message || 'Please check your connection.'}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Track previous values to detect changes
  const prevFiltersRef = useRef({ selectedCategory: null, sortBy: 'createdAt', sortDir: 'DESC', searchQuery: '', minRating: null, minPrice: '', maxPrice: '' });
  const isFirstMount = useRef(true);
  
  // Initial load on mount
  useEffect(() => {
    loadWishlist();
    loadProducts(0, false);
    isFirstMount.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  useEffect(() => {
    if (loading) return;
    if (!products || products.length === 0) return;

    entranceProgress.setValue(0);
    Animated.spring(entranceProgress, {
      toValue: 1.25,
      useNativeDriver: true,
      speed: 14,
      bounciness: 6,
    }).start();
  }, [loading, products, entranceProgress]);

  useFocusEffect(
    React.useCallback(() => {
      loadWishlist();
      checkDemoMode(); // Check demo mode on focus
    }, [loadWishlist, checkDemoMode])
  );
  
  // Combined effect: Load products when filters, sort, or search changes
  useEffect(() => {
    // Skip on first mount (handled above)
    if (isFirstMount.current) {
      return;
    }
    const currentFilters = {
      selectedCategory: selectedCategory,  // Fixed: use selectedCategory instead of category
      sortBy: sortBy,
      sortDir: sortDir,
      searchQuery: searchQuery || '',  // Fixed: use searchQuery instead of search
      minRating: minRating,
      minPrice: minPrice,
      maxPrice: maxPrice,
    };

    // Check if filters actually changed
    const filtersChanged = 
      prevFiltersRef.current.selectedCategory !== currentFilters.selectedCategory ||
      prevFiltersRef.current.sortBy !== currentFilters.sortBy ||
      prevFiltersRef.current.sortDir !== currentFilters.sortDir ||
      prevFiltersRef.current.searchQuery !== currentFilters.searchQuery ||
      prevFiltersRef.current.minRating !== currentFilters.minRating ||
      prevFiltersRef.current.minPrice !== currentFilters.minPrice ||
      prevFiltersRef.current.maxPrice !== currentFilters.maxPrice;

    if (!filtersChanged) {
      return; // No change, skip
    }

    // Determine if this is a search change (user typing)
    const isSearchChange = prevFiltersRef.current.searchQuery !== currentFilters.searchQuery;
    
    // DEBUG: Log filter changes
    console.log('🔄 [ProductList] Filter change detected:', {
      isSearchChange,
      previous: prevFiltersRef.current,
      current: currentFilters,
      willDebounce: isSearchChange && (currentFilters.searchQuery?.length || 0) > 0
    });
    
    // Update ref AFTER capturing values for timer
    prevFiltersRef.current = currentFilters;

    // Debounce only for search, immediate for filters/sort
    // Pass current filters directly to avoid closure issues
    const delay = isSearchChange && (currentFilters.searchQuery?.length || 0) > 0 ? 500 : 0;
    console.log(`⏱️ [ProductList] Setting timer with ${delay}ms delay`);
    
    const timer = setTimeout(() => {
      console.log('⏱️ [ProductList] Timer fired, calling loadProducts with:', currentFilters);
      loadProducts(0, false, currentFilters);
    }, delay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, sortBy, sortDir, searchQuery, minRating, minPrice, maxPrice]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts(0, false);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadProducts(page + 1, true);
    }
  };

  const handleSearch = () => {
    // Reset to first page when searching (called on Enter key)
    setPage(0);
    loadProducts(0, false);
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category === selectedCategory ? null : category);
    setPage(0);
  };

  const handleSort = (option) => {
    setSortBy(option.sortBy);
    setSortDir(option.sortDir);
    setPage(0);
  };

  const renderProduct = ({ item, index }) => {
    const isFavorite = favoriteIds.has(item.id);

    return (
      <ProductCard
        item={item}
        isFavorite={isFavorite}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        onToggleFavorite={() => toggleFavorite(item.id)}
        entranceIndex={index}
        entranceProgress={entranceProgress}
        style={{ marginBottom: 14 }}
      />
    );
  };

  const renderSkeletonItem = () => (
    <View style={[styles.productCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
      <Skeleton height={92} radius={12} baseColor={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} highlightColor={theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'} />
      <View style={[styles.productInfo, { backgroundColor: theme.colors.surface }]}> 
        <Skeleton height={14} width={'70%'} radius={10} baseColor={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} highlightColor={theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'} />
        <View style={{ height: 10 }} />
        <Skeleton height={12} width={'40%'} radius={10} baseColor={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} highlightColor={theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'} />
        <View style={{ height: 12 }} />
        <SkeletonRow>
          <Skeleton height={16} width={80} radius={10} baseColor={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} highlightColor={theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'} />
          <View style={{ width: 10 }} />
          <Skeleton height={16} width={64} radius={10} baseColor={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} highlightColor={theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'} />
        </SkeletonRow>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <OfflineBanner theme={theme} />
      {isDemoMode && <DemoBanner onTryAgain={tryReconnect} />}
      {/* Search and Filter Bar */}
      <View style={[styles.searchBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <View style={[styles.searchInputWrap, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}>
          <Ionicons name="search" size={18} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search products"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.favoritesToggleRow, { backgroundColor: theme.colors.surface }]}> 
        <View
          style={[styles.favoritesToggleContainer, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}
          onLayout={(e) => setFavoritesToggleWidth(e.nativeEvent.layout.width)}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              styles.favoritesToggleIndicator,
              {
                width: favoritesToggleWidth ? favoritesToggleWidth / 2 : '50%',
                backgroundColor: theme.colors.primary,
                transform: [{ translateX: favoritesIndicatorX }],
              },
            ]}
          />

          <TouchableOpacity
            style={styles.favoritesToggle}
            onPress={() => setShowFavorites(false)}
            activeOpacity={0.85}
          >
            <Text style={[styles.favoritesToggleText, { color: !showFavorites ? '#fff' : theme.colors.text }]}>All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.favoritesToggle}
            onPress={() => setShowFavorites(true)}
            activeOpacity={0.85}
          >
            <Text style={[styles.favoritesToggleText, { color: showFavorites ? '#fff' : theme.colors.text }]}>Favorites</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Filters */}
      {(selectedCategory || minRating !== null || minPrice || maxPrice || sortBy !== 'createdAt' || sortDir !== 'DESC') && (
        <View style={[styles.activeFilters, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
          {selectedCategory && (
            <View style={[styles.filterChip, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}>
              <Text style={[styles.filterChipText, { color: theme.colors.text }]}>Category: {selectedCategory}</Text>
              <TouchableOpacity onPress={() => setSelectedCategory(null)}>
                <Text style={[styles.filterChipClose, { color: theme.colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {minRating !== null && (
            <View style={[styles.filterChip, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}>
              <Text style={[styles.filterChipText, { color: theme.colors.text }]}>Min rating: {minRating}+</Text>
              <TouchableOpacity onPress={() => setMinRating(null)}>
                <Text style={[styles.filterChipClose, { color: theme.colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {(minPrice || maxPrice) && (
            <View style={[styles.filterChip, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}>
              <Text style={[styles.filterChipText, { color: theme.colors.text }]}>Price: {minPrice || '0'} - {maxPrice || '∞'}</Text>
              <TouchableOpacity onPress={() => { setMinPrice(''); setMaxPrice(''); }}>
                <Text style={[styles.filterChipClose, { color: theme.colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={[styles.filterChip, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}
          >
            <Text style={[styles.filterChipText, { color: theme.colors.text }]}>
              Sort: {selectedSortLabel}
            </Text>
            <TouchableOpacity onPress={() => { setSortBy('createdAt'); setSortDir('DESC'); }}>
              <Text style={[styles.filterChipClose, { color: theme.colors.text }]}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading && products.length === 0 ? (
        <FlatList
          data={[0, 1, 2, 3, 4]}
          renderItem={renderSkeletonItem}
          keyExtractor={(item) => `s-${item}`}
          contentContainerStyle={styles.list}
        />
      ) : (
        <FlatList
        data={
          showFavorites
            ? products.filter((p) => favoriteIds.has(p.id))
            : products
        }
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        onEndReached={showFavorites ? undefined : loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {loadError ? (
              <>
                <Text style={[styles.emptyText, { color: theme.colors.danger }]}>{loadError}</Text>
                <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} onPress={() => loadProducts(0, false)}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {showFavorites
                  ? (products.some((p) => favoriteIds.has(p.id))
                      ? 'No favorites match your filters'
                      : 'No favorites yet')
                  : 'No products found'}
              </Text>
            )}
          </View>
        }
        ListFooterComponent={
          !showFavorites && hasMore && products.length > 0 ? (
            <ActivityIndicator style={styles.footerLoader} color={theme.colors.primary} />
          ) : null
        }
      />
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="none"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowFilters(false)}>
            <View />
          </TouchableOpacity>
          <Animated.View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              { transform: [{ translateY: filterModalSlideY }, { scale: filterModalScale }] },
              { opacity: filterModalOpacity },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Filters & Sort</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Text style={[styles.modalClose, { color: theme.colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Category Filter */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: theme.colors.text }]}>Category</Text>
                <View style={styles.categoryContainer}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryChip,
                        { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceAlt },
                        selectedCategory === category && [styles.categoryChipActive, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]
                      ]}
                      onPress={() => handleCategoryFilter(category)}
                    >
                      <Text style={[
                        styles.categoryChipText,
                        { color: theme.colors.text },
                        selectedCategory === category && styles.categoryChipTextActive
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Sort Options */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: theme.colors.text }]}>Sort By</Text>
                {sortOptions.map((option) => (
                  <TouchableOpacity
                    key={`${option.sortBy}-${option.sortDir}`}
                    style={[
                      styles.sortOption,
                      { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceAlt },
                      sortBy === option.sortBy && sortDir === option.sortDir && [styles.sortOptionActive, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]
                    ]}
                    onPress={() => handleSort(option)}
                  >
                    <Text style={[
                      styles.sortOptionText,
                      { color: theme.colors.text },
                      sortBy === option.sortBy && sortDir === option.sortDir && styles.sortOptionTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: theme.colors.text }]}>Minimum Rating</Text>
                <View style={styles.categoryContainer}>
                  {[4, 3, 2, 1].map((r) => (
                    <TouchableOpacity
                      key={`minrating-${r}`}
                      style={[
                        styles.categoryChip,
                        { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceAlt },
                        minRating === r && [styles.categoryChipActive, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]
                      ]}
                      onPress={() => setMinRating(minRating === r ? null : r)}
                    >
                      <Text style={[
                        styles.categoryChipText,
                        { color: theme.colors.text },
                        minRating === r && styles.categoryChipTextActive
                      ]}>
                        {r}+
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: theme.colors.text }]}>Price Range</Text>
                <View style={styles.priceRow}>
                  <TextInput
                    style={[styles.priceInput, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceAlt }]}
                    value={minPrice}
                    onChangeText={setMinPrice}
                    keyboardType="numeric"
                    placeholder="Min"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                  <TextInput
                    style={[styles.priceInput, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceAlt }]}
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    keyboardType="numeric"
                    placeholder="Max"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  setShowFilters(false);
                  loadProducts(0, false);
                }}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
  },
  searchBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    paddingVertical: 0,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6200ee',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  favoritesToggleRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  favoritesToggleContainer: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  favoritesToggleIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 14,
  },
  favoritesToggle: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  favoritesToggleText: {
    fontWeight: '800',
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#e6e6e6',
  },
  filterChipText: {
    fontSize: 12,
    color: '#333',
    marginRight: 6,
  },
  filterChipClose: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
    paddingTop: 12,
  },
  productCard: {
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#eee',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#e0e0e0',
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
  retryButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#6200ee',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footerLoader: {
    padding: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: '100%',
    maxHeight: '86%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  modalClose: {
    fontSize: 18,
    fontWeight: '900',
  },
  modalBody: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceInput: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e6e6e6',
  },
  categoryChipActive: {
    backgroundColor: '#6200ee',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#333',
  },
  categoryChipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sortOption: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
  },
  sortOptionActive: {
    backgroundColor: '#e3f2fd',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#333',
  },
  sortOptionTextActive: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  applyButton: {
    backgroundColor: '#6200ee',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProductListScreen;
