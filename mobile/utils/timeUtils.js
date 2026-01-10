// Utility functions for time formatting

import i18n from '../i18n';

export const getRelativeTime = (dateString, locale = 'en') => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  const safeLocale = (locale || 'en').toString();
  const rtf =
    typeof Intl !== 'undefined' && typeof Intl.RelativeTimeFormat !== 'undefined'
      ? new Intl.RelativeTimeFormat(safeLocale, { numeric: 'auto' })
      : null;

  const t = (key, options = {}) => i18n.t(key, { lng: safeLocale, ...options });

  const fmt = (value, unit, fallback) => {
    if (rtf) {
      try {
        return rtf.format(value, unit);
      } catch {
        // fall through
      }
    }
    return fallback;
  };

  if (diffSeconds < 60) {
    return fmt(0, 'second', t('time.justNow'));
  } else if (diffMinutes < 60) {
    return fmt(-diffMinutes, 'minute', t('time.minuteAgo', { count: diffMinutes }));
  } else if (diffHours < 24) {
    return fmt(-diffHours, 'hour', t('time.hourAgo', { count: diffHours }));
  } else if (diffDays < 7) {
    return fmt(-diffDays, 'day', t('time.dayAgo', { count: diffDays }));
  } else if (diffWeeks < 4) {
    return fmt(-diffWeeks, 'week', t('time.weekAgo', { count: diffWeeks }));
  } else if (diffMonths < 12) {
    return fmt(-diffMonths, 'month', t('time.monthAgo', { count: diffMonths }));
  } else {
    return fmt(-diffYears, 'year', t('time.yearAgo', { count: diffYears }));
  }
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};
