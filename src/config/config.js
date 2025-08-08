// Configuration file for environment-specific settings

const config = {
  // API Configuration
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  
  // Environment detection
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Feature flags
  features: {
    enableDebugLogging: process.env.NODE_ENV === 'development',
    enableErrorReporting: process.env.NODE_ENV === 'production'
  }
};

export default config;
