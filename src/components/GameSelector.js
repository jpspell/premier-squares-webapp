import React, { useState, useEffect } from 'react';
import { getAllNFLGames, createSquaresGame } from '../services/gameService';
import { validateEventId, validateCostPerSquare } from '../utils/validation';
import { reportError } from '../utils/errorReporter';

function GameSelector({ onGameSelect }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [costPerSquare, setCostPerSquare] = useState(10);
  const [costInputValue, setCostInputValue] = useState('10');
  const [payoutMode, setPayoutMode] = useState('standard'); // 'standard' or 'custom'
  const [customPayouts, setCustomPayouts] = useState({
    quarter1: 25,
    quarter2: 25,
    quarter3: 25,
    quarter4: 25
  });

  useEffect(() => {
    async function fetchGames() {
      try {
        setLoading(true);
        const gamesData = await getAllNFLGames();
        
        // Filter out games that have already started
        // Only show games with status "Scheduled" 
        const upcomingGames = gamesData.filter(game => {
          const status = game.status || '';
          return status.toLowerCase() === 'scheduled';
        });
        
        setGames(upcomingGames);
      } catch (err) {
        setError('Failed to fetch games');
        reportError(err, 'network', { operation: 'fetchGames' });
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
    const inputValue = event.target.value;
    
    // Only allow digits (no decimals, no negative signs, no letters)
    const numbersOnlyRegex = /^\d*$/;
    
    if (!numbersOnlyRegex.test(inputValue)) {
      // If input contains invalid characters, don't update anything
      return;
    }
    
    // If input is empty, set cost to 0
    if (!inputValue || inputValue.trim() === '') {
      setCostInputValue('');
      setCostPerSquare(0);
      return;
    }
    
    // Remove leading zeros and convert to number
    const numericValue = parseInt(inputValue, 10);
    
    // If the result is 0 or NaN, handle appropriately
    if (isNaN(numericValue) || numericValue === 0) {
      setCostInputValue('0');
      setCostPerSquare(0);
      return;
    }
    
    // Convert back to string without leading zeros
    const cleanedValue = numericValue.toString();
    
    // Update both the display value and numeric value
    setCostInputValue(cleanedValue);
    setCostPerSquare(numericValue);
  };

  const handlePayoutModeChange = (mode) => {
    setPayoutMode(mode);
    if (mode === 'standard') {
      // Reset to equal distribution
      setCustomPayouts({
        quarter1: 25,
        quarter2: 25,
        quarter3: 25,
        quarter4: 25
      });
    }
  };

  const handleCustomPayoutChange = (quarter, value) => {
    const newPayouts = { ...customPayouts };
    newPayouts[quarter] = value;
    setCustomPayouts(newPayouts);
  };

  const getTotalPercentage = () => {
    return Object.values(customPayouts).reduce((sum, value) => sum + value, 0);
  };

  const getTotalPot = () => {
    return costPerSquare * 100;
  };
  
  const getQuarterPayout = (quarter) => {
    const percentage = payoutMode === 'standard' ? 25 : customPayouts[quarter];
    return Math.round((getTotalPot() * percentage) / 100);
  };

  const handleGoClick = async () => {
    // Validate event ID
    const eventValidation = validateEventId(selectedEventId);
    if (!eventValidation.isValid) {
      setError(eventValidation.message);
      return;
    }

    // Validate cost per square
    const costValidation = validateCostPerSquare(costPerSquare);
    if (!costValidation.isValid) {
      setError(costValidation.message);
      return;
    }

    // Calculate quarter prizes
    const quarterPrizes = {
      quarter1: getQuarterPayout('quarter1'),
      quarter2: getQuarterPayout('quarter2'),
      quarter3: getQuarterPayout('quarter3'),
      quarter4: getQuarterPayout('quarter4'),
      totalPot: getTotalPot(),
      payoutMode: payoutMode
    };

    try {
      const result = await createSquaresGame(eventValidation.value, costValidation.value, quarterPrizes);
      
      // Extract the contest ID from the response
      const contestId = result.id || result._id || result.contestId || result.documentId;
      
      if (!contestId) {
        setError('Failed to create contest. Please try again.');
        return;
      }
      
      // Call the parent callback with the result and contest ID
      if (onGameSelect) {
        onGameSelect(eventValidation.value, costValidation.value, contestId);
      }
    } catch (error) {
      setError('Failed to create contest. Please try again.');
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
      <div className="game-selection-row">
        <div className="game-title-section">
          <h1 className="app-title">Premier Squares</h1>
          <select 
            value={selectedEventId} 
            onChange={handleGameChange}
            className="game-dropdown-full"
          >
            <option value="">Select a game...</option>
            {games.map(game => (
              <option key={game.id} value={game.id}>
                {game.awayTeam} @ {game.homeTeam} - {game.estTime}
              </option>
            ))}
          </select>
        </div>
        <div className="cost-section">
          <label htmlFor="squareCost" className="cost-label">
            Cost per square
          </label>
          <div className="cost-input-container">
            <div className="cost-input-wrapper">
              <span className="currency-symbol">$</span>
                              <input
                  type="number"
                  id="squareCost"
                  value={costInputValue}
                  onChange={handleSquareCostChange}
                  min="1"
                  max="10000"
                  className="cost-input"
                  placeholder="10"
                />
            </div>
          </div>
        </div>
      </div>
      
      {/* Payout Configuration Section */}
      <div className="payout-section">
        <h3 className="payout-title">Prize Distribution</h3>
        <div className="payout-mode-selector">
          <button 
            className={`payout-mode-btn ${payoutMode === 'standard' ? 'active' : ''}`}
            onClick={() => handlePayoutModeChange('standard')}
          >
            Standard (Equal)
          </button>
          <button 
            className={`payout-mode-btn ${payoutMode === 'custom' ? 'active' : ''}`}
            onClick={() => handlePayoutModeChange('custom')}
          >
            Custom
          </button>
        </div>
        
        {costPerSquare > 0 && (
          <div className="payout-preview">
            <div className="total-pot">
              Total Pot: <span className="pot-amount">${getTotalPot().toLocaleString()}</span>
            </div>
            
            {payoutMode === 'custom' && (
              <div className="custom-payout-controls">
                <div className="payout-total-display">
                  <span className="total-label">Total Allocated:</span>
                  <span className={`total-percentage ${getTotalPercentage() > 100 ? 'over-limit' : ''}`}>
                    {getTotalPercentage()}%
                  </span>
                  <span className="remaining-amount">
                    (${Math.round((getTotalPot() * (100 - getTotalPercentage())) / 100).toLocaleString()} remaining)
                  </span>
                </div>
                <div className="quarter-sliders">
                  {['quarter1', 'quarter2', 'quarter3', 'quarter4'].map((quarter, index) => (
                    <div key={quarter} className="quarter-slider">
                      <label className="quarter-label">
                        Q{index + 1}
                        <span className="quarter-percentage">{customPayouts[quarter]}%</span>
                        <span className="quarter-amount">${getQuarterPayout(quarter).toLocaleString()}</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={customPayouts[quarter]}
                        onChange={(e) => handleCustomPayoutChange(quarter, parseInt(e.target.value))}
                        className="payout-slider"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {payoutMode === 'standard' && (
              <div className="standard-payout-display">
                <div className="quarter-payouts">
                  {[1, 2, 3, 4].map(quarter => (
                    <div key={quarter} className="quarter-payout">
                      <span className="quarter-name">Q{quarter}</span>
                      <span className="quarter-amount">${getQuarterPayout(`quarter${quarter}`).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <button 
        onClick={handleGoClick}
        disabled={
          !selectedEventId || 
          !costPerSquare || 
          costPerSquare <= 0 ||
          (payoutMode === 'custom' && getTotalPercentage() > 100)
        }
        className="go-button"
      >
        Enter Names
      </button>
    </div>
  );
}

export default GameSelector;
