import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const CategoryChip = ({ label, style, variant = 'default' }) => {
  const { theme, scaleFont } = useTheme();
  const { t } = useTranslation();

  const localizedLabel = useMemo(() => {
    const raw = (label || '').trim();
    const norm = raw.toLowerCase();

    if (!raw) return raw;

    if (norm === 'electronics') return t('category.electronics');
    if (norm === 'clothing') return t('category.clothing');
    if (norm === 'books') return t('category.books');
    if (norm === 'home & kitchen' || norm === 'home and kitchen' || norm === 'homekitchen') return t('category.homeKitchen');
    if (norm === 'sports & outdoors' || norm === 'sports and outdoors' || norm === 'sportsoutdoors') return t('category.sportsOutdoors');

    return raw;
  }, [label, t]);

  return (
    <View
      style={[
        styles.container,
        variant === 'overlay'
          ? styles.overlayContainer
          : {
              backgroundColor: theme.colors.surfaceAlt,
              borderColor: theme.colors.border,
            },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: variant === 'overlay' ? '#fff' : theme.colors.textSecondary,
            fontSize: scaleFont(11),
          },
        ]}
        numberOfLines={1}
      >
        {localizedLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  overlayContainer: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 0,
  },
  text: {
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});

export default CategoryChip;
