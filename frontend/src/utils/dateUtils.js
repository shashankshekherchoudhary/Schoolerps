/**
 * Date utility functions for timezone-safe date handling.
 * Avoids common pitfalls with toISOString() timezone conversion.
 */

/**
 * Get today's date in YYYY-MM-DD format (local timezone).
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function getLocalDateString(date = new Date()) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

/**
 * Parse a date string and return a Date object.
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {Date} Date object
 */
export function parseLocalDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day)
}

/**
 * Format a date for display.
 * @param {string|Date} date - Date to format
 * @param {string} locale - Locale for formatting (default: 'en-IN')
 * @returns {string} Formatted date string
 */
export function formatDate(date, locale = 'en-IN') {
    const dateObj = typeof date === 'string' ? parseLocalDate(date) : date
    return dateObj.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

/**
 * Format a date with time.
 * @param {string|Date} date - Date to format
 * @param {string} locale - Locale for formatting (default: 'en-IN')
 * @returns {string} Formatted date/time string
 */
export function formatDateTime(date, locale = 'en-IN') {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

/**
 * Get relative time string (e.g., "2 days ago", "in 3 hours")
 * @param {string|Date} date - Date to compare
 * @returns {string} Relative time string
 */
export function getRelativeTime(date) {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffMs = now - dateObj
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffDays > 0) {
        return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`
    } else if (diffHours > 0) {
        return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`
    } else if (diffMinutes > 0) {
        return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`
    } else {
        return 'Just now'
    }
}

/**
 * Check if a date is today.
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is today
 */
export function isToday(date) {
    const dateObj = typeof date === 'string' ? parseLocalDate(date) : date
    const today = new Date()
    return dateObj.getDate() === today.getDate() &&
        dateObj.getMonth() === today.getMonth() &&
        dateObj.getFullYear() === today.getFullYear()
}

export default {
    getLocalDateString,
    parseLocalDate,
    formatDate,
    formatDateTime,
    getRelativeTime,
    isToday
}
