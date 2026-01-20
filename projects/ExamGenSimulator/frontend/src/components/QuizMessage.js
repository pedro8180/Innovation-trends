import React, { useState } from 'react';
import { CheckCircle, XCircle, Award, ArrowRight, ArrowLeft } from 'lucide-react';
import './QuizMessage.css';

const QuizMessage = ({ 
  question, 
  questionNumber, 
  totalQuestions, 
  moduleNumber,
  moduleName,
  onAnswerSelected,
  onPreviousQuestion,
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
            <div className="explanation-result">
              <h4>{isCorrect ? 'Correct!' : 'Incorrect'}</h4>
            </div>
            <div className="explanation-content">
              {typeof explanation === 'object' ? 
                <div dangerouslySetInnerHTML={{__html: explanation.explanation || explanation.content || explanation}} />
                : 
                <div dangerouslySetInnerHTML={{__html: explanation}} />
              }
            </div>
            {typeof explanation === 'object' && (explanation.learnMore || explanation.source) && (
              <div className="explanation-learn-more">
                <p>{explanation.content}</p>
                <p><strong>Source: </strong>
                  {explanation.source || (
                    <a href={explanation.learnMore} target="_blank" rel="noopener noreferrer">
                      Documentation
                    </a>
                  )}
                </p>
              </div>
            )}
          </div>

          <div className="quiz-navigation">
            {questionNumber > 1 && (
              <button 
                className="btn btn-secondary previous-question-btn"
                onClick={onPreviousQuestion}
              >
                <ArrowLeft size={16} />
                Previous Question
              </button>
            )}

            {questionNumber < totalQuestions && (
              <button 
                className="btn btn-primary next-question-btn"
                onClick={onNextQuestion}
              >
                Next Question
                <ArrowRight size={16} />
              </button>
            )}
          </div>

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