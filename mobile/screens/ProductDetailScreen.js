import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  FlatList,
  Image,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Modal,
  Pressable,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { productService, reviewService } from '../services/api';
import { wishlistService } from '../services/wishlist';
import { deviceService } from '../services/device';
import { useTheme } from '../context/ThemeContext';

import OfflineBanner from '../components/OfflineBanner';
import ImageCarousel from '../components/ImageCarousel';
import Skeleton, { SkeletonRow } from '../components/Skeleton';
import ReviewSummaryCard from '../components/ReviewSummaryCard';
import { getRelativeTime } from '../utils/timeUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 320;
const HEADER_MIN_HEIGHT = 92;
const REVIEWS_PAGE_SIZE = 10;

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  console.log('🔍 [ProductDetail] Received productId:', productId);
  const { theme } = useTheme();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(0);
  const [reviewsHasMore, setReviewsHasMore] = useState(true);
  const [reviewsLoadingMore, setReviewsLoadingMore] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const imageListRef = useRef(null);

  const [reviewSummaryLoading, setReviewSummaryLoading] = useState(false);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [reviewSummarySource, setReviewSummarySource] = useState(null);
  const [reviewSummaryError, setReviewSummaryError] = useState(null);

  const latestReviewsRef = React.useRef([]);
  const latestReviewCountRef = React.useRef(0);
  const lastFetchedSummaryForReviewCountRef = React.useRef(null);

  useEffect(() => {
    latestReviewsRef.current = reviews || [];
  }, [reviews]);

  useEffect(() => {
    latestReviewCountRef.current = Number(product?.reviewCount || 0);
  }, [product?.reviewCount]);

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const previewListRef = useRef(null);

  const [isFavorite, setIsFavorite] = useState(false);
  const [deviceId, setDeviceId] = useState(null);

  const [editVisible, setEditVisible] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editReviewerName, setEditReviewerName] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const ratingPulse = useRef(new Animated.Value(1)).current;
  const fabScale = useRef(new Animated.Value(1)).current;

  const loadProductDetails = React.useCallback(async () => {
    try {
      setLoading(true);
      const productData = await productService.getById(productId);
      setProduct(productData);
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Error', 'Failed to load product details.');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const loadReviews = React.useCallback(async ({ page = 0, append = false } = {}) => {
    if (!productId) {
      console.error(' [ProductDetail] Error: productId is undefined, cannot load reviews.');
      setReviewsError('Invalid product selection.');
      setReviewsLoading(false);
      setReviewsLoadingMore(false);
      return;
    }
    try {
      setReviewsError(null);
      if (append) {
        setReviewsLoadingMore(true);
      } else {
        setReviewsLoading(true);
      }

      const response = await reviewService.getByProductId(productId, page, REVIEWS_PAGE_SIZE, 'helpfulCount', 'DESC');
      const newItems = response?.content || [];

      setReviews((prev) => {
        if (!append) return newItems;
        const merged = [...(prev || []), ...(newItems || [])];
        const seen = new Set();
        const deduped = [];
        for (const r of merged) {
          const id = r?.id;
          if (id === null || id === undefined) continue;
          if (seen.has(id)) continue;
          seen.add(id);
          deduped.push(r);
        }
        return deduped;
      });

      const hasLastFlag = typeof response?.last === 'boolean';
      const hasTotalPages = typeof response?.totalPages === 'number';
      const hasMoreFromLast = hasLastFlag ? !response.last : null;
      const hasMoreFromPages = hasTotalPages ? page < response.totalPages - 1 : null;
      const hasMoreFromPageSize = (newItems?.length || 0) >= REVIEWS_PAGE_SIZE;

      const hasMore =
        (hasMoreFromLast !== null ? hasMoreFromLast : null) ??
        (hasMoreFromPages !== null ? hasMoreFromPages : null) ??
        hasMoreFromPageSize;

      // If append returned no new unique items, stop showing load more.
      if (append && (newItems?.length || 0) === 0) {
        setReviewsHasMore(false);
      } else {
        setReviewsHasMore(Boolean(hasMore));
      }
      setReviewsPage(page);
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviewsError('Failed to load reviews.');
      if (!append) {
        setReviews([]);
      }
    } finally {
      setReviewsLoading(false);
      setReviewsLoadingMore(false);
    }
  }, [productId]);

  const handleToggleHelpful = React.useCallback(async (reviewId) => {
    if (!deviceId) {
      Alert.alert('Error', 'Device ID not ready yet. Please try again in a moment.');
      return;
    }

    try {
      const result = await reviewService.toggleHelpful(reviewId, deviceId);
      console.log(' [Helpful] toggle result:', result);

      // Always refresh first page so counts + ordering are correct.
      setReviewsPage(0);
      setReviewsHasMore(true);
      await loadReviews({ page: 0, append: false });
    } catch (e) {
      console.error(' [Helpful] toggle failed:', e);
      Alert.alert('Error', 'Could not update helpful vote. Please check your connection.');
    }
  }, [deviceId, loadReviews]);

  const buildLocalDeterministicSummary = React.useCallback((inputReviews) => {
    const usable = (inputReviews || []).filter((r) => (r?.comment || '').trim().length > 0);
    const count = usable.length;
    if (count === 0) {
      return {
        takeaway: 'No reviews yet.',
        pros: [],
        cons: [],
        topTopics: [],
      };
    }

    const avg = count > 0 ? usable.reduce((s, r) => s + (Number(r.rating) || 0), 0) / count : 0;
    const avgRounded = Math.round(avg * 10) / 10;

    const positives = usable
      .filter((r) => Number(r.rating) >= 4)
      .map((r) => (r.comment || '').trim())
      .filter(Boolean);
    const negatives = usable
      .filter((r) => Number(r.rating) <= 2)
      .map((r) => (r.comment || '').trim())
      .filter(Boolean);

    const pick = (arr, max) => {
      const out = [];
      for (const t of arr) {
        const single = t.split(/\.|\n|\r|!|\?/)[0].trim();
        if (!single) continue;
        if (out.includes(single)) continue;
        out.push(single.length > 90 ? `${single.slice(0, 90)}…` : single);
        if (out.length >= max) break;
      }
      return out;
    };

    const pros = pick(positives, 3);
    const cons = pick(negatives, 3);

    let takeaway = `Based on ${count} review${count === 1 ? '' : 's'}, average rating is ${avgRounded}/5.`;
    if (avgRounded >= 4.2) takeaway = `Most reviewers are very happy (avg ${avgRounded}/5 from ${count}).`;
    if (avgRounded <= 2.8) takeaway = `Many reviewers are dissatisfied (avg ${avgRounded}/5 from ${count}).`;

    return {
        takeaway,
        pros: positives.slice(0, 3).map(p => p.split(/\.|\n|\r|!|\?/)[0].trim().slice(0, 90)),
        cons: negatives.slice(0, 3).map(c => c.split(/\.|\n|\r|!|\?/)[0].trim().slice(0, 90)),
        topTopics: [],
      };
  }, []);

  const loadReviewSummary = React.useCallback(async () => {
    if (!productId) return;
    const localFallback = buildLocalDeterministicSummary(latestReviewsRef.current);

    const hasAnyReviews = (Number(latestReviewCountRef.current || 0) || latestReviewsRef.current.length) > 0;
    if (!hasAnyReviews) {
      setReviewSummary({ takeaway: '', pros: [], cons: [], topTopics: [] });
      setReviewSummarySource('none');
      setReviewSummaryError(null);
      setReviewSummaryLoading(false);
      lastFetchedSummaryForReviewCountRef.current = 0;
      return;
    }

    const currentCount = Number(latestReviewCountRef.current || 0);
    if (
      lastFetchedSummaryForReviewCountRef.current !== null &&
      currentCount > 0 &&
      lastFetchedSummaryForReviewCountRef.current === currentCount
    ) {
      return;
    }

    try {
      setReviewSummaryLoading(true);
      setReviewSummaryError(null);
      const resp = await productService.getReviewSummary(productId, 30);
      const s = resp?.summary;
      if (!s || typeof s.takeaway !== 'string') {
        throw new Error('Invalid summary');
      }
      setReviewSummary({
        takeaway: s.takeaway || '',
        pros: Array.isArray(s.pros) ? s.pros : [],
        cons: Array.isArray(s.cons) ? s.cons : [],
        topTopics: Array.isArray(s.topTopics) ? s.topTopics : [],
      });
      setReviewSummarySource(resp?.source || 'ai');
      lastFetchedSummaryForReviewCountRef.current = currentCount;
    } catch (e) {
      setReviewSummary(localFallback);
      setReviewSummarySource('local');
      setReviewSummaryError(null);
      lastFetchedSummaryForReviewCountRef.current = currentCount;
    } finally {
      setReviewSummaryLoading(false);
    }
  }, [productId]);

  const refreshAll = React.useCallback(async () => {
    try {
      setRefreshing(true);
      await loadProductDetails();
      await loadReviews({ page: 0, append: false });
    } finally {
      setRefreshing(false);
    }
  }, [loadProductDetails, loadReviews]);

  useEffect(() => {
    // Fetch AI summary only when reviewCount changes (e.g., new review added/deleted)
    // and we have some reviews.
    const cnt = Number(product?.reviewCount || 0);
    if (!productId) return;
    if (cnt <= 0) return;
    loadReviewSummary();
  }, [productId, product?.reviewCount, loadReviewSummary]);

  const loadDeviceId = React.useCallback(async () => {
    try {
      const id = await deviceService.getDeviceId();
      setDeviceId(id);
    } catch (e) {
      console.error('Error loading deviceId:', e);
    }
  }, []);

  const loadFavoriteState = React.useCallback(async () => {
    try {
      const fav = await wishlistService.isFavorite(productId);
      setIsFavorite(Boolean(fav));
    } catch (e) {
      console.error('Error loading favorite state:', e);
    }
  }, [productId]);

  const toggleFavorite = React.useCallback(async () => {
    try {
      const ids = await wishlistService.toggle(productId);
      setIsFavorite(ids.includes(Number(productId)));
    } catch (e) {
      console.error('Error toggling favorite:', e);
    }
  }, [productId]);

  // Load product details when screen mounts
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Reload product details when screen comes into focus (e.g., after adding a review)
  useFocusEffect(
    React.useCallback(() => {
      console.log(' [ProductDetail] useFocusEffect triggered, productId:', productId);
      refreshAll();
      loadFavoriteState();
      loadDeviceId();
    }, [refreshAll, loadFavoriteState, loadDeviceId, productId])
  );

  useEffect(() => {
    loadFavoriteState();
  }, [loadFavoriteState]);

  useEffect(() => {
    loadDeviceId();
  }, [loadDeviceId]);

  const openEdit = (review) => {
    setEditingReviewId(review.id);
    setEditReviewerName(review.reviewerName || '');
    setEditRating(Number(review.rating) || 5);
    setEditComment(review.comment || '');
    setEditVisible(true);
  };

  const closeEdit = () => {
    setEditVisible(false);
    setEditingReviewId(null);
  };

  const submitEdit = async () => {
    if (!editingReviewId) return;
    if (!deviceId) {
      Alert.alert('Error', 'Device ID is not ready yet. Please try again.');
      return;
    }

    const rawComment = editComment;
    const trimmedComment = rawComment.trim();
    if (rawComment.length > 0 && trimmedComment.length === 0) {
      Alert.alert('Validation Error', 'Comment must be at least 10 characters long.');
      return;
    }
    if (trimmedComment.length > 0 && trimmedComment.length < 10) {
      Alert.alert('Validation Error', 'Comment must be at least 10 characters long.');
      return;
    }

    try {
      setEditSubmitting(true);
      await reviewService.update(editingReviewId, {
        comment: rawComment,
        rating: editRating,
        reviewerName: editReviewerName.trim() || undefined,
        deviceId,
      });
      closeEdit();
      await refreshAll();
    } catch (e) {
      console.error('Error updating review:', e);
      const status = e?.response?.status;
      if (status === 403) {
        Alert.alert('Not allowed', 'You can only edit your own review.');
      } else {
        Alert.alert('Error', 'Failed to update review.');
      }
    } finally {
      setEditSubmitting(false);
    }
  };

  const confirmDelete = (reviewId) => {
    if (!deviceId) {
      Alert.alert('Error', 'Device ID is not ready yet. Please try again.');
      return;
    }
    Alert.alert('Delete review?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await reviewService.delete(reviewId, deviceId);
            await refreshAll();
          } catch (e) {
            console.error('Error deleting review:', e);
            const status = e?.response?.status;
            if (status === 403) {
              Alert.alert('Not allowed', 'You can only delete your own review.');
            } else {
              Alert.alert('Error', 'Failed to delete review.');
            }
          }
        },
      },
    ]);
  };

  useEffect(() => {
    if (!product) return;
    Animated.sequence([
      Animated.timing(ratingPulse, { toValue: 1.06, duration: 140, useNativeDriver: true }),
      Animated.timing(ratingPulse, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
  }, [product?.averageRating, ratingPulse]);

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      const shouldShrink = value > 140;
      Animated.timing(fabScale, {
        toValue: shouldShrink ? 0.88 : 1,
        duration: 160,
        useNativeDriver: true,
      }).start();
    });

    return () => scrollY.removeListener(id);
  }, [fabScale, scrollY]);

  const handleAddReview = () => {
    navigation.navigate('AddReview', { 
      productId: productId
    });
  };

  const openPreview = (index) => {
    setPreviewIndex(index);
    setPreviewVisible(true);
    requestAnimationFrame(() => {
      previewListRef.current?.scrollToIndex({ index, animated: false });
    });
  };

  const closePreview = () => {
    setPreviewVisible(false);
  };

  const renderImage = ({ item, index }) => (
    <Pressable onPress={() => openPreview(index)}>
      <Image
        source={{ uri: item }}
        style={styles.productImage}
        resizeMode="cover"
      />
    </Pressable>
  );

  const renderImageThumbnail = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.thumbnail,
        selectedImageIndex === index && styles.thumbnailActive
      ]}
      onPress={() => {
        setSelectedImageIndex(index);
        imageListRef.current?.scrollToIndex({ index, animated: true });
      }}
    >
      <Image
        source={{ uri: item }}
        style={styles.thumbnailImage}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  const renderReview = ({ item }) => {
    const isOwn = deviceId && item?.deviceId && item.deviceId === deviceId;
    return (
    <View
      style={[
        styles.reviewCard,
        {
          backgroundColor: theme.colors.surfaceAlt,
          shadowColor: theme.colors.shadow,
        },
      ]}
    >
      <View style={styles.reviewHeader}>
        <View style={styles.reviewIdentity}>
          <View style={[styles.avatar, { backgroundColor: theme.isDark ? '#1f2a3a' : '#ece7ff' }]}> 
            <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
              {((item.reviewerName || 'Anonymous').trim()[0] || 'A').toUpperCase()}
            </Text>
          </View>
          <View style={styles.nameMeta}>
            <Text style={[styles.reviewerName, { color: theme.colors.text }]}>{item.reviewerName || 'Anonymous'}</Text>
            {item.createdAt && (
              <Text style={[styles.reviewDate, { color: theme.colors.textSecondary }]}>
                {getRelativeTime(item.createdAt)}
              </Text>
            )}
          </View>
        </View>
        <View style={[styles.ratingBadge, { backgroundColor: theme.colors.primary }]}> 
          <Text style={styles.ratingBadgeText}>⭐ {item.rating}/5</Text>
        </View>
      </View>
      {isOwn && (
        <View style={styles.reviewActionsRow}>
          <TouchableOpacity
            style={[styles.reviewActionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => openEdit(item)}
            activeOpacity={0.85}
            hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}
          >
            <Ionicons name="create-outline" size={16} color={theme.colors.text} />
            <Text style={[styles.reviewActionText, { color: theme.colors.text }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reviewActionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, marginLeft: 10 }]}
            onPress={() => confirmDelete(item.id)}
            activeOpacity={0.85}
            hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}
          >
            <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
            <Text style={[styles.reviewActionText, { color: theme.colors.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
      {!!item.comment?.trim() && (
        <Text style={[styles.reviewComment, { color: theme.colors.textSecondary }]}>{item.comment}</Text>
      )}

      <View style={styles.helpfulRow}>
        <TouchableOpacity
          style={[styles.helpfulButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          onPress={() => handleToggleHelpful(item.id)}
          activeOpacity={0.85}
          hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}
        >
          <Ionicons name="thumbs-up-outline" size={16} color={theme.colors.text} />
          <Text style={[styles.helpfulText, { color: theme.colors.text }]}>Helpful</Text>
        </TouchableOpacity>
        <Text style={[styles.helpfulCount, { color: theme.colors.textSecondary }]}>
          {Number(item?.helpfulCount || 0)}
        </Text>
      </View>
    </View>
    );
  };

  const images = product?.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls 
    : [];

  const headerMaxHeight = HEADER_MAX_HEIGHT; // Simplified - no dynamic height based on image count

  const headerHeight = scrollY.interpolate({
    inputRange: [0, headerMaxHeight - HEADER_MIN_HEIGHT],
    outputRange: [headerMaxHeight, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80, 160],
    outputRange: [1, 0.65, 0.15],
    extrapolate: 'clamp',
  });

  const stickyOpacity = scrollY.interpolate({
    inputRange: [80, 150, 220],
    outputRange: [0, 0.55, 1],
    extrapolate: 'clamp',
  });

  const ratingBuckets = useMemo(() => {
    const buckets = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of reviews) {
      const k = Math.max(1, Math.min(5, Number(r.rating) || 0));
      buckets[k] += 1;
    }
    return buckets;
  }, [reviews]);

  const totalCount = Number(product?.reviewCount || 0);
  const displayTotalForBars = totalCount > 0 ? totalCount : Math.max(1, reviews.length);

  if (!product && !loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.danger }]}>Product not found</Text>
      </View>
    );
  }

  const renderPreviewImage = ({ item }) => (
    <View style={styles.previewSlide}>
      <Image source={{ uri: item }} style={styles.previewImage} resizeMode="contain" />
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      <OfflineBanner theme={theme} />

      <TouchableOpacity
        style={[styles.favoriteButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        onPress={toggleFavorite}
        hitSlop={{ top: 12, left: 12, right: 12, bottom: 12 }}
      >
        <Ionicons
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={22}
          color={isFavorite ? theme.colors.danger : theme.colors.textSecondary}
        />
      </TouchableOpacity>

      <Animated.View style={[styles.stickyHeader, { opacity: stickyOpacity, backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
        <Text style={[styles.stickyTitle, { color: theme.colors.text }]} numberOfLines={1}>
          {loading ? ' ' : product?.name}
        </Text>
        <View style={styles.stickyMetaRow}>
          <Text style={[styles.stickyMeta, { color: theme.colors.textSecondary }]}>
            ⭐ {Number(product?.averageRating || 0).toFixed(1)}
          </Text>
          <Text style={[styles.stickyMeta, { color: theme.colors.textSecondary, marginLeft: 10 }]}>
            {totalCount} reviews
          </Text>
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 120 }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshAll} tintColor={theme.colors.primary} />
        }
      >
        <Animated.View style={[styles.headerContainer, { height: headerHeight, backgroundColor: theme.colors.surface }]}> 
          {loading ? (
            <View style={styles.headerSkeleton}>
              <Skeleton height={headerMaxHeight} radius={0} baseColor={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} highlightColor={theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'} />
            </View>
          ) : (
            <Animated.View style={{ opacity: headerOpacity }}>
              <ImageCarousel 
                images={product?.imageUrls || []} 
                loading={loading} 
              />
            </Animated.View>
          )}
        </Animated.View>

        <View style={[styles.productSection, { backgroundColor: theme.colors.surface }]}> 
          {loading ? (
            <View>
              <Skeleton height={22} width={'72%'} radius={10} baseColor={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} highlightColor={theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'} />
              <View style={{ height: 10 }} />
              <Skeleton height={14} width={'40%'} radius={10} baseColor={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} highlightColor={theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'} />
              <View style={{ height: 18 }} />
              <Skeleton height={28} width={'30%'} radius={10} baseColor={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} highlightColor={theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'} />
            </View>
          ) : (
            <>
              <Text style={[styles.productName, { color: theme.colors.text }]}>{product?.name}</Text>
              <Text style={[styles.productCategory, { color: theme.colors.textSecondary }]}>{product?.category}</Text>
              <View style={styles.priceContainer}>
                <Text style={[styles.productPrice, { color: theme.colors.primary }]}>
                  ${Number(product?.price || 0).toFixed(2)}
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={[styles.ratingSummaryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
          {loading ? (
            <View>
              <SkeletonRow>
                <Skeleton height={38} width={64} radius={12} baseColor={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} highlightColor={theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'} />
                <View style={{ width: 14 }} />
                <View style={{ flex: 1 }}>
                  <Skeleton height={14} width={'60%'} radius={10} baseColor={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} highlightColor={theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'} />
                  <View style={{ height: 10 }} />
                  <Skeleton height={12} width={'45%'} radius={10} baseColor={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} highlightColor={theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'} />
                </View>
              </SkeletonRow>
              <View style={{ height: 16 }} />
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={{ marginBottom: 10 }}>
                  <Skeleton height={10} width={'100%'} radius={10} baseColor={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} highlightColor={theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'} />
                </View>
              ))}
            </View>
          ) : (
            <>
              <View style={styles.ratingTopRow}>
                <Animated.Text
                  style={[
                    styles.bigRating,
                    { color: theme.colors.text, transform: [{ scale: ratingPulse }] },
                  ]}
                >
                  {Number(product?.averageRating || 0).toFixed(1)}
                </Animated.Text>
                <View style={styles.ratingMetaCol}>
                  <Text style={[styles.ratingMetaText, { color: theme.colors.textSecondary }]}>
                    Average rating
                  </Text>
                  <Text style={[styles.ratingMetaText, { color: theme.colors.textSecondary, marginTop: 4 }]}>
                    {totalCount} {totalCount === 1 ? 'review' : 'reviews'}
                  </Text>
                </View>
              </View>

              <View style={styles.distribution}>
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = ratingBuckets[stars] || 0;
                  const ratio = Math.max(0, Math.min(1, count / displayTotalForBars));
                  return (
                    <View key={stars} style={styles.distRow}>
                      <Text style={[styles.distLabel, { color: theme.colors.textSecondary }]}>{stars}★</Text>
                      <View style={[styles.distTrack, { backgroundColor: theme.colors.barTrack }]}> 
                        <View style={[styles.distFill, { width: `${Math.round(ratio * 100)}%`, backgroundColor: theme.colors.barFill }]} />
                      </View>
                      <Text style={[styles.distCount, { color: theme.colors.textSecondary }]}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </View>

        <ReviewSummaryCard
          loading={reviewSummaryLoading}
          summary={reviewSummary}
          empty={(Number(product?.reviewCount || 0) || reviews.length) === 0}
        />

        <View style={[styles.productSection, { backgroundColor: theme.colors.surface }]}> 
          {loading ? (
            <View>
              <Skeleton height={16} width={'30%'} radius={10} baseColor={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} highlightColor={theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'} />
              <View style={{ height: 12 }} />
              <Skeleton height={12} width={'100%'} radius={10} baseColor={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} highlightColor={theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'} />
              <View style={{ height: 10 }} />
              <Skeleton height={12} width={'92%'} radius={10} baseColor={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} highlightColor={theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'} />
              <View style={{ height: 10 }} />
              <Skeleton height={12} width={'86%'} radius={10} baseColor={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} highlightColor={theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'} />
            </View>
          ) : (
            <>
              <Text style={[styles.descriptionTitle, { color: theme.colors.text }]}>Description</Text>
              <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{product?.description}</Text>
            </>
          )}
        </View>

        <View style={[styles.reviewsSection, { backgroundColor: theme.colors.surface }]}> 
          <Text style={[styles.reviewsTitle, { color: theme.colors.text }]}>
            Reviews ({product?.reviewCount || reviews.length})
          </Text>

          {reviewsLoading && (
            <View>
              {[0, 1, 2].map((i) => (
                <View key={i} style={[styles.reviewCard, { backgroundColor: theme.colors.surfaceAlt, shadowColor: theme.colors.shadow }]}> 
                  <SkeletonRow>
                    <Skeleton width={42} height={42} radius={21} baseColor={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} highlightColor={theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Skeleton height={12} width={'40%'} radius={10} baseColor={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} highlightColor={theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'} />
                      <View style={{ height: 10 }} />
                      <Skeleton height={10} width={'24%'} radius={10} baseColor={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} highlightColor={theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'} />
                    </View>
                    <Skeleton height={22} width={64} radius={8} baseColor={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} highlightColor={theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'} />
                  </SkeletonRow>
                  <View style={{ height: 12 }} />
                  <Skeleton height={10} width={'100%'} radius={10} baseColor={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} highlightColor={theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'} />
                  <View style={{ height: 8 }} />
                  <Skeleton height={10} width={'92%'} radius={10} baseColor={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} highlightColor={theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'} />
                </View>
              ))}
            </View>
          )}

          {!reviewsLoading && reviewsError && (
            <View style={styles.errorInlineContainer}>
              <Text style={[styles.errorText, { color: theme.colors.danger }]}>{reviewsError}</Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => loadReviews({ page: 0, append: false })}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {!reviewsLoading && !reviewsError && reviews.length === 0 && (
            <View style={styles.noReviewsContainer}>
              <Text style={[styles.noReviewsText, { color: theme.colors.textSecondary }]}>No reviews yet. Be the first to review!</Text>
            </View>
          )}

          {!reviewsLoading && !reviewsError && reviews.length > 0 && (
            <>
              <FlatList
                data={reviews}
                renderItem={renderReview}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
              {reviewsHasMore && (
                <TouchableOpacity
                  style={[styles.loadMoreButton, reviewsLoadingMore && styles.loadMoreButtonDisabled, { backgroundColor: reviewsLoadingMore ? '#999' : theme.colors.primary }]}
                  onPress={() => loadReviews({ page: reviewsPage + 1, append: true })}
                  disabled={reviewsLoadingMore}
                >
                  {reviewsLoadingMore ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.loadMoreButtonText}>Load more</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </Animated.ScrollView>

      <Modal visible={editVisible} animationType="slide" transparent onRequestClose={closeEdit}>
        <KeyboardAvoidingView
          style={styles.editOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={styles.editOverlayTap} onPress={Keyboard.dismiss}>
            <View />
          </Pressable>
          <View style={[styles.editCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.editContent}
            >
              <View style={styles.editHeader}>
                <Text style={[styles.editTitle, { color: theme.colors.text }]}>Edit your review</Text>
                <TouchableOpacity onPress={closeEdit}>
                  <Text style={[styles.editClose, { color: theme.colors.text }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.editLabel, { color: theme.colors.text }]}>Your Name (Optional)</Text>
              <TextInput
                style={[styles.editInput, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceAlt }]}
                value={editReviewerName}
                onChangeText={setEditReviewerName}
                placeholder="Enter your name"
                placeholderTextColor={theme.colors.textSecondary}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />

              <Text style={[styles.editLabel, { color: theme.colors.text }]}>Rating</Text>
              <View style={styles.editStarsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity key={s} onPress={() => setEditRating(s)} style={styles.editStarButton}>
                    <Text style={[styles.editStar, { color: theme.colors.text }]}>{s <= editRating ? '⭐' : '☆'}</Text>
                  </TouchableOpacity>
                ))}
                <Text style={[styles.editRatingText, { color: theme.colors.text }]}>{editRating} / 5</Text>
              </View>

              <Text style={[styles.editLabel, { color: theme.colors.text }]}>Review Comment (Optional)</Text>
              <TextInput
                style={[styles.editInput, styles.editTextArea, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceAlt }]}
                value={editComment}
                onChangeText={setEditComment}
                placeholder="Write your review (optional)"
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                blurOnSubmit
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />

              <TouchableOpacity
                style={[styles.editSubmit, { backgroundColor: theme.colors.primary }, editSubmitting && styles.editSubmitDisabled]}
                onPress={submitEdit}
                disabled={editSubmitting}
              >
                {editSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.editSubmitText}>Save changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Animated.View style={[styles.fabContainer, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleAddReview}
          style={[styles.fab, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.shadow }]}
        >
          <Text style={styles.fabText}>＋</Text>
        </TouchableOpacity>
      </Animated.View>

      <Modal visible={previewVisible} animationType="fade" onRequestClose={closePreview} transparent>
        <View style={[styles.previewOverlay, { backgroundColor: theme.colors.overlay }]}> 
          <View style={styles.previewTopBar}>
            <TouchableOpacity onPress={closePreview} style={styles.previewClose}>
              <Text style={styles.previewCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.previewCounter}>
              {previewIndex + 1} / {images.length}
            </Text>
            <View style={{ width: 44 }} />
          </View>
          <FlatList
            ref={previewListRef}
            data={images}
            renderItem={renderPreviewImage}
            keyExtractor={(item, index) => `preview-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={previewIndex}
            getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setPreviewIndex(index);
              setSelectedImageIndex(index);
            }}
            onScrollToIndexFailed={(info) => {
              const wait = new Promise(resolve => setTimeout(resolve, 250));
              wait.then(() => {
                previewListRef.current?.scrollToIndex({ index: info.index, animated: false });
              });
            }}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
  },
  centerInlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingTextInline: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  errorInlineContainer: {
    paddingVertical: 16,
  },
  retryButton: {
    marginTop: 10,
    backgroundColor: '#6200ee',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  productSection: {
    padding: 20,
    marginBottom: 12,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  productCategory: {
    fontSize: 16,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  priceContainer: {
    marginBottom: 16,
  },
  productPrice: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  ratingSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  reviewCountText: {
    fontSize: 14,
    color: '#666',
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  reviewsSection: {
    padding: 20,
  },
  reviewsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  reviewCard: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 4,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  reviewActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  reviewActionText: {
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
  },
  reviewIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nameMeta: {
    marginLeft: 12,
    flex: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  ratingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ratingBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  reviewComment: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 8,
  },
  helpfulRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  helpfulText: {
    fontSize: 13,
    fontWeight: '800',
  },
  helpfulCount: {
    fontSize: 13,
    fontWeight: '800',
  },
  reviewDate: {
    fontSize: 12,
  },
  noReviewsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noReviewsText: {
    fontSize: 16,
    textAlign: 'center',
  },
  loadMoreButton: {
    backgroundColor: '#6200ee',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  loadMoreButtonDisabled: {
    backgroundColor: '#999',
  },
  loadMoreButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Image Gallery Styles
  imageGallery: {
    marginBottom: 12,
  },
  mainImageWrapper: {
    position: 'relative',
    height: 300,
  },
  mainImageContainer: {
    height: 300,
  },
  productImage: {
    width: SCREEN_WIDTH,
    height: 300,
    backgroundColor: '#e0e0e0',
  },
  imageIndicator: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  thumbnailContainer: {
    padding: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    marginRight: 8,
  },
  thumbnailActive: {
    borderColor: '#6200ee',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  headerContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  headerSkeleton: {
    width: '100%',
  },
  noImageContainer: {
    height: HEADER_MAX_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  ratingSummaryCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  ratingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  bigRating: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  ratingMetaCol: {
    marginLeft: 14,
    flex: 1,
  },
  ratingMetaText: {
    fontSize: 13,
    fontWeight: '700',
  },
  distribution: {
    marginTop: 6,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  distLabel: {
    width: 34,
    fontSize: 12,
    fontWeight: '700',
  },
  distTrack: {
    flex: 1,
    height: 10,
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: 10,
  },
  distFill: {
    height: 10,
    borderRadius: 8,
  },
  distCount: {
    width: 28,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  favoriteButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 60,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 4,
  },
  stickyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  stickyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  stickyMeta: {
    fontSize: 13,
    fontWeight: '700',
  },
  fabContainer: {
    position: 'absolute',
    right: 18,
    bottom: 24,
    zIndex: 40,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
    marginTop: -2,
  },
  previewOverlay: {
    flex: 1,
  },
  previewTopBar: {
    marginTop: 44,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewClose: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCloseText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  previewCounter: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  previewSlide: {
    width: SCREEN_WIDTH,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: SCREEN_WIDTH,
    height: '78%',
  },
  editOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  editOverlayTap: {
    flex: 1,
  },
  editCard: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  editContent: {
    paddingBottom: 12,
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  editTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  editClose: {
    fontSize: 18,
    fontWeight: '900',
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 8,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
  },
  editTextArea: {
    minHeight: 120,
  },
  editStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editStarButton: {
    paddingVertical: 8,
    paddingRight: 2,
  },
  editStar: {
    fontSize: 26,
  },
  editRatingText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '800',
  },
  editSubmit: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  editSubmitDisabled: {
    backgroundColor: '#999',
  },
  editSubmitText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
});

export default ProductDetailScreen;
