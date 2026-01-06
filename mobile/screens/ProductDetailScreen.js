import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  FlatList,
  Image,
  Dimensions,
  RefreshControl,
  Modal,
  Pressable,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { productService, reviewService } from '../services/api';
import { wishlistService } from '../services/wishlist';

import OfflineBanner from '../components/OfflineBanner';
import Skeleton, { SkeletonRow } from '../components/Skeleton';
import { createTheme } from '../components/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 320;
const HEADER_MIN_HEIGHT = 92;

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const colorScheme = useColorScheme();
  const theme = useMemo(() => createTheme(colorScheme), [colorScheme]);

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

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const previewListRef = useRef(null);

  const [isFavorite, setIsFavorite] = useState(false);

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
    try {
      setReviewsError(null);
      if (append) {
        setReviewsLoadingMore(true);
      } else {
        setReviewsLoading(true);
      }

      const response = await reviewService.getByProductId(productId, page, 10, 'createdAt', 'DESC');
      const newItems = response?.content || [];

      setReviews(prev => (append ? [...prev, ...newItems] : newItems));
      setReviewsHasMore(!response?.last);
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

  const refreshAll = React.useCallback(async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        loadProductDetails(),
        loadReviews({ page: 0, append: false })
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [loadProductDetails, loadReviews]);

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
      refreshAll();
      loadFavoriteState();
    }, [refreshAll, loadFavoriteState])
  );

  useEffect(() => {
    loadFavoriteState();
  }, [loadFavoriteState]);

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

  const renderReview = ({ item }) => (
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
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
        <View style={[styles.ratingBadge, { backgroundColor: theme.colors.primary }]}> 
          <Text style={styles.ratingBadgeText}>⭐ {item.rating}/5</Text>
        </View>
      </View>
      <Text style={[styles.reviewComment, { color: theme.colors.textSecondary }]}>{item.comment}</Text>
    </View>
  );

  const images = product?.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls 
    : [];

  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
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
              <Skeleton height={HEADER_MAX_HEIGHT} radius={0} baseColor={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} highlightColor={theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'} />
            </View>
          ) : (
            <Animated.View style={{ opacity: headerOpacity }}>
              {images.length > 0 ? (
                <View style={styles.imageGallery}>
                  <View style={styles.mainImageWrapper}>
                    <FlatList
                      ref={imageListRef}
                      data={images}
                      renderItem={renderImage}
                      keyExtractor={(item, index) => index.toString()}
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      onMomentumScrollEnd={(event) => {
                        const index = Math.round(
                          event.nativeEvent.contentOffset.x / SCREEN_WIDTH
                        );
                        setSelectedImageIndex(index);
                      }}
                      onScrollToIndexFailed={(info) => {
                        const wait = new Promise(resolve => setTimeout(resolve, 400));
                        wait.then(() => {
                          imageListRef.current?.scrollToIndex({ index: info.index, animated: false });
                        });
                      }}
                      style={styles.mainImageContainer}
                    />
                    {images.length > 1 && (
                      <View style={styles.imageIndicator}>
                        <Text style={styles.imageIndicatorText}>
                          {selectedImageIndex + 1} / {images.length}
                        </Text>
                      </View>
                    )}
                  </View>
                  {images.length > 1 && (
                    <FlatList
                      data={images}
                      renderItem={renderImageThumbnail}
                      keyExtractor={(item, index) => `thumb-${index}`}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.thumbnailContainer}
                    />
                  )}
                </View>
              ) : (
                <View style={[styles.noImageContainer, { backgroundColor: theme.colors.surfaceAlt }]}> 
                  <Text style={[styles.noImageText, { color: theme.colors.textSecondary }]}>No images</Text>
                </View>
              )}
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
    right: 16,
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
});

export default ProductDetailScreen;


