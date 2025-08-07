import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import { getLastDigit, getCumulativeScores, getSquareInfo } from './utils/coloringLogic';

// Mock the config module
jest.mock('./config', () => ({
  EVENT_ID: 'test-event-id',
  names: {
    1: 'Player 1', 2: 'Player 2', 3: 'Player 3', 4: 'Player 4', 5: 'Player 5',
    6: 'Player 6', 7: 'Player 7', 8: 'Player 8', 9: 'Player 9', 10: 'Player 10',
    11: 'Player 11', 12: 'Player 12', 13: 'Player 13', 14: 'Player 14', 15: 'Player 15',
    16: 'Player 16', 17: 'Player 17', 18: 'Player 18', 19: 'Player 19', 20: 'Player 20',
    21: 'Player 21', 22: 'Player 22', 23: 'Player 23', 24: 'Player 24', 25: 'Player 25',
    26: 'Player 26', 27: 'Player 27', 28: 'Player 28', 29: 'Player 29', 30: 'Player 30',
    31: 'Player 31', 32: 'Player 32', 33: 'Player 33', 34: 'Player 34', 35: 'Player 35',
    36: 'Player 36', 37: 'Player 37', 38: 'Player 38', 39: 'Player 39', 40: 'Player 40',
    41: 'Player 41', 42: 'Player 42', 43: 'Player 43', 44: 'Player 44', 45: 'Player 45',
    46: 'Player 46', 47: 'Player 47', 48: 'Player 48', 49: 'Player 49', 50: 'Player 50',
    51: 'Player 51', 52: 'Player 52', 53: 'Player 53', 54: 'Player 54', 55: 'Player 55',
    56: 'Player 56', 57: 'Player 57', 58: 'Player 58', 59: 'Player 59', 60: 'Player 60',
    61: 'Player 61', 62: 'Player 62', 63: 'Player 63', 64: 'Player 64', 65: 'Player 65',
    66: 'Player 66', 67: 'Player 67', 68: 'Player 68', 69: 'Player 69', 70: 'Player 70',
    71: 'Player 71', 72: 'Player 72', 73: 'Player 73', 74: 'Player 74', 75: 'Player 75',
    76: 'Player 76', 77: 'Player 77', 78: 'Player 78', 79: 'Player 79', 80: 'Player 80',
    81: 'Player 81', 82: 'Player 82', 83: 'Player 83', 84: 'Player 84', 85: 'Player 85',
    86: 'Player 86', 87: 'Player 87', 88: 'Player 88', 89: 'Player 89', 90: 'Player 90',
    91: 'Player 91', 92: 'Player 92', 93: 'Player 93', 94: 'Player 94', 95: 'Player 95',
    96: 'Player 96', 97: 'Player 97', 98: 'Player 98', 99: 'Player 99', 100: 'Player 100'
  }
}));

// Mock fetch globally
global.fetch = jest.fn();

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



