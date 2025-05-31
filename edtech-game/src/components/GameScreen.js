import React, { useEffect, useState } from 'react';
import InstructionPanel from './InstructionPanel';

const GameScreen = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);

  useEffect(() => {
    generateQuestion();
  }, []);

  const generateQuestion = () => {
    // Logic to generate a new question
    setQuestion('What is the capital of France?');
  };

  const handleAnswerSubmit = (event) => {
    event.preventDefault();
    if (answer.toLowerCase() === 'paris') {
      setScore(score + 1);
      alert('Correct!');
    } else {
      alert('Incorrect, try again!');
    }
    setAnswer('');
    generateQuestion();
  };

  return (
    <div className="game-screen">
      <h1>Educational Game</h1>
      <h2>Score: {score}</h2>
      <form onSubmit={handleAnswerSubmit}>
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer here"
        />
        <button type="submit">Submit</button>
      </form>
      <InstructionPanel />
    </div>
  );
};

export default GameScreen;