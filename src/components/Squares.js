import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { contestAPI } from '../services/apiService';
import { getNFLGameData } from '../services/gameService';
import { reportError } from '../utils/errorReporter';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import NetworkStatus from './NetworkStatus';

// HTML sanitization function to prevent XSS on user names
const sanitizeHtml = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

function Squares() {
  const { documentId } = useParams();
  const [gameData, setGameData] = useState(null);
  const [names, setNames] = useState({});
  const [eventId, setEventId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contestStatus, setContestStatus] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [offlineData, setOfflineData] = useState(null);
  const { isOnline } = useNetworkStatus();

    // Fetch contest data and names
  useEffect(() => {
    const fetchContestData = async () => {
      try {
        const data = await contestAPI.getContest(documentId);
        
        // Check if this is offline data
        if (data._isOffline) {
          setIsOffline(true);
          setOfflineData(data);
        }
           
        // Store contest status for reference
        const status = data.contest?.status || data.status;
        setContestStatus(status);
           
        const contestNames = data.contest?.names || data.names || [];
           
        // Extract eventId from contest data
        const contestEventId = data.contest?.eventId || data.eventId;
           
        if (contestEventId) {
          setEventId(contestEventId);
        } else {
          reportError(new Error('No eventId found in contest data'), 'validation', { contestId: documentId });
          setError("No event ID found in contest data");
          setLoading(false);
          return;
        }
           
        // Convert array to object with 1-based indexing
        const namesObject = {};
        contestNames.forEach((name, index) => {
          namesObject[index + 1] = name;
        });
           
        setNames(namesObject);
      } catch (err) {
        reportError(err, 'network', { operation: 'fetchContestData', contestId: documentId });
        setError("Failed to fetch contest data");
        setLoading(false);
      }
    };

    if (documentId) {
      fetchContestData();
    }
  }, [documentId]);

  useEffect(() => {
    if (!eventId) return; // Don't fetch game data until we have the eventId

    async function fetchGameData(showLoading = true) {
      try {
        if (showLoading) {
          setLoading(true);
        }
        const data = await getNFLGameData(eventId);
        
        if (data) {
          // Check if this is offline data
          if (data._isOffline) {
            setIsOffline(true);
            setOfflineData(data);
          }
          
          // Transform the API data to match our expected format
          const transformedData = {
             homeTeam: {
               name: data.homeTeam.name,
               score: parseInt(data.homeTeam.score),
               lineScore: data.homeTeam.lineScore.map(scoreObj => parseInt(scoreObj.value) || 0)
             },
             awayTeam: {
               name: data.awayTeam.name,
               score: parseInt(data.awayTeam.score),
               lineScore: data.awayTeam.lineScore.map(scoreObj => parseInt(scoreObj.value) || 0)
             },
             currentPeriod: data.period,
             clock: data.clock,
             gameStatus: data.gameStatus
           };
           
          setGameData(transformedData);
        } else {
          reportError(new Error('No game data returned from API'), 'server', { eventId });
          if (showLoading) {
            setError("Failed to fetch game data");
          }
        }
      } catch (err) {
        reportError(err, 'network', { operation: 'fetchGameData', eventId });
        if (showLoading) {
          setError(err.message);
        }
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    }

    // Initial fetch with loading indicator
    fetchGameData(true);

    // Set up automatic refresh every 2 minutes without loading indicator
    const intervalId = setInterval(() => {
      fetchGameData(false);
    }, 120000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [eventId]);

  // Function to get the last digit of a number
  const getLastDigit = (num) => num % 10;

  // Function to highlight the last digit in a score
  const highlightLastDigit = (score) => {
    const scoreStr = score.toString();
    const lastDigit = scoreStr.slice(-1);
    const otherDigits = scoreStr.slice(0, -1);
    
    return (
      <>
        {otherDigits}<span style={{ color: '#FFD700', fontWeight: 'bold', textShadow: '0 0 2px rgba(0,0,0,0.5)' }}>{lastDigit}</span>
      </>
    );
  };

  // Function to calculate cumulative scores for a period
  const getCumulativeScores = (period) => {
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

  // Function to determine if a quarter is final (completed)
  const isQuarterFinal = (quarter) => {
    // A quarter is final if the current period has moved beyond it
    // OR if the game has ended
    return gameData.currentPeriod > quarter || 
           gameData.gameStatus === 'final' || 
           gameData.gameStatus === 'complete';
  };

  // Function to determine if a square should be colored and which quarters it won
  const getSquareInfo = (homeDigit, awayDigit) => {
    const winningQuarters = [];
    const finalQuarters = [];
    const ongoingQuarters = [];
    
    // Check each period to see if this square should be colored
    for (let period = 1; period <= gameData.currentPeriod; period++) {
      const scores = getCumulativeScores(period);
      const homeLastDigit = getLastDigit(scores.home);
      const awayLastDigit = getLastDigit(scores.away);
      
      // If this square matches the last digits for this period, add it to winning quarters
      if (homeLastDigit === homeDigit && awayLastDigit === awayDigit) {
        winningQuarters.push(period);
        
        // Categorize as final or ongoing
        if (isQuarterFinal(period)) {
          finalQuarters.push(period);
        } else {
          ongoingQuarters.push(period);
        }
      }
    }
    
    if (winningQuarters.length > 0) {
      return { 
        isColored: true, 
        quarters: winningQuarters,
        finalQuarters: finalQuarters,
        ongoingQuarters: ongoingQuarters,
        quarterText: winningQuarters.map(q => `Q${q}`).join(','),
        hasOngoingQuarter: ongoingQuarters.length > 0
      };
    }
    
    return { isColored: false, quarters: [], finalQuarters: [], ongoingQuarters: [], quarterText: null, hasOngoingQuarter: false };
  };



  // If there's an error, show it immediately
  if (error) {
    return (
      <div className="App">
        <div className="error-container">
          <div className="error-text">Error: {error}</div>
        </div>
      </div>
    );
  }

  // If contest has not started (status is 'new'), show message
  if (contestStatus === 'new') {
    return (
      <div className="App">
        <div className="error-container">
          <div className="error-text">Contest has not started!</div>
        </div>
      </div>
    );
  }

  if (loading || Object.keys(names).length === 0 || !eventId) {
    return (
      <div className="App">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading game data...</div>
        </div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="App">
        <div className="no-data-container">
          <div className="no-data-text">No game data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <NetworkStatus />
      {isOffline && (
        <div className="offline-banner">
          <div className="offline-message">
            <span className="offline-icon">📡</span>
            You're viewing cached data. Some features may be limited.
            {offlineData && (
              <span className="cache-time">
                Cached: {new Date(offlineData._cachedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      )}
      <div className="grid-container">
        {/* Main grid area */}
        <div className="grid-area">
          {/* Home team above grid */}
          <div className="home-team-header">
            <div className="team-display">
              <span className="team-name">{gameData.homeTeam.name}</span>
              <span className="score">{gameData.homeTeam.score}</span>
            </div>
          </div>
          
          {/* Grid content with away team sidebar and grid */}
          <div className="grid-content">
            {/* Away team on the left */}
            <div className="away-team-sidebar">
              <div className="team-display">
                <span className="team-name">{gameData.awayTeam.name}</span>
                <span className="score">{gameData.awayTeam.score}</span>
              </div>
            </div>
            
            <div className="grid-wrapper">
              {/* Top row headers (column numbers) */}
              <div className="header-row">
                <div className="corner-cell"></div>
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={`col-${i}`} className="header-cell">
                    {i}
                  </div>
                ))}
              </div>
              
              {/* Grid with row headers */}
              <div className="grid-with-headers">
                {Array.from({ length: 10 }, (_, rowIndex) => (
                  <div key={`row-${rowIndex}`} className="grid-row">
                    {/* Row header */}
                    <div className="header-cell">
                      {rowIndex}
                    </div>
                    {/* Grid items for this row */}
                    {Array.from({ length: 10 }, (_, colIndex) => {
                      const gridIndex = rowIndex * 10 + colIndex + 1;
                      const homeDigit = colIndex; // Column represents home team digit
                      const awayDigit = rowIndex;  // Row represents away team digit
                      const squareInfo = getSquareInfo(homeDigit, awayDigit);
                      
                      return (
                        <div 
                          key={gridIndex} 
                          className={`grid-item ${squareInfo.isColored ? 'colored-square' : ''}`}
                        >
                          <div className="name">{names[gridIndex] ? sanitizeHtml(names[gridIndex]) : `Name ${gridIndex}`}</div>
                          {squareInfo.isColored && (
                            <div className={`quarter-indicator ${squareInfo.hasOngoingQuarter ? 'ongoing' : 'final'}`}>
                              {squareInfo.quarterText}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Game Status - moved inside grid-area at bottom */}
          <div className="game-status">
            {gameData.gameStatus !== 'pre' && (
              <>
                <span className="quarter">Q{Math.max(1, gameData.currentPeriod || 1)}</span>
                <span className="clock">{gameData.clock || '00:00'}</span>
              </>
            )}
            <div className="quarter-scores">
              {[1, 2, 3, 4].map(quarter => {
                const scores = getCumulativeScores(quarter);
                const isActive = quarter <= (gameData.currentPeriod || 0);
                return (
                  <span key={quarter} className={`quarter-score ${isActive ? 'active' : 'inactive'}`}>
                    Q{quarter}: {gameData.homeTeam.name} {highlightLastDigit(scores.home)}-{highlightLastDigit(scores.away)} {gameData.awayTeam.name}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Squares;
