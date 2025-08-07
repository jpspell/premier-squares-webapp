// Validation Utility Functions

import { TOTAL_SQUARES, CONTEST_STATUS } from '../constants';

// Validate contest status
export const isValidContestStatus = (status) => {
  return status && status === CONTEST_STATUS.NEW;
};

// Validate names array
export const validateNames = (names) => {
  if (!Array.isArray(names)) {
    return { isValid: false, message: 'Invalid names format' };
  }

  const validNames = names.filter(name => name && name.trim() !== '');
  
  if (validNames.length === 0) {
    return { isValid: false, message: 'Please enter at least one name' };
  }

  if (validNames.length !== TOTAL_SQUARES) {
    return { isValid: false, message: 'Please enter exactly 100 names' };
  }

  return { isValid: true, message: '' };
};

// Validate contest ID
export const isValidContestId = (contestId) => {
  return contestId && typeof contestId === 'string' && contestId.trim() !== '';
};

// Validate event ID
export const isValidEventId = (eventId) => {
  return eventId && typeof eventId === 'string' && eventId.trim() !== '';
};

// Validate cost per square
export const validateCostPerSquare = (cost) => {
  const numCost = parseInt(cost);
  if (isNaN(numCost) || numCost < 1 || numCost > 1000) {
    return { isValid: false, message: 'Cost must be between $1 and $1000' };
  }
  return { isValid: true, message: '' };
};
