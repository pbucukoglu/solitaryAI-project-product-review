import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const CategoryChip = ({ label, style, variant = 'default' }) => {
  const { theme, scaleFont } = useTheme();

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
        {label}
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
