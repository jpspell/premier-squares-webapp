// Security utilities for HTTPS enforcement and security checks

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
    console.error('Invalid URL:', url);
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
  }
};
