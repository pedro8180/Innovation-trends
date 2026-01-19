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
    // Create CSV header
    const headers = [
      'Question Number',
      'Question',
      'Your Answer',
      'Correct Answer',
      'Result',
      'Explanation',
      'Key Learning Points'
    ];

    // Prepare the summary data
    const summaryRows = [
      [`Module ${moduleNumber} - ${moduleName}`],
      [`Completed on: ${new Date().toLocaleString()}`],
      [`Score: ${scorePercentage}% (${correctAnswers} correct out of ${totalQuestions})`],
      [],
      headers
    ];

    // Add question data
    questions.forEach((question, index) => {
      const answer = currentAnswers[question.id];
      const explanation = question.explanation || '';
      
      // Split explanation into main points and key learnings
      let mainExplanation = explanation;
      let keyLearnings = '';
      
      if (explanation.includes('Key Learning Points:')) {
        [mainExplanation, keyLearnings] = explanation.split('Key Learning Points:');
      } else if (explanation.includes('Remember:')) {
        [mainExplanation, keyLearnings] = explanation.split('Remember:');
      }

      summaryRows.push([
        index + 1,
        question.question,
        `${answer?.selected?.toUpperCase()}: ${question.options[answer?.selected] || 'Not answered'}`,
        `${question.correctAnswer?.toUpperCase()}: ${question.options[question.correctAnswer]}`,
        answer?.isCorrect ? 'Correct' : 'Incorrect',
        mainExplanation.trim(),
        keyLearnings.trim()
      ]);
    });

    // Convert to CSV string
    const csvContent = summaryRows
      .map(row => row
        .map(cell => {
          // Escape special characters and wrap in quotes if needed
          const cellStr = String(cell || '');
          return cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')
            ? `"${cellStr.replace(/"/g, '""')}"` 
            : cellStr;
        })
        .join(',')
      )
      .join('\n');

    // Create and download file
    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Module_${moduleNumber}_Summary_${new Date().toISOString().split('T')[0]}.csv`;
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
          <div className="stat-card score" style={{ margin: '0 auto', borderColor: performance.color }}>
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
        
        {/* Module completion actions */}
        <div className="module-actions">
          <div className="action-buttons-container">
            <div className="left-buttons">
              <button 
                className="btn btn-secondary action-btn"
                onClick={() => onContinueNext(true)}
              >
                <RotateCcw size={16} />
                Repeat the Module
              </button>
              
              <button 
                className="btn btn-outline action-btn"
                onClick={onSelectModule}
              >
                <BookOpen size={16} />
                Select Module
              </button>
            </div>
            
            <div className="right-buttons">
              {moduleNumber < totalModules && (
                <button 
                  className="btn btn-primary action-btn"
                  onClick={() => onContinueNext(false)}
                >
                  Next Module
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizSummary;