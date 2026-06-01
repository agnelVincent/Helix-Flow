/**
 * utils/formatDate.js
 *
 * Date formatting helpers used throughout the app.
 * Uses the native Intl.DateTimeFormat API — no external dependency needed.
 *
 * All functions accept an ISO 8601 date string or a Date object.
 */


/**
 * Format a date for display in task cards.
 * Example: "Jun 15, 2026"
 *
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDisplayDate(date) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}


/**
 * Format a date with time for detail views.
 * Example: "Jun 15, 2026 at 3:30 PM"
 *
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDateTime(date) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
}


/**
 * Format a date as YYYY-MM-DD for calendar keys and API params.
 * Example: "2026-06-15"
 *
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDateKey(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}


/**
 * Return a human-readable relative time string.
 * Example: "2 days ago", "in 3 hours", "just now"
 *
 * @param {string|Date} date
 * @returns {string}
 */
export function formatRelativeTime(date) {
  if (!date) return '—';

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const diff = (new Date(date) - Date.now()) / 1000; // diff in seconds

  const thresholds = [
    { unit: 'year',   value: 60 * 60 * 24 * 365 },
    { unit: 'month',  value: 60 * 60 * 24 * 30  },
    { unit: 'week',   value: 60 * 60 * 24 * 7   },
    { unit: 'day',    value: 60 * 60 * 24        },
    { unit: 'hour',   value: 60 * 60             },
    { unit: 'minute', value: 60                  },
    { unit: 'second', value: 1                   },
  ];

  for (const { unit, value } of thresholds) {
    if (Math.abs(diff) >= value) {
      return rtf.format(Math.round(diff / value), unit);
    }
  }

  return 'just now';
}


/**
 * Check if a due date is overdue (in the past and task not completed).
 *
 * @param {string|Date} dueDate
 * @param {boolean}     isCompleted
 * @returns {boolean}
 */
export function isOverdue(dueDate, isCompleted) {
  if (!dueDate || isCompleted) return false;
  return new Date(dueDate) < new Date();
}