// Application Constants

// Grid Configuration
export const GRID_SIZE = 10;
export const TOTAL_SQUARES = 100;

// Contest Status
export const CONTEST_STATUS = {
  NEW: 'new',
  ACTIVE: 'active',
  COMPLETED: 'completed'
};

// Default Values
export const DEFAULT_COST_PER_SQUARE = 10;
export const MIN_COST_PER_SQUARE = 1;
export const MAX_COST_PER_SQUARE = 1000;

// API Endpoints
export const API_ENDPOINTS = {
  CONTESTS: '/contests',
  GAMES: '/games'
};

// Error Messages
export const ERROR_MESSAGES = {
  CONTEST_NOT_FOUND: 'Contest does not exist!',
  CONTEST_ALREADY_STARTED: 'Contest has already started!',
  INVALID_URL: 'Invalid contest URL. Please go back and try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  FETCH_FAILED: 'Failed to fetch data',
  SAVE_FAILED: 'Failed to save names. Please try again.',
  SUBMIT_FAILED: 'Failed to submit names. Please try again.',
  CREATE_FAILED: 'Failed to create contest. Please try again.',
  NO_NAMES: 'Please enter at least one name',
  INCOMPLETE_NAMES: 'Please enter exactly 100 names',
  NO_EVENT_ID: 'No event ID found in contest data',
  NO_GAME_DATA: 'No game data available'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  NAMES_SAVED: 'Names saved successfully!',
  CONTEST_CREATED: 'Contest created successfully!'
};

// UI Configuration
export const UI_CONFIG = {
  TOAST_DURATION: 3000,
  COPY_FEEDBACK_DURATION: 2000,
  GAME_REFRESH_INTERVAL: 120000, // 2 minutes
  MAX_NAME_LENGTH: 50
};
