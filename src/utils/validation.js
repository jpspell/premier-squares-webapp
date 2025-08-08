// Validation Utility Functions

import { TOTAL_SQUARES, CONTEST_STATUS } from '../constants';

// Sanitization helper functions (matching backend)
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, ''); // Remove potential HTML tags
};

const sanitizeArray = (arr) => {
  if (!Array.isArray(arr)) return arr;
  return arr.map(item => sanitizeString(item)).filter(item => item !== '');
};

// Sanitization function (matching backend)
const sanitizeInput = (data) => {
  if (typeof data === 'string') {
    return sanitizeString(data);
  }
  
  if (Array.isArray(data)) {
    return sanitizeArray(data);
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return data;
};

// Validate contest status
export const isValidContestStatus = (status) => {
  return status && status === CONTEST_STATUS.NEW;
};

// Validate event ID (matching backend eventIdSchema)
export const validateEventId = (eventId) => {
  const sanitizedEventId = sanitizeString(eventId);
  
  if (!sanitizedEventId || sanitizedEventId.trim() === '') {
    return { isValid: false, message: 'eventId is required' };
  }
  
  if (sanitizedEventId.length < 1) {
    return { isValid: false, message: 'eventId cannot be empty' };
  }
  
  if (sanitizedEventId.length > 100) {
    return { isValid: false, message: 'eventId is too long' };
  }
  
  // Pattern: letters, numbers, hyphens, and underscores only
  const eventIdPattern = /^[a-zA-Z0-9_-]+$/;
  if (!eventIdPattern.test(sanitizedEventId)) {
    return { isValid: false, message: 'eventId can only contain letters, numbers, hyphens, and underscores' };
  }
  
  return { isValid: true, message: '', value: sanitizedEventId };
};

// Validate cost per square (matching backend costPerSquareSchema)
export const validateCostPerSquare = (cost) => {
  const sanitizedCost = sanitizeInput(cost);
  
  if (sanitizedCost === null || sanitizedCost === undefined || sanitizedCost === '') {
    return { isValid: false, message: 'costPerSquare is required' };
  }
  
  const numCost = parseFloat(sanitizedCost);
  if (isNaN(numCost)) {
    return { isValid: false, message: 'costPerSquare must be a number' };
  }
  
  if (numCost <= 0) {
    return { isValid: false, message: 'costPerSquare must be a positive number' };
  }
  
  if (numCost > 10000) {
    return { isValid: false, message: 'costPerSquare cannot exceed $10,000' };
  }
  
  // Check precision (max 2 decimal places)
  const costStr = numCost.toString();
  if (costStr.includes('.') && costStr.split('.')[1].length > 2) {
    return { isValid: false, message: 'costPerSquare cannot have more than 2 decimal places' };
  }
  
  return { isValid: true, message: '', value: numCost };
};

// Validate individual name (matching backend nameSchema)
export const validateName = (name) => {
  const sanitizedName = sanitizeString(name);
  
  if (!sanitizedName || sanitizedName.trim() === '') {
    return { isValid: false, message: 'Name cannot be empty' };
  }
  
  if (sanitizedName.length < 1) {
    return { isValid: false, message: 'Name cannot be empty' };
  }
  
  if (sanitizedName.length > 100) {
    return { isValid: false, message: 'Name cannot exceed 100 characters' };
  }
  
  return { isValid: true, message: '', value: sanitizedName };
};

// Validate names array for saving (allows partial names)
export const validateNamesForSave = (names) => {
  if (!Array.isArray(names)) {
    return { isValid: false, message: 'Names must be an array' };
  }
  
  const sanitizedNames = sanitizeArray(names);
  
  if (sanitizedNames.length === 0) {
    return { isValid: false, message: 'At least one name is required' };
  }
  
  if (sanitizedNames.length > 100) {
    return { isValid: false, message: 'Cannot exceed 100 names' };
  }
  
  // Validate each individual name
  const validationResults = sanitizedNames.map(name => validateName(name));
  const invalidNames = validationResults.filter(result => !result.isValid);
  
  if (invalidNames.length > 0) {
    return { 
      isValid: false, 
      message: invalidNames[0].message,
      invalidNames: invalidNames
    };
  }
  
  return { isValid: true, message: '', value: sanitizedNames };
};

// Validate names array for submitting (requires exactly 100 names)
export const validateNames = (names) => {
  if (!Array.isArray(names)) {
    return { isValid: false, message: 'Names must be an array' };
  }
  
  const sanitizedNames = sanitizeArray(names);
  
  if (sanitizedNames.length === 0) {
    return { isValid: false, message: 'At least one name is required' };
  }
  
  if (sanitizedNames.length > 100) {
    return { isValid: false, message: 'Cannot exceed 100 names' };
  }
  
  // Validate each individual name
  const validationResults = sanitizedNames.map(name => validateName(name));
  const invalidNames = validationResults.filter(result => !result.isValid);
  
  if (invalidNames.length > 0) {
    return { 
      isValid: false, 
      message: invalidNames[0].message,
      invalidNames: invalidNames
    };
  }
  
  // Check if we have exactly 100 names for the squares game
  if (sanitizedNames.length !== TOTAL_SQUARES) {
    return { isValid: false, message: 'Please enter exactly 100 names' };
  }
  
  return { isValid: true, message: '', value: sanitizedNames };
};

// Validate contest ID (matching backend contestIdSchema)
export const validateContestId = (contestId) => {
  const sanitizedContestId = sanitizeString(contestId);
  
  if (!sanitizedContestId || sanitizedContestId.trim() === '') {
    return { isValid: false, message: 'Contest ID is required' };
  }
  
  if (sanitizedContestId.length < 1) {
    return { isValid: false, message: 'Contest ID cannot be empty' };
  }
  
  if (sanitizedContestId.length > 200) {
    return { isValid: false, message: 'Contest ID is too long' };
  }
  
  return { isValid: true, message: '', value: sanitizedContestId };
};

// Legacy validation functions (keeping for backward compatibility)
export const isValidContestId = (contestId) => {
  const result = validateContestId(contestId);
  return result.isValid;
};

export const isValidEventId = (eventId) => {
  const result = validateEventId(eventId);
  return result.isValid;
};

// Export sanitization functions for use in components
export {
  sanitizeInput,
  sanitizeString,
  sanitizeArray
};
