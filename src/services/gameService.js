import { contestAPI } from './apiService';
import { reportError } from '../utils/errorReporter';
import { storeGameData, getGameData, storeAllGames, getAllGames } from '../utils/offlineStorage';

// Service for fetching NFL game data from ESPN API
export async function getNFLGameData(eventId) {
  try {
    const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${eventId}`);
    const data = await response.json();
    
    if (!data.boxscore) {
      throw new Error(`Game with ID ${eventId} not found`);
    }
    
    // Extract team data from boxscore (this gives us team details but no homeAway)
    const boxscoreTeams = data.boxscore.teams || [];
    
    if (boxscoreTeams.length < 2) {
      throw new Error('Insufficient team data in boxscore');
    }
    
    // Extract line scores from the play-by-play data if available
    // If the linescore is not directly available, we'll need to calculate it from play-by-play
    let homeLineScore = [];
    let awayLineScore = [];
    let homeScore = '0';
    let awayScore = '0';
    let gameStatus = 'unknown';
    let clock = '';
    let period = 0;
    
    // Check if there's header data with linescore
    if (data.header && data.header.competitions && data.header.competitions[0]) {
      const competition = data.header.competitions[0];
      const competitors = competition.competitors || [];
      
      const headerHomeTeam = competitors.find(team => team.homeAway === 'home');
      const headerAwayTeam = competitors.find(team => team.homeAway === 'away');
      
      if (headerHomeTeam && headerAwayTeam) {
        homeScore = headerHomeTeam.score || '0';
        awayScore = headerAwayTeam.score || '0';
        
        // Transform linescores to the expected format
        homeLineScore = (headerHomeTeam.linescores || []).map(quarter => ({
          value: quarter.displayValue || '0'
        }));
        awayLineScore = (headerAwayTeam.linescores || []).map(quarter => ({
          value: quarter.displayValue || '0'
        }));
      }
      
      // Get game status and clock
      if (competition.status) {
        gameStatus = competition.status.type?.name || 'unknown';
        clock = competition.status.displayClock || '';
        
        // For completed games, set period to 4 (all quarters done)
        if (gameStatus === 'STATUS_FINAL') {
          period = 4;
        } else {
          // For ongoing games, try to get the current period
          period = competition.status.period || 0;
        }
      }
    }
    
    // If no header data, check if there's a gameHeader or other structure
    if (!homeLineScore.length && data.gameHeader && data.gameHeader.competitions && data.gameHeader.competitions[0]) {
      const competition = data.gameHeader.competitions[0];
      const competitors = competition.competitors || [];
      
      const headerHomeTeam = competitors.find(team => team.homeAway === 'home');
      const headerAwayTeam = competitors.find(team => team.homeAway === 'away');
      
      if (headerHomeTeam && headerAwayTeam) {
        homeScore = headerHomeTeam.score || '0';
        awayScore = headerAwayTeam.score || '0';
        
        // Transform linescores to the expected format
        homeLineScore = (headerHomeTeam.linescores || []).map(quarter => ({
          value: quarter.displayValue || '0'
        }));
        awayLineScore = (headerAwayTeam.linescores || []).map(quarter => ({
          value: quarter.displayValue || '0'
        }));
      }
      
      // Get game status and clock
      if (competition.status) {
        gameStatus = competition.status.type?.name || 'unknown';
        clock = competition.status.displayClock || '';
        
        // For completed games, set period to 4 (all quarters done)
        if (gameStatus === 'STATUS_FINAL') {
          period = 4;
        } else {
          // For ongoing games, try to get the current period
          period = competition.status.period || 0;
        }
      }
    }
    
    // If we don't have linescore data from header, try to extract from play-by-play
    if (homeLineScore.length === 0) {
      // Try the comprehensive play-by-play extraction using header team IDs
      let homeTeamId = null;
      let awayTeamId = null;
      
      if (data.header?.competitions?.[0]?.competitors) {
        const competitors = data.header.competitions[0].competitors;
        const headerHome = competitors.find(team => team.homeAway === 'home');
        const headerAway = competitors.find(team => team.homeAway === 'away');
        homeTeamId = headerHome?.team?.id;
        awayTeamId = headerAway?.team?.id;
      }
      
      const playByPlayScores = calculateLineScoreFromPlays(data, homeTeamId, awayTeamId);
      if (playByPlayScores.home.length > 0) {
        homeLineScore = playByPlayScores.home;
        awayLineScore = playByPlayScores.away;
        
        // Extract the final scores from the highest cumulative scores found
        if (playByPlayScores.home.some(q => parseInt(q.value) > 0) || playByPlayScores.away.some(q => parseInt(q.value) > 0)) {
          const totalHome = playByPlayScores.home.reduce((sum, quarter) => sum + parseInt(quarter.value), 0);
          const totalAway = playByPlayScores.away.reduce((sum, quarter) => sum + parseInt(quarter.value), 0);
          homeScore = totalHome.toString();
          awayScore = totalAway.toString();
        }
      } else if (data.drives && data.drives.previous && homeTeamId && awayTeamId) {
        // Fallback to the original drives method
        homeLineScore = calculateLineScoreFromDrives(data.drives.previous, homeTeamId);
        awayLineScore = calculateLineScoreFromDrives(data.drives.previous, awayTeamId);
      }
    }
    
    // Get team information by combining header (homeAway) and boxscore (detailed team info)
    let homeTeamName = 'Unknown';
    let awayTeamName = 'Unknown';
    let homeTeamAbbr = 'UNK';
    let awayTeamAbbr = 'UNK';
    
    // If we have header data with homeAway information
    if (data.header?.competitions?.[0]?.competitors) {
      const competitors = data.header.competitions[0].competitors;
      const headerHome = competitors.find(team => team.homeAway === 'home');
      const headerAway = competitors.find(team => team.homeAway === 'away');
      
      if (headerHome && headerAway) {
        homeTeamName = headerHome.team?.name || 'Unknown';
        awayTeamName = headerAway.team?.name || 'Unknown';
        homeTeamAbbr = headerHome.team?.abbreviation || 'UNK';
        awayTeamAbbr = headerAway.team?.abbreviation || 'UNK';
      }
    }
    
    // If we couldn't get team info from header, fall back to boxscore teams
    // (This is a fallback since boxscore doesn't specify homeAway)
    if (homeTeamName === 'Unknown' && boxscoreTeams.length >= 2) {
      homeTeamName = boxscoreTeams[0].team?.name || 'Unknown';
      awayTeamName = boxscoreTeams[1].team?.name || 'Unknown';
      homeTeamAbbr = boxscoreTeams[0].team?.abbreviation || 'UNK';
      awayTeamAbbr = boxscoreTeams[1].team?.abbreviation || 'UNK';
    }
    
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
      periodText: '',
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

// Helper function to calculate linescore from the comprehensive play-by-play data
function calculateLineScoreFromPlays(data, homeTeamId, awayTeamId) {
  const homeLineScore = [0, 0, 0, 0]; // Q1, Q2, Q3, Q4
  const awayLineScore = [0, 0, 0, 0]; // Q1, Q2, Q3, Q4
  
  // Look for play-by-play data in drives
  if (data.drives && data.drives.previous) {
    data.drives.previous.forEach(drive => {
      if (drive.plays) {
        drive.plays.forEach(play => {
          // Look for plays with scoring information
          if (play.homeScore !== undefined && play.awayScore !== undefined && 
              play.period && play.period.number && play.period.number <= 4) {
            
            const quarter = play.period.number - 1; // Convert to 0-based index
            const homeScore = parseInt(play.homeScore) || 0;
            const awayScore = parseInt(play.awayScore) || 0;
            
            // Track the highest score seen in each quarter (cumulative)
            homeLineScore[quarter] = Math.max(homeLineScore[quarter], homeScore);
            awayLineScore[quarter] = Math.max(awayLineScore[quarter], awayScore);
          }
        });
      }
    });
  }
  
  // Convert cumulative scores to per-quarter scores
  const homeQuarterScores = [homeLineScore[0]]; // Q1 is just the Q1 total
  const awayQuarterScores = [awayLineScore[0]]; // Q1 is just the Q1 total
  
  for (let i = 1; i < 4; i++) {
    // Each quarter score is the difference from the previous quarter
    homeQuarterScores[i] = homeLineScore[i] - homeLineScore[i - 1];
    awayQuarterScores[i] = awayLineScore[i] - awayLineScore[i - 1];
  }
  
  return {
    home: homeQuarterScores.map(score => ({ value: Math.max(0, score).toString() })),
    away: awayQuarterScores.map(score => ({ value: Math.max(0, score).toString() }))
  };
}

// Helper function to calculate linescore from drives/play-by-play data
function calculateLineScoreFromDrives(drives, teamId) {
  const quarterScores = [0, 0, 0, 0]; // Q1, Q2, Q3, Q4
  
  // Iterate through drives to find scoring plays
  drives.forEach(drive => {
    if (drive.team && drive.team.id === teamId && drive.result && drive.isScore) {
      // Find scoring plays in this drive
      const plays = drive.plays || [];
      plays.forEach(play => {
        if (play.scoringPlay && play.period && play.period.number <= 4) {
          const quarter = play.period.number - 1; // Convert to 0-based index
          const homeScore = play.homeScore || 0;
          const awayScore = play.awayScore || 0;
          
          // Calculate the score for this quarter by finding the difference
          // This is a simplified approach - in reality, we'd need to track cumulative scores
          if (teamId === drive.team.id) {
            quarterScores[quarter] = Math.max(quarterScores[quarter], 
              teamId === play.homeTeam?.id ? homeScore : awayScore);
          }
        }
      });
    }
  });
  
  // Convert to the expected format with value property
  return quarterScores.map(score => ({ value: score.toString() }));
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
export async function createSquaresGame(eventId, costPerSquare, quarterPrizes) {
  try {
    return await contestAPI.createContest(eventId, costPerSquare, quarterPrizes);
  } catch (error) {
    reportError(error, 'server', { operation: 'createSquaresGame', eventId, costPerSquare, quarterPrizes });
    throw error;
  }
}
