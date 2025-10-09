import React, { useState } from 'react';
import { Trophy, CheckCircle, XCircle, RotateCcw, BookOpen, ArrowRight, ChevronDown, ChevronUp, Download } from 'lucide-react';
import './QuizSummary.css';

const QuizSummary = ({ quizSession, onContinueNext, onSelectModule, onReturnToMenu }) => {
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [showAutoAdvance, setShowAutoAdvance] = useState(true);

  if (!quizSession || !quizSession.questions) {
    return <div>No quiz data available</div>;
  }

  const { questions, currentAnswers, moduleNumber, moduleName, totalModules = 10 } = quizSession;
  
  // Calculate statistics
  const totalQuestions = questions.length;
  const correctAnswers = Object.values(currentAnswers).filter(answer => answer.isCorrect).length;
  const incorrectAnswers = totalQuestions - correctAnswers;
  const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);
  
  // Determine performance level
  const getPerformanceLevel = (percentage) => {
    if (percentage >= 90) return { level: 'Excellent', color: '#22c55e', icon: Trophy };
    if (percentage >= 75) return { level: 'Good', color: '#3b82f6', icon: CheckCircle };
    if (percentage >= 60) return { level: 'Fair', color: '#f59e0b', icon: RotateCcw };
    return { level: 'Needs Improvement', color: '#ef4444', icon: XCircle };
  };

  const performance = getPerformanceLevel(scorePercentage);
  const PerformanceIcon = performance.icon;

  const toggleQuestionExpansion = (questionId) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const exportSummary = () => {
    const summaryData = {
      module: {
        number: moduleNumber,
        name: moduleName,
        completedAt: new Date().toISOString()
      },
      score: {
        correct: correctAnswers,
        incorrect: incorrectAnswers,
        total: totalQuestions,
        percentage: scorePercentage
      },
      questions: questions.map((question, index) => {
        const answer = currentAnswers[question.id];
        return {
          number: index + 1,
          question: question.question,
          userAnswer: answer?.selected?.toUpperCase(),
          userAnswerText: question.options[answer?.selected],
          correctAnswer: question.correctAnswer?.toUpperCase(),
          correctAnswerText: question.options[question.correctAnswer],
          isCorrect: answer?.isCorrect,
          explanation: question.explanation
        };
      })
    };

    const dataStr = JSON.stringify(summaryData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Module_${moduleNumber}_Summary_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="quiz-summary">
      <div className="summary-header">
        <div className="summary-title">
          <Trophy size={24} />
          <h2>Module {moduleNumber} Complete!</h2>
        </div>
        <div className="module-name">{moduleName}</div>
      </div>

      <div className="summary-stats">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{totalQuestions}</div>
            <div className="stat-label">Total Questions</div>
          </div>
          <div className="stat-card correct">
            <div className="stat-number">{correctAnswers}</div>
            <div className="stat-label">Correct</div>
          </div>
          <div className="stat-card incorrect">
            <div className="stat-number">{incorrectAnswers}</div>
            <div className="stat-label">Incorrect</div>
          </div>
          <div className="stat-card score" style={{ borderColor: performance.color }}>
            <div className="stat-number" style={{ color: performance.color }}>
              {scorePercentage}%
            </div>
            <div className="stat-label">Score</div>
          </div>
        </div>

        <div className="performance-badge" style={{ backgroundColor: performance.color }}>
          <PerformanceIcon size={20} />
          <span>{performance.level}</span>
        </div>
      </div>

      <div className="summary-details">
        <div className="details-header">
          <h3>Question Review</h3>
          <button 
            className="export-btn"
            onClick={exportSummary}
            title="Export summary as JSON"
          >
            <Download size={16} />
            Export
          </button>
        </div>
        <div className="questions-list">
          {questions.map((question, index) => {
            const answer = currentAnswers[question.id];
            const isExpanded = expandedQuestions[question.id];
            
            return (
              <div key={question.id} className={`question-summary ${answer?.isCorrect ? 'correct' : 'incorrect'}`}>
                <div 
                  className="question-header"
                  onClick={() => toggleQuestionExpansion(question.id)}
                >
                  <div className="question-info">
                    <div className="question-number">Q{index + 1}</div>
                    <div className="question-status">
                      {answer?.isCorrect ? (
                        <CheckCircle size={20} className="correct-icon" />
                      ) : (
                        <XCircle size={20} className="incorrect-icon" />
                      )}
                    </div>
                    <div className="question-preview">
                      {question.question.substring(0, 80)}
                      {question.question.length > 80 ? '...' : ''}
                    </div>
                  </div>
                  <div className="expand-icon">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="question-details">
                    <div className="full-question">
                      <strong>Question:</strong> {question.question}
                    </div>
                    
                    <div className="answers-section">
                      <div className="answer-row">
                        <span className="answer-label">Your Answer:</span>
                        <span className={`answer-value ${answer?.isCorrect ? 'correct' : 'incorrect'}`}>
                          {answer?.selected?.toUpperCase()}: {question.options[answer?.selected]}
                        </span>
                      </div>
                      
                      {!answer?.isCorrect && (
                        <div className="answer-row">
                          <span className="answer-label">Correct Answer:</span>
                          <span className="answer-value correct">
                            {question.correctAnswer?.toUpperCase()}: {question.options[question.correctAnswer]}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="explanation">
                      <strong>Explanation:</strong>
                      <p>{question.explanation}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="summary-actions">
        <h3>What would you like to do next?</h3>
        
        {/* Auto-advance section - only show if not the last module */}
        {moduleNumber < totalModules && showAutoAdvance && (
          <div className="auto-advance-section">
            <div className="auto-advance-info">
              <h4>Ready for the next challenge?</h4>
              <p>Module {moduleNumber + 1} is next in the sequence. Continue your learning journey!</p>
            </div>
            <button 
              className="btn btn-primary action-btn featured"
              onClick={onContinueNext}
            >
              <ArrowRight size={16} />
              Continue to Module {moduleNumber + 1}
            </button>
          </div>
        )}
        
        {/* Alternative options */}
        <div className="alternative-actions">
          <h4>Or choose another option:</h4>
          <div className="action-buttons">
            {moduleNumber >= totalModules && (
              <div className="completion-message">
                <Trophy size={20} />
                <span>Congratulations! You've completed all available modules!</span>
              </div>
            )}
            
            <button 
              className="btn btn-primary action-btn"
              onClick={() => onContinueNext(true)} // Pass true to indicate repeat
            >
              <RotateCcw size={16} />
              Practice Module {moduleNumber} Again
            </button>
            
            <button 
              className="btn btn-secondary action-btn"
              onClick={onSelectModule}
            >
              <BookOpen size={16} />
              Browse All Modules
            </button>
            
            <button 
              className="btn btn-outline action-btn"
              onClick={onReturnToMenu}
            >
              <RotateCcw size={16} />
              Return to Main Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizSummary;