import React from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const NetworkStatus = () => {
  const { isOnline, isConnecting, isOffline } = useNetworkStatus();

  if (isOnline) {
    return null; // Don't show anything when online
  }

  return (
    <div className="network-status">
      <div className={`network-indicator ${isConnecting ? 'connecting' : 'offline'}`}>
        <div className="network-icon">
          {isConnecting ? (
            <div className="spinner"></div>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 8.98C20.93 5.9 16.69 4 12 4S3.07 5.9 0 8.98L12 21 24 8.98zM2.92 9.07C5.51 7.08 8.67 6 12 6s6.49 1.08 9.08 3.07l-9.08 9.08-9.08-9.08z"/>
            </svg>
          )}
        </div>
        <div className="network-text">
          {isConnecting ? 'Connecting...' : 'You\'re offline'}
        </div>
        {isOffline && (
          <div className="offline-message">
            Some features may be limited. Check your connection.
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkStatus;
