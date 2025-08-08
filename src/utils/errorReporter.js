// Centralized Error Reporting System

// Error reporting configuration
const ERROR_REPORTING_CONFIG = {
  // Enable/disable error reporting
  enabled: process.env.NODE_ENV === 'production',
  
  // Error levels
  levels: {
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
    DEBUG: 'debug'
  },
  
  // Error categories
  categories: {
    NETWORK: 'network',
    VALIDATION: 'validation',
    AUTH: 'authentication',
    SERVER: 'server',
    CLIENT: 'client',
    UNKNOWN: 'unknown'
  }
};

// Error reporting class
class ErrorReporter {
  constructor() {
    this.errors = [];
    this.maxErrors = 100; // Prevent memory leaks
  }

  // Report an error with proper categorization
  report(error, category = ERROR_REPORTING_CONFIG.categories.UNKNOWN, context = {}) {
    const errorReport = {
      timestamp: new Date().toISOString(),
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      category,
      context,
      level: ERROR_REPORTING_CONFIG.levels.ERROR
    };

    // Add to internal log
    this.addToLog(errorReport);

    // In development, still log to console for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Report:', errorReport);
    }

    // In production, you could send to external service
    if (ERROR_REPORTING_CONFIG.enabled) {
      this.sendToExternalService(errorReport);
    }
  }

  // Report a warning
  warn(message, category = ERROR_REPORTING_CONFIG.categories.UNKNOWN, context = {}) {
    const warningReport = {
      timestamp: new Date().toISOString(),
      message,
      category,
      context,
      level: ERROR_REPORTING_CONFIG.levels.WARNING
    };

    this.addToLog(warningReport);

    if (process.env.NODE_ENV === 'development') {
      console.warn('Warning Report:', warningReport);
    }
  }

  // Report info
  info(message, category = ERROR_REPORTING_CONFIG.categories.UNKNOWN, context = {}) {
    const infoReport = {
      timestamp: new Date().toISOString(),
      message,
      category,
      context,
      level: ERROR_REPORTING_CONFIG.levels.INFO
    };

    this.addToLog(infoReport);

    if (process.env.NODE_ENV === 'development') {
      console.info('Info Report:', infoReport);
    }
  }

  // Add error to internal log
  addToLog(report) {
    this.errors.push(report);
    
    // Keep only the latest errors to prevent memory leaks
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }
  }

  // Send to external service (placeholder for production)
  sendToExternalService(report) {
    // In production, you could send to services like:
    // - Sentry
    // - LogRocket
    // - Bugsnag
    // - Custom analytics service
    
    // For now, we'll just store locally
    // You can implement actual external reporting here
    try {
      // Example: send to analytics service
      // analytics.track('error', report);
    } catch (e) {
      // Don't let error reporting cause more errors
      console.error('Failed to send error report:', e);
    }
  }

  // Get all errors (for debugging)
  getErrors() {
    return [...this.errors];
  }

  // Clear error log
  clearErrors() {
    this.errors = [];
  }

  // Get error statistics
  getErrorStats() {
    const stats = {
      total: this.errors.length,
      byCategory: {},
      byLevel: {},
      recent: this.errors.slice(-10) // Last 10 errors
    };

    this.errors.forEach(error => {
      // Count by category
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
      
      // Count by level
      stats.byLevel[error.level] = (stats.byLevel[error.level] || 0) + 1;
    });

    return stats;
  }
}

// Create singleton instance
const errorReporter = new ErrorReporter();

// Export functions for easy use
export const reportError = (error, category, context) => {
  errorReporter.report(error, category, context);
};

export const reportWarning = (message, category, context) => {
  errorReporter.warn(message, category, context);
};

export const reportInfo = (message, category, context) => {
  errorReporter.info(message, category, context);
};

export const getErrorStats = () => {
  return errorReporter.getErrorStats();
};

export const clearErrorLog = () => {
  errorReporter.clearErrors();
};

// Export the reporter instance for advanced usage
export default errorReporter;
