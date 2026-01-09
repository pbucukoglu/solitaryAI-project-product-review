import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Skeleton from './Skeleton';

const ReviewSummaryCard = ({
  loading,
  summary,
  empty,
}) => {
  const { theme } = useTheme();
  const title = 'Review Summary';

  if (loading) {
    return (
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        </View>
        <Skeleton height={12} width={'92%'} radius={10} baseColor={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} highlightColor={theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'} />
        <View style={{ height: 10 }} />
        <Skeleton height={12} width={'84%'} radius={10} baseColor={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} highlightColor={theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'} />
        <View style={{ height: 16 }} />
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ marginBottom: 10 }}>
            <Skeleton height={10} width={'96%'} radius={10} baseColor={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} highlightColor={theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'} />
          </View>
        ))}
      </View>
    );
  }

  if (empty) {
    return (
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        </View>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No reviews yet.
        </Text>
      </View>
    );
  }

  if (!summary) {
    return (
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      </View>

      {!!summary.takeaway && (
        <Text style={[styles.takeaway, { color: theme.colors.text }]}>{summary.takeaway}</Text>
      )}

      {(summary.pros?.length || 0) > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Pros</Text>
          {summary.pros.map((p, idx) => (
            <Text key={`p-${idx}`} style={[styles.bullet, { color: theme.colors.textSecondary }]}>
              - {p}
            </Text>
          ))}
        </View>
      )}

      {(summary.cons?.length || 0) > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Cons</Text>
          {summary.cons.map((c, idx) => (
            <Text key={`c-${idx}`} style={[styles.bullet, { color: theme.colors.textSecondary }]}>
              - {c}
            </Text>
          ))}
        </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
  },
  takeaway: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 6,
  },
});

export default ReviewSummaryCard;
