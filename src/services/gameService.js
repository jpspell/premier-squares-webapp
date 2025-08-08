import { contestAPI } from './apiService';
import { reportError } from '../utils/errorReporter';
import { storeGameData, getGameData, storeAllGames, getAllGames } from '../utils/offlineStorage';

// Service for fetching NFL game data from ESPN API
export async function getNFLGameData(eventId) {
  try {
    const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`);
    const data = await response.json();
    
    // Find the specific event by ID
    const event = data.events?.find(event => event.id === eventId);
    
    if (!event) {
      throw new Error(`Game with ID ${eventId} not found`);
    }
    
    // Extract team names and scores
    const teams = event.competitions?.[0]?.competitors || [];
    const homeTeam = teams.find(team => team.homeAway === 'home');
    const awayTeam = teams.find(team => team.homeAway === 'away');
    
    // Extract line scores (quarter-by-quarter scoring)
    const homeLineScore = homeTeam?.linescores || [];
    const awayLineScore = awayTeam?.linescores || [];
    
    // Get current score
    const homeScore = homeTeam?.score || '0';
    const awayScore = awayTeam?.score || '0';
    
    // Get team names
    const homeTeamName = homeTeam?.team?.name || 'Unknown';
    const awayTeamName = awayTeam?.team?.name || 'Unknown';
    
    // Get team abbreviations
    const homeTeamAbbr = homeTeam?.team?.abbreviation || 'UNK';
    const awayTeamAbbr = awayTeam?.team?.abbreviation || 'UNK';
    
    // Get game status, clock, and period from the correct path
    const gameStatus = event.status?.type?.name || 'unknown';
    const clock = event.status?.displayClock || '';
    const period = event.status?.period || 0;
    const periodText = event.status?.type?.description || event.status?.type?.shortDetail || '';
    
    const gameData = {
      homeTeam: {
        name: homeTeamName,
        abbreviation: homeTeamAbbr,
        score: homeScore,
        lineScore: homeLineScore
      },
      awayTeam: {
        name: awayTeamName,
        abbreviation: awayTeamAbbr,
        score: awayScore,
        lineScore: awayLineScore
      },
      gameStatus: gameStatus,
      clock: clock,
      period: period,
      periodText: periodText,
      eventId: eventId
    };
    
    // Store successful response for offline use
    await storeGameData(eventId, gameData);
    
    return gameData;
    
  } catch (error) {
    reportError(error, 'network', { operation: 'getNFLGameData', eventId });
    
    // Try to get cached data if network request fails
    const cachedData = await getGameData(eventId);
    if (cachedData) {
      // Add a flag to indicate this is cached data
      const offlineData = {
        ...cachedData,
        _isOffline: true,
        _cachedAt: Date.now()
      };
      return offlineData;
    }
    
    return null;
  }
}

// Service for fetching all NFL games from ESPN API
export async function getAllNFLGames() {
  try {
    const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');
    const data = await response.json();
    
    if (!data.events) {
      return [];
    }
    
    // Transform events to a simpler format for the dropdown
    const games = data.events.map(event => {
      const teams = event.competitions?.[0]?.competitors || [];
      const homeTeam = teams.find(team => team.homeAway === 'home');
      const awayTeam = teams.find(team => team.homeAway === 'away');
      
      // Convert UTC time to EST
      const gameDate = new Date(event.date);
      const estTime = gameDate.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      return {
        id: event.id,
        name: event.name,
        shortName: event.shortName,
        date: event.date,
        estTime: estTime,
        homeTeam: homeTeam?.team?.name || 'Unknown',
        awayTeam: awayTeam?.team?.name || 'Unknown',
        status: event.status?.type?.description || 'Scheduled'
      };
    });
    
    // Store successful response for offline use
    await storeAllGames(games);
    
    return games;
    
  } catch (error) {
    reportError(error, 'network', { operation: 'getAllNFLGames' });
    
    // Try to get cached data if network request fails
    const cachedGames = await getAllGames();
    if (cachedGames.length > 0) {
      // Add a flag to indicate this is cached data
      const offlineGames = cachedGames.map(game => ({
        ...game,
        _isOffline: true,
        _cachedAt: Date.now()
      }));
      return offlineGames;
    }
    
    return [];
  }
}

// Service for creating a new squares game
export async function createSquaresGame(eventId, costPerSquare) {
  try {
    return await contestAPI.createContest(eventId, costPerSquare);
  } catch (error) {
    reportError(error, 'server', { operation: 'createSquaresGame', eventId, costPerSquare });
    throw error;
  }
}
