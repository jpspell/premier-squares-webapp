/**
 * Utility functions for premier squares coloring logic
 */

/**
 * Get the last digit of a number
 * @param {number} num - The number to get the last digit from
 * @returns {number} The last digit
 */
export const getLastDigit = (num) => {
  const result = num % 10;
  return result === -0 ? 0 : result;
};

/**
 * Calculate cumulative scores for a given period
 * @param {Object} gameData - The game data object
 * @param {number} period - The period to calculate cumulative scores for
 * @returns {Object} Object containing home and away cumulative scores
 */
export const getCumulativeScores = (gameData, period) => {
  let homeTotal = 0;
  let awayTotal = 0;
  
  // Add up all periods up to the current period
  for (let i = 0; i < period; i++) {
    const homeScore = gameData.homeTeam.lineScore[i] || 0;
    const awayScore = gameData.awayTeam.lineScore[i] || 0;
    homeTotal += homeScore;
    awayTotal += awayScore;
  }
  
  return { home: homeTotal, away: awayTotal };
};

/**
 * Determine if a square should be colored and which quarters it won
 * @param {Object} gameData - The game data object
 * @param {number} homeDigit - The home team digit (0-9)
 * @param {number} awayDigit - The away team digit (0-9)
 * @returns {Object} Object containing coloring information
 */
export const getSquareInfo = (gameData, homeDigit, awayDigit) => {
  const winningQuarters = [];
  
  // Check each period to see if this square should be colored
  for (let period = 1; period <= gameData.currentPeriod; period++) {
    const scores = getCumulativeScores(gameData, period);
    const homeLastDigit = getLastDigit(scores.home);
    const awayLastDigit = getLastDigit(scores.away);
    
    // If this square matches the last digits for this period, add it to winning quarters
    if (homeLastDigit === homeDigit && awayLastDigit === awayDigit) {
      winningQuarters.push(period);
    }
  }
  
  if (winningQuarters.length > 0) {
    return { 
      isColored: true, 
      quarters: winningQuarters,
      quarterText: winningQuarters.map(q => `Q${q}`).join(',')
    };
  }
  
  return { isColored: false, quarters: [], quarterText: null };
};

/**
 * Get all winning squares for a given game
 * @param {Object} gameData - The game data object
 * @returns {Array} Array of objects containing square coordinates and quarter info
 */
export const getAllWinningSquares = (gameData) => {
  const winningSquares = [];
  
  // Check all 100 squares (0-9 x 0-9)
  for (let homeDigit = 0; homeDigit < 10; homeDigit++) {
    for (let awayDigit = 0; awayDigit < 10; awayDigit++) {
      const squareInfo = getSquareInfo(gameData, homeDigit, awayDigit);
      if (squareInfo.isColored) {
        winningSquares.push({
          homeDigit,
          awayDigit,
          ...squareInfo
        });
      }
    }
  }
  
  return winningSquares;
};

/**
 * Validate game data structure
 * @param {Object} gameData - The game data to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const validateGameData = (gameData) => {
  if (!gameData) return false;
  
  const requiredFields = [
    'homeTeam',
    'awayTeam',
    'currentPeriod'
  ];
  
  const requiredTeamFields = [
    'name',
    'score',
    'lineScore'
  ];
  
  // Check required top-level fields
  for (const field of requiredFields) {
    if (!(field in gameData)) {
      return false;
    }
  }
  
  // Check required team fields
  for (const team of ['homeTeam', 'awayTeam']) {
    for (const field of requiredTeamFields) {
      if (!(field in gameData[team])) {
        return false;
      }
    }
  }
  
  // Validate data types
  if (typeof gameData.currentPeriod !== 'number' || gameData.currentPeriod < 0) {
    return false;
  }
  
  if (typeof gameData.homeTeam.score !== 'number' || typeof gameData.awayTeam.score !== 'number') {
    return false;
  }
  
  if (!Array.isArray(gameData.homeTeam.lineScore) || !Array.isArray(gameData.awayTeam.lineScore)) {
    return false;
  }
  
  return true;
};
