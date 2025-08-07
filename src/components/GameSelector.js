import React, { useState, useEffect } from 'react';
import { getAllNFLGames, createSquaresGame } from '../services/gameService';

function GameSelector({ onGameSelect }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [costPerSquare, setCostPerSquare] = useState(10);

  useEffect(() => {
    async function fetchGames() {
      try {
        setLoading(true);
        const gamesData = await getAllNFLGames();
        setGames(gamesData);
      } catch (err) {
        setError('Failed to fetch games');
        console.error('Error fetching games:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchGames();
  }, []);

  const handleGameChange = (event) => {
    const eventId = event.target.value;
    setSelectedEventId(eventId);
  };

  const handleSquareCostChange = (event) => {
    const value = parseInt(event.target.value) || 0;
    setCostPerSquare(value);
  };

  const handleGoClick = async () => {
    if (selectedEventId) {
      try {
        const result = await createSquaresGame(selectedEventId, costPerSquare);
        
        // Extract the contest ID from the response
        const contestId = result.id || result._id || result.contestId || result.documentId;
        
        if (!contestId) {
          setError('Failed to create contest. Please try again.');
          return;
        }
        
        // Call the parent callback with the result and contest ID
        if (onGameSelect) {
          onGameSelect(selectedEventId, costPerSquare, contestId);
        }
      } catch (error) {
        setError('Failed to create contest. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="game-selector">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading games...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="game-selector">
        <div className="error-text">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="game-selector">
      <div className="input-row">
        <div className="left-column">
          <h1 className="app-title">Premier Squares</h1>
          <div className="dropdown-container">
            <select 
              value={selectedEventId} 
              onChange={handleGameChange}
              className="game-dropdown"
            >
              <option value="">Select a game...</option>
              {games.map(game => (
                <option key={game.id} value={game.id}>
                  {game.awayTeam} @ {game.homeTeam} - {game.estTime}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="right-column">
          <label htmlFor="squareCost" className="cost-label">
            Cost per square
          </label>
          <div className="cost-input-container">
            <div className="cost-input-wrapper">
              <span className="currency-symbol">$</span>
              <input
                type="number"
                id="squareCost"
                value={costPerSquare}
                onChange={handleSquareCostChange}
                min="1"
                max="1000"
                className="cost-input"
                placeholder="10"
              />
            </div>
          </div>
        </div>
      </div>
      <button 
        onClick={handleGoClick}
        disabled={!selectedEventId}
        className="go-button"
      >
        Enter Names
      </button>
    </div>
  );
}

export default GameSelector;
