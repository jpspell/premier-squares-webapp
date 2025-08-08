// Offline storage utilities for caching data when offline
import { openDB } from 'idb';

const DB_NAME = 'PremierSquaresDB';
const DB_VERSION = 1;

// Initialize IndexedDB
const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create object stores for different types of data
      if (!db.objectStoreNames.contains('contests')) {
        db.createObjectStore('contests', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('gameData')) {
        db.createObjectStore('gameData', { keyPath: 'eventId' });
      }
      if (!db.objectStoreNames.contains('games')) {
        db.createObjectStore('games', { keyPath: 'id' });
      }
    },
  });
};

// Store contest data
export const storeContestData = async (contestId, data) => {
  try {
    const db = await initDB();
    await db.put('contests', {
      id: contestId,
      data,
      timestamp: Date.now()
    });
    
    // Also store in localStorage as backup
    localStorage.setItem(`contest_${contestId}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Failed to store contest data:', error);
  }
};

// Retrieve contest data
export const getContestData = async (contestId) => {
  try {
    // Try IndexedDB first
    const db = await initDB();
    const result = await db.get('contests', contestId);
    
    if (result) {
      return result.data;
    }
    
    // Fallback to localStorage
    const localStorageData = localStorage.getItem(`contest_${contestId}`);
    if (localStorageData) {
      const parsed = JSON.parse(localStorageData);
      return parsed.data;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to retrieve contest data:', error);
    return null;
  }
};

// Store game data
export const storeGameData = async (eventId, data) => {
  try {
    const db = await initDB();
    await db.put('gameData', {
      eventId,
      data,
      timestamp: Date.now()
    });
    
    // Also store in localStorage as backup
    localStorage.setItem(`game_${eventId}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Failed to store game data:', error);
  }
};

// Retrieve game data
export const getGameData = async (eventId) => {
  try {
    // Try IndexedDB first
    const db = await initDB();
    const result = await db.get('gameData', eventId);
    
    if (result) {
      return result.data;
    }
    
    // Fallback to localStorage
    const localStorageData = localStorage.getItem(`game_${eventId}`);
    if (localStorageData) {
      const parsed = JSON.parse(localStorageData);
      return parsed.data;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to retrieve game data:', error);
    return null;
  }
};

// Store all games list
export const storeAllGames = async (games) => {
  try {
    const db = await initDB();
    const tx = db.transaction('games', 'readwrite');
    const store = tx.objectStore('games');
    
    // Clear existing data
    await store.clear();
    
    // Store new data
    for (const game of games) {
      await store.put({
        id: game.id,
        data: game,
        timestamp: Date.now()
      });
    }
    
    // Also store in localStorage as backup
    localStorage.setItem('all_games', JSON.stringify({
      games,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Failed to store all games:', error);
  }
};

// Retrieve all games
export const getAllGames = async () => {
  try {
    // Try IndexedDB first
    const db = await initDB();
    const allGames = await db.getAll('games');
    
    if (allGames.length > 0) {
      return allGames.map(item => item.data);
    }
    
    // Fallback to localStorage
    const localStorageData = localStorage.getItem('all_games');
    if (localStorageData) {
      const parsed = JSON.parse(localStorageData);
      return parsed.games;
    }
    
    return [];
  } catch (error) {
    console.error('Failed to retrieve all games:', error);
    return [];
  }
};

// Check if data is stale (older than 5 minutes)
export const isDataStale = (timestamp, maxAge = 5 * 60 * 1000) => {
  return Date.now() - timestamp > maxAge;
};

// Clear old data
export const clearOldData = async (maxAge = 24 * 60 * 60 * 1000) => {
  try {
    const db = await initDB();
    const stores = ['contests', 'gameData', 'games'];
    
    for (const storeName of stores) {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const allData = await store.getAll();
      
      for (const item of allData) {
        if (isDataStale(item.timestamp, maxAge)) {
          await store.delete(item.id || item.eventId);
        }
      }
    }
    
    // Clear old localStorage data
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith('contest_') || key.startsWith('game_') || key === 'all_games') {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (isDataStale(data.timestamp, maxAge)) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          // If parsing fails, remove the item
          localStorage.removeItem(key);
        }
      }
    }
  } catch (error) {
    console.error('Failed to clear old data:', error);
  }
};
