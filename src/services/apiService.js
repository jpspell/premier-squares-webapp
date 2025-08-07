// API Service Layer - Centralized API calls

const API_BASE_URL = 'http://192.168.86.249:3001';

// Contest API calls
export const contestAPI = {
  // Get contest by ID
  getContest: async (contestId) => {
    const response = await fetch(`${API_BASE_URL}/contests/${contestId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  // Create new contest
  createContest: async (eventId, costPerSquare) => {
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Update contest names
  updateContest: async (contestId, names) => {
    const response = await fetch(`${API_BASE_URL}/contests/${contestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ names })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Start contest
  startContest: async (contestId) => {
    const response = await fetch(`${API_BASE_URL}/contests/${contestId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
};

// Error handling utility
export const handleAPIError = (error, defaultMessage = 'An error occurred') => {
  if (error.message.includes('404')) {
    return 'Contest does not exist!';
  }
  if (error.message.includes('Failed to fetch')) {
    return 'Network error. Please check your connection.';
  }
  return defaultMessage;
};