describe('Premier Squares App', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('Core Logic Functions', () => {

    describe('getLastDigit', () => {
      test('should return the last digit of a number', () => {
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
      });
    });

    describe('getCumulativeScores', () => {
      test('should calculate cumulative scores for a given period', () => {
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
    });
  });

  describe('Edge Cases and Error Handling', () => {

    test('should handle very large scores correctly', () => {
      const gameData = createMockGameData(1234567, 987654, 1, [1234567], [987654]);
      
      const square = getSquareInfo(gameData, 7, 4); // Last digits of 1234567 and 987654
      expect(square.isColored).toBe(true);
      expect(square.quarters).toEqual([1]);
    });

    test('should handle negative scores', () => {
      const gameData = createMockGameData(-10, -5, 1, [-10], [-5]);
      
      const square = getSquareInfo(gameData, 0, -5); // Last digits of -10 and -5
      expect(square.isColored).toBe(true);
      expect(square.quarters).toEqual([1]);
    });

    test('should handle decimal scores (should be converted to integers)', () => {
      // Note: In real implementation, scores should be integers
      // This test ensures the logic works even if decimals somehow get through
      const gameData = createMockGameData(10.5, 5.7, 1, [10.5], [5.7]);
      
      const square = getSquareInfo(gameData, 0.5, 5.7); // Last digits of 10.5 and 5.7
      expect(square.isColored).toBe(true);
      expect(square.quarters).toEqual([1]);
    });
  });

  describe('Real Game Scenarios', () => {

    test('should handle a typical NFL game scenario', () => {
      // Simulate a game where:
      // Q1: Home 7, Away 0
      // Q2: Home 14, Away 7  
      // Q3: Home 21, Away 14
      // Q4: Home 28, Away 21
      const gameData = createMockGameData(28, 21, 4, [7, 7, 7, 7], [0, 7, 7, 7]);
      
      // Test various squares
      expect(getSquareInfo(gameData, 7, 0).isColored).toBe(true); // Q1 winner
      expect(getSquareInfo(gameData, 4, 7).isColored).toBe(true); // Q2 winner
      expect(getSquareInfo(gameData, 1, 4).isColored).toBe(true); // Q3 winner
      expect(getSquareInfo(gameData, 8, 1).isColored).toBe(true); // Q4 winner
      expect(getSquareInfo(gameData, 0, 0).isColored).toBe(false); // Non-winner
    });

    test('should handle a high-scoring game', () => {
      // Simulate a high-scoring game
      const gameData = createMockGameData(45, 38, 4, [14, 10, 14, 7], [7, 14, 10, 7]);
      
      // Test squares that should win
      expect(getSquareInfo(gameData, 4, 7).isColored).toBe(true); // Q1: 14-7
      expect(getSquareInfo(gameData, 4, 1).isColored).toBe(true); // Q2: 24-21
      expect(getSquareInfo(gameData, 8, 1).isColored).toBe(true); // Q3: 38-31
      expect(getSquareInfo(gameData, 5, 8).isColored).toBe(true); // Q4: 45-38
    });

    test('should handle a defensive game', () => {
      // Simulate a low-scoring defensive game
      const gameData = createMockGameData(13, 10, 4, [3, 0, 7, 3], [0, 7, 0, 3]);
      
      // Test squares that should win
      expect(getSquareInfo(gameData, 3, 0).isColored).toBe(true); // Q1: 3-0
      expect(getSquareInfo(gameData, 3, 7).isColored).toBe(true); // Q2: 3-7
      expect(getSquareInfo(gameData, 0, 7).isColored).toBe(true); // Q3: 10-7
      expect(getSquareInfo(gameData, 3, 0).isColored).toBe(true); // Q4: 13-10
    });
  });

  describe('Component Integration', () => {
    test('should render loading state initially', () => {
      fetch.mockImplementationOnce(() => 
        new Promise(() => {}) // Never resolves to keep loading
      );
      
      render(<App />);
      expect(screen.getByText('Loading game data...')).toBeInTheDocument();
    });

    test('should render error state when API fails', async () => {
      fetch.mockRejectedValueOnce(new Error('API Error'));
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });
    });

    test('should render game grid when data is available', async () => {
      const mockResponse = {
        events: [{
          id: 'test-event-id',
          competitions: [{
            competitors: [
              {
                homeAway: 'home',
                team: { name: 'Home Team', abbreviation: 'HOME' },
                score: '21',
                linescores: [{ value: '7' }, { value: '7' }, { value: '7' }]
              },
              {
                homeAway: 'away',
                team: { name: 'Away Team', abbreviation: 'AWAY' },
                score: '14',
                linescores: [{ value: '0' }, { value: '7' }, { value: '7' }]
              }
            ]
          }],
          status: {
            type: { name: 'STATUS_IN_PROGRESS', description: '3rd Quarter' },
            displayClock: '10:30',
            period: 3
          }
        }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Home Team')).toBeInTheDocument();
        expect(screen.getByText('Away Team')).toBeInTheDocument();
        expect(screen.getByText('21')).toBeInTheDocument();
        expect(screen.getByText('14')).toBeInTheDocument();
      });
    });
  });
});
