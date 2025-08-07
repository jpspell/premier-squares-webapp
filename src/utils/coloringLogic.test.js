import {
  getLastDigit,
  getCumulativeScores,
  getSquareInfo,
  getAllWinningSquares,
  validateGameData
} from './coloringLogic';

// Helper function to create mock game data
const createMockGameData = (homeScore, awayScore, currentPeriod = 4, homeLineScore = [], awayLineScore = []) => {
  return {
    homeTeam: {
      name: 'Home Team',
      score: homeScore,
      lineScore: homeLineScore
    },
    awayTeam: {
      name: 'Away Team',
      score: awayScore,
      lineScore: awayLineScore
    },
    currentPeriod: currentPeriod,
    clock: '00:00'
  };
};

describe('Coloring Logic Utilities', () => {
  describe('getLastDigit', () => {
    test('should return the last digit of positive numbers', () => {
      expect(getLastDigit(123)).toBe(3);
      expect(getLastDigit(456)).toBe(6);
      expect(getLastDigit(789)).toBe(9);
      expect(getLastDigit(0)).toBe(0);
      expect(getLastDigit(10)).toBe(0);
      expect(getLastDigit(25)).toBe(5);
    });

    test('should handle negative numbers', () => {
      expect(getLastDigit(-123)).toBe(-3);
      expect(getLastDigit(-456)).toBe(-6);
      expect(getLastDigit(-10)).toBe(0);
    });

    test('should handle decimal numbers', () => {
      expect(getLastDigit(Math.floor(123.45))).toBe(3);
      expect(getLastDigit(Math.floor(456.78))).toBe(6);
      expect(getLastDigit(Math.floor(0.5))).toBe(0);
    });
  });

  describe('getCumulativeScores', () => {
    test('should calculate cumulative scores for multiple periods', () => {
      const gameData = createMockGameData(21, 14, 3, [7, 7, 7], [0, 7, 7]);
      
      const scores1 = getCumulativeScores(gameData, 1);
      expect(scores1.home).toBe(7);
      expect(scores1.away).toBe(0);
      
      const scores2 = getCumulativeScores(gameData, 2);
      expect(scores2.home).toBe(14);
      expect(scores2.away).toBe(7);
      
      const scores3 = getCumulativeScores(gameData, 3);
      expect(scores3.home).toBe(21);
      expect(scores3.away).toBe(14);
    });

    test('should handle missing line scores', () => {
      const gameData = createMockGameData(10, 5, 2, [10], [5]);
      
      const scores1 = getCumulativeScores(gameData, 1);
      expect(scores1.home).toBe(10);
      expect(scores1.away).toBe(5);
      
      const scores2 = getCumulativeScores(gameData, 2);
      expect(scores2.home).toBe(10);
      expect(scores2.away).toBe(5);
    });

    test('should handle empty line scores', () => {
      const gameData = createMockGameData(0, 0, 1, [], []);
      
      const scores = getCumulativeScores(gameData, 1);
      expect(scores.home).toBe(0);
      expect(scores.away).toBe(0);
    });

    test('should handle period 0', () => {
      const gameData = createMockGameData(21, 14, 3, [7, 7, 7], [0, 7, 7]);
      
      const scores = getCumulativeScores(gameData, 0);
      expect(scores.home).toBe(0);
      expect(scores.away).toBe(0);
    });
  });

  describe('getSquareInfo', () => {
    test('should return correct square info for winning combinations', () => {
      // Home team scores: 7, 14, 21 (last digits: 7, 4, 1)
      // Away team scores: 0, 7, 14 (last digits: 0, 7, 4)
      const gameData = createMockGameData(21, 14, 3, [7, 7, 7], [0, 7, 7]);
      
      // Square (7, 0) should win Q1
      const square1 = getSquareInfo(gameData, 7, 0);
      expect(square1.isColored).toBe(true);
      expect(square1.quarters).toEqual([1]);
      expect(square1.quarterText).toBe('Q1');
      
      // Square (4, 7) should win Q2
      const square2 = getSquareInfo(gameData, 4, 7);
      expect(square2.isColored).toBe(true);
      expect(square2.quarters).toEqual([2]);
      expect(square2.quarterText).toBe('Q2');
      
      // Square (1, 4) should win Q3
      const square3 = getSquareInfo(gameData, 1, 4);
      expect(square3.isColored).toBe(true);
      expect(square3.quarters).toEqual([3]);
      expect(square3.quarterText).toBe('Q3');
    });

    test('should return correct square info for multiple winning quarters', () => {
      // Home team scores: 10, 20, 30 (last digits: 0, 0, 0)
      // Away team scores: 5, 15, 25 (last digits: 5, 5, 5)
      const gameData = createMockGameData(30, 25, 3, [10, 10, 10], [5, 10, 10]);
      
      // Square (0, 5) should win Q1, Q2, and Q3
      const square = getSquareInfo(gameData, 0, 5);
      expect(square.isColored).toBe(true);
      expect(square.quarters).toEqual([1, 2, 3]);
      expect(square.quarterText).toBe('Q1,Q2,Q3');
    });

    test('should return false for non-winning squares', () => {
      const gameData = createMockGameData(21, 14, 3, [7, 7, 7], [0, 7, 7]);
      
      // Square (0, 0) should not win any quarter
      const square = getSquareInfo(gameData, 0, 0);
      expect(square.isColored).toBe(false);
      expect(square.quarters).toEqual([]);
      expect(square.quarterText).toBeNull();
    });

    test('should handle edge cases with zero scores', () => {
      const gameData = createMockGameData(0, 0, 1, [0], [0]);
      
      // Square (0, 0) should win Q1
      const square = getSquareInfo(gameData, 0, 0);
      expect(square.isColored).toBe(true);
      expect(square.quarters).toEqual([1]);
      expect(square.quarterText).toBe('Q1');
    });

    test('should handle incomplete game data', () => {
      const gameData = createMockGameData(7, 0, 1, [7], [0]);
      
      // Only check Q1 since currentPeriod is 1
      const square = getSquareInfo(gameData, 7, 0);
      expect(square.isColored).toBe(true);
      expect(square.quarters).toEqual([1]);
      expect(square.quarterText).toBe('Q1');
    });

    test('should handle game with no periods played', () => {
      const gameData = createMockGameData(0, 0, 0, [], []);
      
      const square = getSquareInfo(gameData, 0, 0);
      expect(square.isColored).toBe(false);
      expect(square.quarters).toEqual([]);
      expect(square.quarterText).toBeNull();
    });
  });

  describe('getAllWinningSquares', () => {
    test('should return all winning squares for a game', () => {
      const gameData = createMockGameData(21, 14, 3, [7, 7, 7], [0, 7, 7]);
      
      const winningSquares = getAllWinningSquares(gameData);
      
      expect(winningSquares).toHaveLength(3);
      
      // Check that we have the expected winning squares
      const expectedSquares = [
        { homeDigit: 7, awayDigit: 0, quarters: [1], quarterText: 'Q1' },
        { homeDigit: 4, awayDigit: 7, quarters: [2], quarterText: 'Q2' },
        { homeDigit: 1, awayDigit: 4, quarters: [3], quarterText: 'Q3' }
      ];
      
      expectedSquares.forEach(expected => {
        const found = winningSquares.find(square => 
          square.homeDigit === expected.homeDigit && 
          square.awayDigit === expected.awayDigit
        );
        expect(found).toBeDefined();
        expect(found.quarters).toEqual(expected.quarters);
        expect(found.quarterText).toBe(expected.quarterText);
        expect(found.isColored).toBe(true);
      });
    });

    test('should return empty array for game with no winning squares', () => {
      const gameData = createMockGameData(0, 0, 0, [], []);
      
      const winningSquares = getAllWinningSquares(gameData);
      expect(winningSquares).toEqual([]);
    });

    test('should handle squares that win multiple quarters', () => {
      const gameData = createMockGameData(30, 25, 3, [10, 10, 10], [5, 10, 10]);
      
      const winningSquares = getAllWinningSquares(gameData);
      
      // Should have at least one square that wins multiple quarters
      const multiQuarterSquare = winningSquares.find(square => square.quarters.length > 1);
      expect(multiQuarterSquare).toBeDefined();
      expect(multiQuarterSquare.quarters).toEqual([1, 2, 3]);
      expect(multiQuarterSquare.quarterText).toBe('Q1,Q2,Q3');
    });
  });

  describe('validateGameData', () => {
    test('should return true for valid game data', () => {
      const validGameData = createMockGameData(21, 14, 3, [7, 7, 7], [0, 7, 7]);
      expect(validateGameData(validGameData)).toBe(true);
    });

    test('should return false for null game data', () => {
      expect(validateGameData(null)).toBe(false);
    });

    test('should return false for undefined game data', () => {
      expect(validateGameData(undefined)).toBe(false);
    });

    test('should return false for missing homeTeam', () => {
      const invalidData = {
        awayTeam: { name: 'Away', score: 14, lineScore: [0, 7, 7] },
        currentPeriod: 3
      };
      expect(validateGameData(invalidData)).toBe(false);
    });

    test('should return false for missing awayTeam', () => {
      const invalidData = {
        homeTeam: { name: 'Home', score: 21, lineScore: [7, 7, 7] },
        currentPeriod: 3
      };
      expect(validateGameData(invalidData)).toBe(false);
    });

    test('should return false for missing currentPeriod', () => {
      const invalidData = {
        homeTeam: { name: 'Home', score: 21, lineScore: [7, 7, 7] },
        awayTeam: { name: 'Away', score: 14, lineScore: [0, 7, 7] }
      };
      expect(validateGameData(invalidData)).toBe(false);
    });

    test('should return false for missing team fields', () => {
      const invalidData = {
        homeTeam: { name: 'Home', score: 21 }, // missing lineScore
        awayTeam: { name: 'Away', score: 14, lineScore: [0, 7, 7] },
        currentPeriod: 3
      };
      expect(validateGameData(invalidData)).toBe(false);
    });

    test('should return false for invalid currentPeriod', () => {
      const invalidData = createMockGameData(21, 14, -1, [7, 7, 7], [0, 7, 7]);
      expect(validateGameData(invalidData)).toBe(false);
    });

    test('should return false for non-numeric scores', () => {
      const invalidData = {
        homeTeam: { name: 'Home', score: '21', lineScore: [7, 7, 7] },
        awayTeam: { name: 'Away', score: 14, lineScore: [0, 7, 7] },
        currentPeriod: 3
      };
      expect(validateGameData(invalidData)).toBe(false);
    });

    test('should return false for non-array lineScore', () => {
      const invalidData = {
        homeTeam: { name: 'Home', score: 21, lineScore: 'not an array' },
        awayTeam: { name: 'Away', score: 14, lineScore: [0, 7, 7] },
        currentPeriod: 3
      };
      expect(validateGameData(invalidData)).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    test('should work together for a complete game scenario', () => {
      // Simulate a complete 4-quarter game
      const gameData = createMockGameData(28, 21, 4, [7, 7, 7, 7], [0, 7, 7, 7]);
      
      // Validate the game data
      expect(validateGameData(gameData)).toBe(true);
      
      // Get all winning squares
      const winningSquares = getAllWinningSquares(gameData);
      expect(winningSquares.length).toBeGreaterThan(0);
      
      // Verify each winning square
      winningSquares.forEach(square => {
        const squareInfo = getSquareInfo(gameData, square.homeDigit, square.awayDigit);
        expect(squareInfo.isColored).toBe(true);
        expect(squareInfo.quarters).toEqual(square.quarters);
        expect(squareInfo.quarterText).toBe(square.quarterText);
      });
    });

    test('should handle edge case with very large scores', () => {
      const gameData = createMockGameData(1234567, 987654, 1, [1234567], [987654]);
      
      expect(validateGameData(gameData)).toBe(true);
      
      const winningSquares = getAllWinningSquares(gameData);
      expect(winningSquares.length).toBe(1);
      
      const square = winningSquares[0];
      expect(square.homeDigit).toBe(7); // Last digit of 1234567
      expect(square.awayDigit).toBe(4); // Last digit of 987654
    });

    test('should work with custom realistic football scores', () => {
      // My custom scenario: Home team wins 24-17
      // Q1: Home 7, Away 0 (7-0)
      // Q2: Home 14, Away 7 (14-7) 
      // Q3: Home 17, Away 14 (17-14)
      // Q4: Home 24, Away 17 (24-17)
      const gameData = createMockGameData(24, 17, 4, [7, 7, 3, 7], [0, 7, 7, 3]);
      
      // Validate the game data
      expect(validateGameData(gameData)).toBe(true);
      
      // Test cumulative scores
      const scores1 = getCumulativeScores(gameData, 1);
      expect(scores1.home).toBe(7);
      expect(scores1.away).toBe(0);
      
      const scores2 = getCumulativeScores(gameData, 2);
      expect(scores2.home).toBe(14);
      expect(scores2.away).toBe(7);
      
      const scores3 = getCumulativeScores(gameData, 3);
      expect(scores3.home).toBe(17);
      expect(scores3.away).toBe(14);
      
      const scores4 = getCumulativeScores(gameData, 4);
      expect(scores4.home).toBe(24);
      expect(scores4.away).toBe(17);
      
      // Test winning squares
      // Q1: Home 7, Away 0 → Square (7, 0) wins
      const square1 = getSquareInfo(gameData, 7, 0);
      expect(square1.isColored).toBe(true);
      expect(square1.quarters).toEqual([1]);
      expect(square1.quarterText).toBe('Q1');
      
      // Q2: Home 14, Away 7 → Square (4, 7) wins
      const square2 = getSquareInfo(gameData, 4, 7);
      expect(square2.isColored).toBe(true);
      expect(square2.quarters).toEqual([2, 4]); // Same square wins Q2 and Q4!
      expect(square2.quarterText).toBe('Q2,Q4');
      
      // Q3: Home 17, Away 14 → Square (7, 4) wins
      const square3 = getSquareInfo(gameData, 7, 4);
      expect(square3.isColored).toBe(true);
      expect(square3.quarters).toEqual([3]);
      expect(square3.quarterText).toBe('Q3');
      
      // Q4: Home 24, Away 17 → Square (4, 7) wins (same as Q2)
      // This is already tested above with square2
      
      // Test a non-winning square
      const nonWinningSquare = getSquareInfo(gameData, 0, 0);
      expect(nonWinningSquare.isColored).toBe(false);
      expect(nonWinningSquare.quarters).toEqual([]);
      expect(nonWinningSquare.quarterText).toBeNull();
      
      // Get all winning squares
      const winningSquares = getAllWinningSquares(gameData);
      expect(winningSquares.length).toBe(3); // 3 unique squares win
      
      // Verify the squares that should win
      const expectedSquares = [
        { homeDigit: 7, awayDigit: 0, quarters: [1], quarterText: 'Q1' },
        { homeDigit: 4, awayDigit: 7, quarters: [2, 4], quarterText: 'Q2,Q4' },
        { homeDigit: 7, awayDigit: 4, quarters: [3], quarterText: 'Q3' }
      ];
      
      expectedSquares.forEach(expected => {
        const found = winningSquares.find(square => 
          square.homeDigit === expected.homeDigit && 
          square.awayDigit === expected.awayDigit
        );
        expect(found).toBeDefined();
        expect(found.quarters).toEqual(expected.quarters);
        expect(found.quarterText).toBe(expected.quarterText);
        expect(found.isColored).toBe(true);
      });
    });
  });
});
