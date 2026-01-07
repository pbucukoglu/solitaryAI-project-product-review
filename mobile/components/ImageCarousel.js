import React, { useState, useRef } from 'react';
import { View, Image, StyleSheet, Dimensions, ActivityIndicator, Text, ScrollView } from 'react-native';
import Skeleton from './Skeleton';

const { width: screenWidth } = Dimensions.get('window');

const ImageCarousel = ({ images, loading = false }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef(null);

  if (loading) {
    return (
      <View style={styles.container}>
        <Skeleton height={250} radius={0} />
      </View>
    );
  }

  if (!images || images.length === 0) {
    return (
      <View style={[styles.container, styles.placeholderContainer]}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No Images Available</Text>
        </View>
      </View>
    );
  }

  const handleScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const index = Math.round(contentOffset.x / screenWidth);
    setActiveIndex(index);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {images.map((imageUrl, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="cover"
              onError={() => console.log(`Failed to load image: ${imageUrl}`)}
            />
          </View>
        ))}
      </ScrollView>

      {images.length > 1 && (
        <View style={styles.pagination}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                activeIndex === index ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>
      )}

      {images.length > 1 && (
        <View style={styles.imageCounter}>
          <Text style={styles.counterText}>{`${activeIndex + 1} / ${images.length}`}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 250,
    width: '100%',
    backgroundColor: '#f5f5f5',
  },
  imageContainer: {
    width: screenWidth,
    height: 250,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  pagination: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#fff',
    opacity: 0.9,
  },
  inactiveDot: {
    backgroundColor: '#fff',
    opacity: 0.4,
  },
  imageCounter: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  counterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ImageCarousel;
