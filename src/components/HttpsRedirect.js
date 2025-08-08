import { useEffect } from 'react';
import { enforceHttps, initializeSecurity } from '../utils/securityUtils';

const HttpsRedirect = () => {
  useEffect(() => {
    // Initialize all security features
    initializeSecurity();
    
    // Enforce HTTPS redirect
    enforceHttps();
  }, []);

  return null; // This component doesn't render anything
};

export default HttpsRedirect;
