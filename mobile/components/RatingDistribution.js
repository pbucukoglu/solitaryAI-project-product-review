import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

const RatingDistribution = ({ reviews, theme }) => {
  const { t } = useTranslation();

  // Calculate rating buckets
  const ratingBuckets = React.useMemo(() => {
    const buckets = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of reviews || []) {
      const k = Math.max(1, Math.min(5, Number(r.rating) || 0));
      buckets[k] += 1;
    }
    return buckets;
  }, [reviews]);

  const totalCount = reviews?.length || 0;
  const displayTotalForBars = totalCount > 0 ? totalCount : 1;

  if (!reviews || reviews.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{t('review.ratingDistribution')}</Text>
        <Text style={[styles.noReviewsText, { color: theme.colors.textSecondary }]}>
          {t('product.noReviews')}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>{t('review.ratingDistribution')}</Text>
      
      <View style={styles.distribution}>
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = ratingBuckets[stars] || 0;
          const ratio = Math.max(0, Math.min(1, count / displayTotalForBars));
          const percentage = Math.round((count / totalCount) * 100);
          
          return (
            <View key={stars} style={styles.distRow}>
              <Text style={[styles.distLabel, { color: theme.colors.textSecondary }]}>{stars}★</Text>
              <View style={[styles.distTrack, { backgroundColor: theme.colors.barTrack }]}>
                <View 
                  style={[
                    styles.distFill, 
                    { 
                      width: `${Math.round(ratio * 100)}%`, 
                      backgroundColor: theme.colors.barFill 
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.distCount, { color: theme.colors.textSecondary }]}>
                {count} ({percentage}%)
              </Text>
            </View>
          );
        })}
      </View>
      
      <View style={styles.summary}>
        <Text style={[styles.summaryText, { color: theme.colors.textSecondary }]}>
          {t('review.totalReviews', { count: totalCount })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  noReviewsText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  distribution: {
    gap: 8,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  distLabel: {
    fontSize: 14,
    fontWeight: '500',
    width: 30,
    textAlign: 'right',
  },
  distTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  distFill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 2,
  },
  distCount: {
    fontSize: 12,
    fontWeight: '500',
    width: 60,
    textAlign: 'right',
  },
  summary: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  summaryText: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default RatingDistribution;
