// API Service Layer - Centralized API calls
import config from '../config/config';
import { handleAsyncOperation, categorizeError, getErrorMessage } from '../utils/errorHandler';

const API_BASE_URL = config.API_BASE_URL;

// Contest API calls
export const contestAPI = {
  // Get contest by ID
  getContest: async (contestId) => {
    return handleAsyncOperation(async () => {
      const response = await fetch(`${API_BASE_URL}/contests/${contestId}`);
      if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`);
        error.status = response.status;
        throw error;
      }
      return response.json();
    });
  },

  // Create new contest
  createContest: async (eventId, costPerSquare) => {
    return handleAsyncOperation(async () => {
      const response = await fetch(`${API_BASE_URL}/contests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          costPerSquare
        })
      });

      if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`);
        error.status = response.status;
        throw error;
      }

      return response.json();
    });
  },

  // Update contest names
  updateContest: async (contestId, names) => {
    return handleAsyncOperation(async () => {
      const response = await fetch(`${API_BASE_URL}/contests/${contestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ names })
      });

      if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`);
        error.status = response.status;
        throw error;
      }

      return response.json();
    });
  },

  // Start contest
  startContest: async (contestId) => {
    return handleAsyncOperation(async () => {
      const response = await fetch(`${API_BASE_URL}/contests/${contestId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`);
        error.status = response.status;
        throw error;
      }

      return response.json();
    });
  }
};

// Error handling utility (legacy - use errorHandler utils instead)
export const handleAPIError = (error, defaultMessage = 'An error occurred') => {
  return getErrorMessage(error) || defaultMessage;
};
