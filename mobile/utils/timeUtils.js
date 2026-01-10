// Utility functions for time formatting

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
    return fmt(0, 'second', 'just now');
  } else if (diffMinutes < 60) {
    return fmt(-diffMinutes, 'minute', `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`);
  } else if (diffHours < 24) {
    return fmt(-diffHours, 'hour', `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`);
  } else if (diffDays < 7) {
    return fmt(-diffDays, 'day', `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`);
  } else if (diffWeeks < 4) {
    return fmt(-diffWeeks, 'week', `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`);
  } else if (diffMonths < 12) {
    return fmt(-diffMonths, 'month', `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`);
  } else {
    return fmt(-diffYears, 'year', `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`);
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
