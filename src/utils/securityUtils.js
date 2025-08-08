// Security utilities for HTTPS enforcement and security checks
import { SECURITY_CONFIG, securityUtils } from '../config/security';
import { reportError } from './errorReporter';

/**
 * Check if the current environment requires HTTPS
 * @returns {boolean} True if HTTPS is required
 */
export const isHttpsRequired = () => {
  return process.env.NODE_ENV === 'production' && 
         window.location.hostname !== 'localhost' &&
         window.location.hostname !== '127.0.0.1';
};

/**
 * Force HTTPS redirect if needed (only for development/testing)
 */
export const enforceHttps = () => {
  // Only enforce client-side redirects in development/testing
  // AWS handles this at the server level in production
  if (process.env.NODE_ENV === 'development' && 
      window.location.protocol === 'http:' && 
      window.location.hostname !== 'localhost') {
    const httpsUrl = window.location.href.replace('http:', 'https:');
    window.location.replace(httpsUrl);
    return true;
  }
  return false;
};

/**
 * Check if the current connection is secure
 * @returns {boolean} True if connection is secure
 */
export const isSecureConnection = () => {
  return window.location.protocol === 'https:' || 
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
};

/**
 * Validate API endpoints to ensure they use HTTPS
 * @param {string} url - The URL to validate
 * @returns {boolean} True if URL is secure
 */
export const validateSecureUrl = (url) => {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:' || 
           urlObj.hostname === 'localhost' ||
           urlObj.hostname === '127.0.0.1';
  } catch (error) {
    reportError(error, 'validation', { url });
    return false;
  }
};

/**
 * Add security headers to fetch requests
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise} Fetch promise with security headers
 */
export const secureFetch = (url, options = {}) => {
  // Ensure HTTPS for production
  if (isHttpsRequired() && url.startsWith('http://')) {
    url = url.replace('http://', 'https://');
  }
  
  const secureOptions = {
    ...options,
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'same-origin',
  };
  
  return fetch(url, secureOptions);
};

/**
 * Check for mixed content issues
 * @returns {Array} Array of insecure resources
 */
export const checkMixedContent = () => {
  const insecureResources = [];
  
  // Check for HTTP resources in HTTPS page
  if (window.location.protocol === 'https:') {
    const images = document.querySelectorAll('img[src^="http://"]');
    const scripts = document.querySelectorAll('script[src^="http://"]');
    const links = document.querySelectorAll('link[href^="http://"]');
    
    [...images, ...scripts, ...links].forEach(element => {
      insecureResources.push({
        type: element.tagName.toLowerCase(),
        src: element.src || element.href,
        element
      });
    });
  }
  
  return insecureResources;
};

/**
 * Fix mixed content by upgrading HTTP to HTTPS
 */
export const fixMixedContent = () => {
  const insecureResources = checkMixedContent();
  
  insecureResources.forEach(({ element, src }) => {
    const secureSrc = src.replace('http://', 'https://');
    if (element.src) {
      element.src = secureSrc;
    } else if (element.href) {
      element.href = secureSrc;
    }
  });
};

/**
 * Validate external URLs against allowed domains
 * @param {string} url - The URL to validate
 * @returns {boolean} True if URL is allowed
 */
export const validateExternalUrl = (url) => {
  return securityUtils.isValidExternalUrl(url);
};

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - The input to sanitize
 * @returns {string} Sanitized input
 */
export const sanitizeInput = (input) => {
  return securityUtils.sanitizeHtml(input);
};

/**
 * Validate input against security patterns
 * @param {string} input - The input to validate
 * @param {string} type - The type of validation (eventId, email, phone)
 * @returns {boolean} True if input is valid
 */
export const validateInput = (input, type) => {
  const pattern = SECURITY_CONFIG.VALIDATION_PATTERNS[type];
  const maxLength = SECURITY_CONFIG.MAX_LENGTHS[type];
  
  if (!pattern) {
    console.warn(`No validation pattern found for type: ${type}`);
    return false;
  }
  
  return securityUtils.validateInput(input, pattern, maxLength);
};

/**
 * Check for CSP violations in console
 * @returns {Array} Array of CSP violations
 */
export const checkCSPViolations = () => {
  const violations = [];
  
  if (typeof window !== 'undefined' && window.console) {
    const originalError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('Content Security Policy') || 
          message.includes('CSP') ||
          message.includes('Refused to load')) {
        violations.push({
          message,
          timestamp: new Date().toISOString(),
          stack: new Error().stack
        });
      }
      originalError.apply(console, args);
    };
  }
  
  return violations;
};

/**
 * Generate a secure nonce for CSP
 * @returns {string} A secure nonce
 */
export const generateNonce = () => {
  return securityUtils.generateNonce();
};

/**
 * Initialize security features
 */
export const initializeSecurity = () => {
  // Enforce HTTPS
  enforceHttps();
  
  // Fix mixed content
  fixMixedContent();
  
  // Monitor for new insecure resources
  if (typeof window !== 'undefined') {
    const observer = new MutationObserver(() => {
      fixMixedContent();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Monitor CSP violations
    checkCSPViolations();
  }
};

// Export security configuration for use in components
export { SECURITY_CONFIG, securityUtils };
