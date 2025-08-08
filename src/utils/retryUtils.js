// Retry utilities for network requests
import { reportError } from './errorReporter';

// Retry configuration
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504]
};

// Calculate delay with exponential backoff
const calculateDelay = (attempt, config) => {
  const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxDelay);
};

// Check if error is retryable
const isRetryableError = (error, config) => {
  // Network errors are always retryable
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }
  
  // Check status codes
  if (error.status && config.retryableStatusCodes.includes(error.status)) {
    return true;
  }
  
  // Check for timeout errors
  if (error.name === 'AbortError') {
    return true;
  }
  
  return false;
};

// Retry function with exponential backoff
export const retryWithBackoff = async (operation, config = {}) => {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError;
  
  for (let attempt = 1; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry if error is not retryable
      if (!isRetryableError(error, retryConfig)) {
        throw error;
      }
      
      // If this is the last attempt, throw the error
      if (attempt === retryConfig.maxRetries) {
        throw error;
      }
      
      // Calculate delay for next retry
      const delay = calculateDelay(attempt, retryConfig);
      
      // Report retry attempt
      reportError(error, 'retry', { 
        attempt, 
        maxRetries: retryConfig.maxRetries, 
        delay,
        operation: operation.name || 'unknown'
      });
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// Create a retryable fetch function
export const createRetryableFetch = (config = {}) => {
  return async (url, options = {}) => {
    return retryWithBackoff(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const error = new Error(`HTTP error! status: ${response.status}`);
          error.status = response.status;
          throw error;
        }
        
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    }, config);
  };
};

// Retry with different strategies
export const retryStrategies = {
  // Immediate retry for transient errors
  immediate: {
    maxRetries: 2,
    baseDelay: 100,
    maxDelay: 500
  },
  
  // Standard retry with exponential backoff
  standard: DEFAULT_RETRY_CONFIG,
  
  // Aggressive retry for critical operations
  aggressive: {
    maxRetries: 5,
    baseDelay: 500,
    maxDelay: 15000,
    backoffMultiplier: 1.5
  },
  
  // Conservative retry for non-critical operations
  conservative: {
    maxRetries: 2,
    baseDelay: 2000,
    maxDelay: 5000,
    backoffMultiplier: 2
  }
};

// Create a retryable operation with specific strategy
export const createRetryableOperation = (operation, strategy = 'standard') => {
  const config = retryStrategies[strategy] || retryStrategies.standard;
  return (...args) => retryWithBackoff(() => operation(...args), config);
};
