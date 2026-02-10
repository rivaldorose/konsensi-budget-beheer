/**
 * Input validation utilities for security and data integrity
 */

/**
 * Validate and sanitize a financial amount
 * @param {string|number} value - The amount to validate
 * @param {object} options - Validation options
 * @param {number} options.min - Minimum value (default: 0)
 * @param {number} options.max - Maximum value (default: 999999.99)
 * @returns {{ valid: boolean, value: number|null, error: string|null }}
 */
export const validateAmount = (value, options = {}) => {
  const { min = 0, max = 999999.99 } = options

  if (value === null || value === undefined || value === '') {
    return { valid: false, value: null, error: 'Bedrag is verplicht' }
  }

  // Clean the value: allow comma as decimal separator
  const cleaned = String(value).replace(',', '.').replace(/[^\d.-]/g, '')
  const num = parseFloat(cleaned)

  if (isNaN(num)) {
    return { valid: false, value: null, error: 'Ongeldig bedrag' }
  }

  if (num < min) {
    return { valid: false, value: null, error: `Bedrag moet minimaal ${min} zijn` }
  }

  if (num > max) {
    return { valid: false, value: null, error: `Bedrag mag maximaal ${max} zijn` }
  }

  // Round to 2 decimal places
  const rounded = Math.round(num * 100) / 100

  return { valid: true, value: rounded, error: null }
}

/**
 * Sanitize text input to prevent XSS
 * Strips HTML tags and trims whitespace
 * @param {string} input - Text to sanitize
 * @param {number} maxLength - Maximum allowed length (default: 500)
 * @returns {string}
 */
export const sanitizeText = (input, maxLength = 500) => {
  if (!input || typeof input !== 'string') return ''
  return input
    .replace(/<[^>]*>/g, '')   // Strip HTML tags
    .replace(/[<>]/g, '')       // Remove remaining angle brackets
    .trim()
    .slice(0, maxLength)
}

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email.trim())
}

/**
 * Validate Dutch IBAN
 * @param {string} iban
 * @returns {boolean}
 */
export const isValidIBAN = (iban) => {
  if (!iban || typeof iban !== 'string') return false
  const cleaned = iban.replace(/\s/g, '').toUpperCase()
  // Basic Dutch IBAN format: NL + 2 digits + 4 letters + 10 digits
  return /^NL\d{2}[A-Z]{4}\d{10}$/.test(cleaned)
}

/**
 * Validate password strength
 * @param {string} password
 * @returns {{ valid: boolean, errors: string[] }}
 */
export const validatePassword = (password) => {
  const errors = []

  if (!password || password.length < 8) {
    errors.push('Minimaal 8 tekens')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Minimaal 1 hoofdletter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Minimaal 1 kleine letter')
  }
  if (!/\d/.test(password)) {
    errors.push('Minimaal 1 cijfer')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validate a date string (YYYY-MM-DD)
 * @param {string} dateStr
 * @returns {boolean}
 */
export const isValidDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false

  const date = new Date(dateStr)
  return !isNaN(date.getTime())
}
