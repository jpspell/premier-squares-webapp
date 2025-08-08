// Security Configuration
export const SECURITY_CONFIG = {
  // Content Security Policy
  CSP: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      "https://pagead2.googlesyndication.com",
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com"
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com"
    ],
    fontSrc: [
      "'self'",
      "https://fonts.gstatic.com"
    ],
    imgSrc: [
      "'self'",
      "data:",
      "https:"
    ],
    connectSrc: [
      "'self'",
      "http://localhost:*",
      "https://localhost:*",
      "https://z414f9tg84.execute-api.us-east-1.amazonaws.com",
      "https://pagead2.googlesyndication.com",
      "https://www.google-analytics.com"
    ],
    frameSrc: [
      "'self'",
      "https://pagead2.googlesyndication.com"
    ],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"]
  },

  // Rate Limiting
  RATE_LIMIT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Security Headers
  HEADERS: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  },

  // Cache Control for sensitive pages
  CACHE_CONTROL: {
    sensitive: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  },

  // Allowed domains for external resources
  ALLOWED_DOMAINS: [
    'pagead2.googlesyndication.com',
    'www.googletagmanager.com',
    'www.google-analytics.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'z414f9tg84.execute-api.us-east-1.amazonaws.com',
    'localhost',
    '127.0.0.1'
  ],

  // Blocked protocols
  BLOCKED_PROTOCOLS: [
    'data:',
    'blob:',
    'javascript:',
    'vbscript:'
  ],

  // Input validation patterns
  VALIDATION_PATTERNS: {
    eventId: /^[a-zA-Z0-9_-]+$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\+]?[1-9][\d]{0,15}$/
  },

  // Maximum input lengths
  MAX_LENGTHS: {
    eventId: 100,
    name: 100,
    contestId: 200,
    description: 500
  }
};

// Security utility functions
export const securityUtils = {
  // Validate URL against allowed domains
  isValidExternalUrl: (url) => {
    try {
      const urlObj = new URL(url);
      return SECURITY_CONFIG.ALLOWED_DOMAINS.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
      );
    } catch {
      return false;
    }
  },

  // Sanitize HTML content
  sanitizeHtml: (html) => {
    if (typeof html !== 'string') return html;
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  },

  // Validate input against patterns
  validateInput: (input, pattern, maxLength) => {
    if (!input || typeof input !== 'string') return false;
    if (maxLength && input.length > maxLength) return false;
    return pattern.test(input);
  },

  // Generate nonce for CSP
  generateNonce: () => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
};

export default SECURITY_CONFIG;
