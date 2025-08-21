import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './BagBuilder.css';

const BagBuilder = () => {
  const navigate = useNavigate();
  const [bagPosition, setBagPosition] = useState(50); // percentage from left
  const [goldPieces, setGoldPieces] = useState([]);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(true);
  const [gameWon, setGameWon] = useState(false);
  const [keysPressed, setKeysPressed] = useState({});

  const BAG_WIDTH = window.innerWidth > 768 ? 160 : 120; // pixels (2x larger)
  const GOLD_SIZE = window.innerWidth > 768 ? 40 : 32; // pixels (2x larger)
  const GAME_WIDTH = window.innerWidth;
  const GAME_HEIGHT = window.innerHeight;
  const GOLD_SPAWN_RATE = 1500; // milliseconds
  const BASE_GOLD_FALL_SPEED = 15; // pixels per frame (base speed)
  const MAX_GOLD_FALL_SPEED = 100; // pixels per frame (2x speed)
  const SPEED_INCREASE_TARGET_SCORE = 200; // score at which speed reaches maximum

  // Calculate current fall speed based on score
  const getCurrentFallSpeed = useCallback(() => {
    if (score >= SPEED_INCREASE_TARGET_SCORE) {
      return MAX_GOLD_FALL_SPEED;
    }
    // Linear interpolation from base speed to max speed
    const speedRatio = score / SPEED_INCREASE_TARGET_SCORE;
    return BASE_GOLD_FALL_SPEED + (speedRatio * (MAX_GOLD_FALL_SPEED - BASE_GOLD_FALL_SPEED));
  }, [score]);

  // Handle keyboard input for smooth movement
  const handleKeyDown = useCallback((event) => {
    if (!gameActive) return;

    setKeysPressed(prev => ({
      ...prev,
      [event.key]: true
    }));
  }, [gameActive]);

  const handleKeyUp = useCallback((event) => {
    setKeysPressed(prev => ({
      ...prev,
      [event.key]: false
    }));
  }, []);

  // Spawn new gold pieces
  const spawnGold = useCallback(() => {
    if (!gameActive) return;

    const newGold = {
      id: Date.now() + Math.random(),
      x: Math.random() * (GAME_WIDTH - GOLD_SIZE),
      y: -GOLD_SIZE,
    };

    setGoldPieces(prev => [...prev, newGold]);
  }, [gameActive, GAME_WIDTH, GOLD_SIZE]);

  // Update bag position for smooth movement
  const updateBagPosition = useCallback(() => {
    if (!gameActive) return;

    setBagPosition(prev => {
      let newPosition = prev;
      const moveSpeed = 2; // pixels per frame for smooth movement
      
      // Account for bag being centered (transform: translateX(-50%))
      // So the bag's center position needs to be at least half the bag width from the left edge
      const minPosition = (BAG_WIDTH / 2 / GAME_WIDTH) * 100;
      const maxPosition = 100 - (BAG_WIDTH / 2 / GAME_WIDTH) * 100;

      if (keysPressed['ArrowLeft']) {
        newPosition = Math.max(minPosition, newPosition - moveSpeed);
      }
      if (keysPressed['ArrowRight']) {
        newPosition = Math.min(maxPosition, newPosition + moveSpeed);
      }

      return newPosition;
    });
  }, [gameActive, keysPressed, BAG_WIDTH, GAME_WIDTH]);

  // Update gold positions and check collisions
  const updateGame = useCallback(() => {
    if (!gameActive) return;

    const currentFallSpeed = getCurrentFallSpeed();

    setGoldPieces(prev => {
      const updated = prev.map(gold => ({
        ...gold,
        y: gold.y + currentFallSpeed
      }));

      // Check for collisions with bag
      // Account for bag being centered (transform: translateX(-50%))
      const bagCenterX = (bagPosition / 100) * GAME_WIDTH;
      const bagLeft = bagCenterX - (BAG_WIDTH / 2);
      const bagRight = bagCenterX + (BAG_WIDTH / 2);
      const bagTop = GAME_HEIGHT - 160; // Bag is positioned at bottom (adjusted for larger bag)
      const bagBottom = GAME_HEIGHT - 40;

      let scoreChanged = false;
      let newScore = score;
      let gameWonCheck = false;

      updated.forEach(gold => {
        const goldLeft = gold.x;
        const goldRight = gold.x + GOLD_SIZE;
        const goldTop = gold.y;
        const goldBottom = gold.y + GOLD_SIZE;

        // Check if gold is caught by bag
        if (goldBottom >= bagTop && goldTop <= bagBottom) {
          if (goldRight >= bagLeft && goldLeft <= bagRight) {
            // Gold caught!
            newScore += 10;
            scoreChanged = true;
            gold.caught = true;
            
            // Check if player won (reached 250 points)
            if (newScore >= 250) {
              gameWonCheck = true;
            }
          }
        }

        // Check if gold missed (fell below screen)
        if (gold.y > GAME_HEIGHT && !gold.caught) {
          // Reset score to 0 when player misses a gold
          newScore = 0;
          scoreChanged = true;
          gold.missed = true; // Mark as missed to prevent multiple resets
        }
      });

      // Update score and game state outside of the forEach to avoid multiple state updates
      if (scoreChanged) {
        setScore(newScore);
        if (gameWonCheck) {
          setGameWon(true);
          setGameActive(false);
        }
      }

      // Remove caught gold and gold that fell off screen
      return updated.filter(gold => !gold.caught && !gold.missed && gold.y < GAME_HEIGHT + 50);
    });
  }, [gameActive, bagPosition, GAME_WIDTH, GAME_HEIGHT, score, getCurrentFallSpeed, BAG_WIDTH, GOLD_SIZE]);

  // Navigate to win page when game is won
  useEffect(() => {
    if (gameWon) {
      navigate('/youWonTheWholeThing');
    }
  }, [gameWon, navigate]);

  // Spawn gold periodically
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      if (gameActive) {
        spawnGold();
      }
    }, GOLD_SPAWN_RATE);

    return () => clearInterval(spawnInterval);
  }, [spawnGold, gameActive]);

  // Bag movement loop - separate from game loop for smooth movement
  useEffect(() => {
    let animationId;
    let lastTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    const bagLoop = (currentTime) => {
      if (currentTime - lastTime >= frameInterval) {
        updateBagPosition();
        lastTime = currentTime;
      }
      animationId = requestAnimationFrame(bagLoop);
    };

    animationId = requestAnimationFrame(bagLoop);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [updateBagPosition]);

  // Game loop using requestAnimationFrame for smoother animation
  useEffect(() => {
    let animationId;
    let lastTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    const gameLoop = (currentTime) => {
      if (currentTime - lastTime >= frameInterval) {
        updateGame();
        lastTime = currentTime;
      }
      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [updateGame]);

  // Keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <div className={`bag-builder-container ${gameWon ? 'game-won' : ''}`}>
      <div className="scoreboard">
        <div className="score">{score}/250</div>
        <div className="score-label">Score</div>
        {gameWon && <div className="game-won-message">You Won! 🎉</div>}
      </div>
      
      <div className="game-area">
        {/* Gold pieces */}
        {goldPieces.map(gold => (
          <div key={gold.id}>
            <div
              className="gold-piece"
              style={{
                left: `${gold.x}px`,
                top: `${gold.y}px`,
              }}
            />
          </div>
        ))}
        
        {/* Bag */}
        <div
          className="bag"
          style={{
            left: `${bagPosition}%`,
          }}
        />
      </div>
      
      <div className="instructions">
        <p>Use ← → arrow keys to move the bag</p>
      </div>
    </div>
  );
};

export default BagBuilder;
