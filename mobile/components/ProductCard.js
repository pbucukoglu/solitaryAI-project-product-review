import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import CategoryChip from './CategoryChip';
import RatingPill from './RatingPill';

const IMAGE_ASPECT_RATIO = 4 / 3;

const ProductCard = ({
  item,
  isFavorite,
  onPress,
  onToggleFavorite,
  entranceIndex = 0,
  entranceProgress,
  style,
}) => {
  const { theme, scaleFont } = useTheme();

  const firstImage = useMemo(() => {
    return item?.imageUrls && item.imageUrls.length > 0 ? item.imageUrls[0] : null;
  }, [item]);

  const favScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(favScale, {
      toValue: isFavorite ? 1.04 : 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 6,
    }).start();
  }, [isFavorite, favScale]);

  const playHaptic = useCallback(async () => {
    try {
      const mod = await import('expo-haptics');
      await mod.impactAsync(mod.ImpactFeedbackStyle.Light);
    } catch (e) {
      // ignore
    }
  }, []);

  const handleFavoritePress = useCallback(async () => {
    Animated.sequence([
      Animated.spring(favScale, { toValue: 0.92, useNativeDriver: true, speed: 30, bounciness: 0 }),
      Animated.spring(favScale, { toValue: 1.06, useNativeDriver: true, speed: 30, bounciness: 8 }),
      Animated.spring(favScale, { toValue: 1, useNativeDriver: true, speed: 26, bounciness: 6 }),
    ]).start();

    playHaptic();
    onToggleFavorite?.();
  }, [favScale, onToggleFavorite, playHaptic]);

  const entranceStyle = useMemo(() => {
    if (!entranceProgress) return null;
    const delay = Math.min(10, entranceIndex) * 0.06;
    const start = delay;
    const end = delay + 0.6;

    const opacity = entranceProgress.interpolate({
      inputRange: [start, end],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
    const translateY = entranceProgress.interpolate({
      inputRange: [start, end],
      outputRange: [10, 0],
      extrapolate: 'clamp',
    });

    return {
      opacity,
      transform: [{ translateY }],
    };
  }, [entranceProgress, entranceIndex]);

  return (
    <Animated.View style={[entranceStyle, style]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            shadowColor: theme.colors.shadow,
            opacity: pressed ? 0.96 : 1,
          },
        ]}
      >
        <View style={styles.imageWrap}>
          <View style={[styles.imageRatio, { backgroundColor: theme.colors.surfaceAlt }]}>
            {firstImage ? (
              <Image source={{ uri: firstImage }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={[styles.image, { backgroundColor: theme.colors.surfaceAlt }]} />
            )}
          </View>

          <View style={styles.imageOverlayRow}>
            {!!item?.category && (
              <CategoryChip label={item.category} variant="overlay" style={styles.overlayChip} />
            )}
            {!!item?.reviewCount && item.reviewCount > 0 && (
              <RatingPill rating={item.averageRating} count={item.reviewCount} variant="overlay" style={styles.overlayChip} />
            )}
          </View>

          <Animated.View style={[styles.favoriteFab, { transform: [{ scale: favScale }] }]}>
            <Pressable
              onPress={handleFavoritePress}
              hitSlop={12}
              style={({ pressed }) => [
                styles.favoriteFabInner,
                {
                  backgroundColor: theme.isDark ? 'rgba(18,26,39,0.86)' : 'rgba(255,255,255,0.92)',
                  borderColor: theme.colors.border,
                  shadowColor: theme.colors.shadow,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                },
              ]}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={18}
                color={isFavorite ? theme.colors.danger : theme.colors.textSecondary}
              />
            </Pressable>
          </Animated.View>
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.colors.text, fontSize: scaleFont(16) }]} numberOfLines={2}>
            {item?.name}
          </Text>

          <View style={styles.bottomRow}>
            <Text style={[styles.price, { color: theme.colors.text, fontSize: scaleFont(18) }]}>
              ${Number(item?.price || 0).toFixed(2)}
            </Text>
            {(!item?.reviewCount || item.reviewCount === 0) && (
              <Text style={[styles.noRating, { color: theme.colors.textSecondary, fontSize: scaleFont(12) }]}>
                No reviews yet
              </Text>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 6,
  },
  imageWrap: {
    position: 'relative',
  },
  imageOverlayRow: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  overlayChip: {
    maxWidth: '62%',
  },
  imageRatio: {
    width: '100%',
    aspectRatio: IMAGE_ASPECT_RATIO,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteFab: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  favoriteFabInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 6,
  },
  content: {
    padding: 14,
  },
  title: {
    marginTop: 2,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  price: {
    fontWeight: '900',
  },
  noRating: {
    fontWeight: '700',
  },
});

export default ProductCard;
