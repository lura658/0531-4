import React, { useEffect } from 'react';

const StartScreen = ({ onStart }) => {
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Enter') {
        onStart();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [onStart]);

  return (
    <div className="start-screen">
      <h1>Welcome to the EdTech Game!</h1>
      <p>Press Enter to start the game.</p>
      <div className="instruction-panel">
        <h2>Instructions</h2>
        <p>Use the arrow keys to navigate through the game.</p>
        <p>Follow the prompts to answer questions and complete tasks.</p>
        <p>Good luck and have fun!</p>
      </div>
    </div>
  );
};

export default StartScreen;