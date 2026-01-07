import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';

const DemoBanner = ({ onTryAgain }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.warning }]}>
      <Text style={[styles.text, { color: theme.colors.surface }]}>
        Demo mode — showing sample data (offline)
      </Text>
      <TouchableOpacity onPress={onTryAgain} style={styles.tryAgainButton}>
        <Text style={[styles.tryAgainText, { color: theme.colors.surface }]}>
          Try again
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  tryAgainButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tryAgainText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default DemoBanner;
