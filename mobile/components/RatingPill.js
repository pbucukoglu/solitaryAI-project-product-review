import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const RatingPill = ({ rating, count, style, variant = 'default' }) => {
  const { theme, scaleFont } = useTheme();

  const label = useMemo(() => {
    const r = Number(rating) || 0;
    const c = Number(count) || 0;
    if (c > 0) return `⭐ ${r.toFixed(1)} (${c})`;
    return `⭐ ${r.toFixed(1)}`;
  }, [rating, count]);

  return (
    <View
      style={[
        styles.container,
        variant === 'overlay'
          ? styles.overlayContainer
          : {
              backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              borderColor: theme.colors.border,
            },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: variant === 'overlay' ? '#fff' : theme.colors.text,
            fontSize: scaleFont(12),
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  overlayContainer: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 0,
  },
  text: {
    fontWeight: '800',
  },
});

export default RatingPill;
