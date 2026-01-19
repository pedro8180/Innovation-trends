import React from 'react';
import './EvaluationMessage.css';

const EvaluationMessage = ({ content }) => {
  return (
    <div className="evaluation-content">
      {content.result && (
        <div className="evaluation-result">{content.result}</div>
      )}
      {content.explanation && (
        <div className="evaluation-explanation">{content.explanation}</div>
      )}
      {content.learnMore && (
        <div className="evaluation-learn-more">
          Learn More:{' '}
          <a href={content.learnMore} target="_blank" rel="noopener noreferrer">
            Documentation
          </a>
        </div>
      )}
    </div>
  );
};

export default EvaluationMessage;