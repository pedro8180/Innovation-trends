import React, { useState } from 'react';
import { CheckCircle, XCircle, Award, ArrowRight } from 'lucide-react';
import './QuizMessage.css';

const QuizMessage = ({ 
  question, 
  questionNumber, 
  totalQuestions, 
  moduleNumber,
  moduleName,
  onAnswerSelected, 
  onNextQuestion,
  showResult,
  userAnswer,
  isCorrect,
  explanation 
}) => {
  // Removed selectedOption state - we only show selection after answer is submitted

  const handleOptionClick = (optionKey) => {
    if (showResult) return; // Prevent clicking after answer is shown
    
    onAnswerSelected(optionKey);
    // Don't set selectedOption here - let the parent component manage the state
  };

  const getOptionClass = (optionKey) => {
    let baseClass = 'quiz-option';
    
    if (showResult) {
      if (optionKey === question.correctAnswer) {
        baseClass += ' correct';
      } else if (optionKey === userAnswer && optionKey !== question.correctAnswer) {
        baseClass += ' incorrect';
      } else {
        baseClass += ' disabled';
      }
    }
    // Remove the selectedOption state - options should only show selection after answer is revealed
    
    return baseClass;
  };

  return (
    <div className="quiz-message">
      {/* Progress Header */}
      <div className="quiz-header">
        <div className="quiz-progress">
          <Award size={16} />
          <span>
            {moduleNumber ? `Module ${moduleNumber}, ` : ''}Question {questionNumber} of {totalQuestions}
          </span>
        </div>
        {moduleName && (
          <div className="module-name">
            {moduleName}
          </div>
        )}
        <div className="quiz-progress-bar">
          <div 
            className="quiz-progress-fill"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="quiz-question">
        <h3>{question.question}</h3>
      </div>

      {/* Options */}
      <div className="quiz-options">
        {Object.entries(question.options).map(([key, value]) => (
          <div
            key={key}
            className={getOptionClass(key)}
            onClick={() => handleOptionClick(key)}
          >
            <div className="option-letter">
              {key.toUpperCase()}
            </div>
            <div className="option-text">
              {value}
            </div>
            {showResult && key === question.correctAnswer && (
              <CheckCircle className="option-icon correct-icon" size={20} />
            )}
            {showResult && key === userAnswer && key !== question.correctAnswer && (
              <XCircle className="option-icon incorrect-icon" size={20} />
            )}
          </div>
        ))}
      </div>

      {/* Result and Explanation */}
      {showResult && (
        <div className="quiz-result">
          <div className={`result-badge ${isCorrect ? 'correct' : 'incorrect'}`}>
            {isCorrect ? (
              <>
                <CheckCircle size={16} />
                <span>Correct!</span>
              </>
            ) : (
              <>
                <XCircle size={16} />
                <span>Incorrect</span>
              </>
            )}
          </div>
          
          <div className="quiz-explanation">
            <h4>Explanation:</h4>
            <p>{explanation}</p>
          </div>

          {questionNumber < totalQuestions && (
            <button 
              className="btn btn-primary next-question-btn"
              onClick={onNextQuestion}
            >
              Next Question
              <ArrowRight size={16} />
            </button>
          )}

          {questionNumber === totalQuestions && (
            <div className="quiz-complete">
              <Award size={20} />
              <span>Module Complete!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizMessage;