// Error handling utilities for better user experience

// Error types for categorization
export const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  VALIDATION: 'VALIDATION',
  AUTH: 'AUTH',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN'
};

// Error messages for different scenarios
export const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK]: 'Network error. Please check your connection and try again.',
  [ERROR_TYPES.VALIDATION]: 'Please check your input and try again.',
  [ERROR_TYPES.AUTH]: 'Authentication error. Please refresh the page.',
  [ERROR_TYPES.NOT_FOUND]: 'The requested resource was not found.',
  [ERROR_TYPES.SERVER]: 'Server error. Please try again later.',
  [ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred. Please try again.'
};

// Function to categorize errors based on response status or error message
export const categorizeError = (error) => {
  if (!error) return ERROR_TYPES.UNKNOWN;

  // Check for network errors
  if (error.message?.includes('Failed to fetch') || 
      error.message?.includes('NetworkError') ||
      error.name === 'TypeError' && error.message?.includes('fetch')) {
    return ERROR_TYPES.NETWORK;
  }

  // Check for HTTP status codes
  if (error.status) {
    switch (error.status) {
      case 400:
        return ERROR_TYPES.VALIDATION;
      case 401:
      case 403:
        return ERROR_TYPES.AUTH;
      case 404:
        return ERROR_TYPES.NOT_FOUND;
      case 500:
      case 502:
      case 503:
      case 504:
        return ERROR_TYPES.SERVER;
      default:
        return ERROR_TYPES.UNKNOWN;
    }
  }

  // Check for specific error messages
  if (error.message) {
    const message = error.message.toLowerCase();
    if (message.includes('validation') || message.includes('invalid')) {
      return ERROR_TYPES.VALIDATION;
    }
    if (message.includes('not found') || message.includes('404')) {
      return ERROR_TYPES.NOT_FOUND;
    }
    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return ERROR_TYPES.AUTH;
    }
  }

  return ERROR_TYPES.UNKNOWN;
};

// Function to get user-friendly error message
export const getErrorMessage = (error) => {
  const errorType = categorizeError(error);
  return ERROR_MESSAGES[errorType];
};

// Function to handle async operations with error handling
export const handleAsyncOperation = async (operation, errorHandler) => {
  try {
    return await operation();
  } catch (error) {
    const errorType = categorizeError(error);
    const userMessage = getErrorMessage(error);
    
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Async operation error:', {
        error,
        type: errorType,
        message: userMessage
      });
    }

    // Call custom error handler if provided
    if (errorHandler) {
      errorHandler(error, errorType, userMessage);
    }

    throw {
      originalError: error,
      type: errorType,
      userMessage
    };
  }
};

// Function to create a retry mechanism for failed operations
export const createRetryableOperation = (operation, maxRetries = 3, delay = 1000) => {
  return async (...args) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation(...args);
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain error types
        const errorType = categorizeError(error);
        if (errorType === ERROR_TYPES.VALIDATION || 
            errorType === ERROR_TYPES.AUTH || 
            errorType === ERROR_TYPES.NOT_FOUND) {
          throw error;
        }
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw lastError;
  };
};

// Function to safely execute operations that might throw
export const safeExecute = (operation, fallback = null) => {
  try {
    return operation();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Safe execute error:', error);
    }
    return fallback;
  }
};

// Function to create a debounced error handler
export const createDebouncedErrorHandler = (handler, delay = 300) => {
  let timeoutId;
  
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => handler(...args), delay);
  };
};
