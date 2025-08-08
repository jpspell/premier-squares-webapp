import { useState, useEffect } from 'react';
import config from '../config/config';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastOnline, setLastOnline] = useState(Date.now());

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnline(Date.now());
      setIsConnecting(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsConnecting(false);
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Test network connectivity periodically
    const testConnection = async () => {
      if (!navigator.onLine) {
        setIsOnline(false);
        return;
      }

      try {
        setIsConnecting(true);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${config.API_BASE_URL}/health`, {
          method: 'HEAD',
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        if (response.ok) {
          setIsOnline(true);
          setLastOnline(Date.now());
        } else {
          setIsOnline(false);
        }
      } catch (error) {
        setIsOnline(false);
      } finally {
        setIsConnecting(false);
      }
    };

    // Test connection every 30 seconds
    const intervalId = setInterval(testConnection, 30000);

    // Initial connection test
    testConnection();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, []);

  return {
    isOnline,
    isConnecting,
    lastOnline,
    isOffline: !isOnline && !isConnecting
  };
};
