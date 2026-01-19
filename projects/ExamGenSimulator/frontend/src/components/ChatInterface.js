import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { apiService } from '../services/api';
import QuizMessage from './QuizMessage';
import QuizSummary from './QuizSummary';
import ModuleList from './ModuleList';
import EvaluationMessage from './EvaluationMessage';
import './ChatInterface.css';

const ChatInterface = ({ messages, setMessages, isLoading, setIsLoading, currentChatId }) => {
  const [inputValue, setInputValue] = useState('');
  const [checkingAnswer, setCheckingAnswer] = useState(null); // ID of message being checked
  const [quizSessions, setQuizSessions] = useState({}); // Store quiz sessions by message ID
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await apiService.sendQueryWithChat(userMessage.content, currentChatId);

      let botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response,
        timestamp: new Date()
      };

      // Check if response is a structured response
      if (typeof response === 'object' && response.type) {
        if (response.type === 'quiz') {
          botMessage = {
            ...botMessage,
            type: 'quiz',
            isQuiz: true,
            content: response.message || 'Starting quiz...'
          };
          
          // Initialize quiz session with module information
          setQuizSessions(prev => ({
            ...prev,
            [botMessage.id]: {
              questions: translateQuizQuestions(response.questions),
              currentQuestionIndex: 0,
              currentAnswers: {},
              moduleNumber: response.module_number || 1,
              moduleName: translateContent(response.module_name) || 'General Practice',
              totalQuestions: response.total_questions || response.questions.length,
              totalModules: response.total_modules || 10,
              score: { correct: 0, total: 0 },
              isCompleted: false
            }
          }));
        } else if (response.type === 'module_selection') {
          botMessage = {
            ...botMessage,
            type: 'module_selection',
            content: response.message,
            modules: response.modules
          };
        }
      } else {
        // Check if response contains quiz questions in text format (fallback)
        const quizQuestions = parseQuizFromResponse(typeof response === 'string' ? response : JSON.stringify(response));
        if (quizQuestions && quizQuestions.length > 0) {
          botMessage.type = 'quiz';
          botMessage.isQuiz = true;
          
          // Initialize quiz session
          setQuizSessions(prev => ({
            ...prev,
            [botMessage.id]: {
              questions: translateQuizQuestions(quizQuestions),
              currentQuestionIndex: 0,
              currentAnswers: {},
              totalModules: 10
            }
          }));
        }
      }

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error calling API:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Sorry, I encountered an error while processing your request. Please make sure the backend server is running and try again.',
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckAnswer = async (messageId, userAnswer, questionContent) => {
    setCheckingAnswer(messageId);
    
    try {
      const checkPrompt = `Please analyze this answer and provide a clear response:

Question: ${questionContent}
User's Answer: ${userAnswer}

Format your response using this structure:

RESULT: 
State clearly if the answer is correct or incorrect (one line)

EXPLANATION: 
Provide a detailed explanation of why the answer is right or wrong, including the key technical concepts involved (2-3 sentences)

[Learn More]: 
Brief documentation reference where they can learn more about this topic.`;

      const content = await apiService.sendQueryWithChat(checkPrompt, currentChatId);
      console.log('Raw response:', content); // Debug log

      // Parse based on our expected format
      const resultMatch = content.match(/Result:\s*(.*?)(?=Explanation:|$)/i);
      const explanationMatch = content.match(/Explanation:\s*(.*?)(?=Learn More:|$)/i);
      const learnMoreMatch = content.match(/Learn More:\s*(.*?)$/i);

      const structuredContent = {
        result: resultMatch ? resultMatch[1].trim() : isCorrect ? 'Correct!' : 'Incorrect',
        explanation: explanationMatch ? explanationMatch[1].trim() : content,
        learnMore: learnMoreMatch ? learnMoreMatch[1].trim() : null
      };

      const evaluationMessage = {
        id: Date.now(),
        type: 'evaluation',
        content: structuredContent,
        timestamp: new Date(),
        relatedMessageId: messageId
      };

      setMessages(prev => [...prev, evaluationMessage]);
      
    } catch (error) {
      console.error('Error checking answer:', error);
      
      const errorMessage = {
        id: Date.now(),
        type: 'evaluation',
        content: 'Sorry, I encountered an error while checking your answer. Please try again.',
        timestamp: new Date(),
        isError: true,
        relatedMessageId: messageId
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setCheckingAnswer(null);
    }
  };

  // Parse quiz content from AI response
  const parseQuizFromResponse = (content) => {
    // Split content by numbered questions (1., 2., 3., etc.)
    const questionSections = content.split(/\d+\.\s+/).filter(section => section.trim().length > 0);
    
    if (questionSections.length === 0) return null;
    
      const questions = questionSections.map((section, index) => {
        const lines = section.split('\n').filter(line => line.trim().length > 0);
        
        if (lines.length < 5) return null; // Need question + 4 options minimum
        
        // First line is the question
        const questionText = lines[0].trim();
        
        // Find options (a., b., c., d.)
        const options = {};
        let correctAnswer = null;
        let explanation = '';
        let explanationText = '';
        
        let currentLine = 1;
        
        // Parse options
        while (currentLine < lines.length) {
          const line = lines[currentLine].trim();
          const optionMatch = line.match(/^([a-d])\.?\s*(.*)/i);
          
          if (optionMatch) {
            const letter = optionMatch[1].toLowerCase();
            const text = optionMatch[2].trim();
            options[letter] = text;
            currentLine++;
          } else {
            break;
          }
        }
        
        // Look for correct answer and explanation in remaining lines
        let isExplanationSection = false;

        for (let i = currentLine; i < lines.length; i++) {
          const line = lines[i].trim();
          
          if (line.toLowerCase().includes('correct answer:')) {
            const answerMatch = line.match(/([a-d])\.?\s*/i);
            if (answerMatch) {
              correctAnswer = answerMatch[1].toLowerCase();
            }
          } else if (line.toLowerCase().startsWith('explanation:')) {
            isExplanationSection = true;
            continue; // Skip the "Explanation:" line itself
          } else if (line.toLowerCase().startsWith('source:')) {
            // If we find a source line, add it to the explanation object
            explanation = {
              explanation: explanationText.trim(),
              source: line.replace(/source:\s*/i, '').trim()
            };
            isExplanationSection = false;
          } else if (isExplanationSection) {
            // Collect explanation text
            explanationText += ' ' + line;
          }
        }

        // If we didn't find a structured explanation with source, use the collected text
        if (!explanation && explanationText) {
          explanation = explanationText.trim();
        }      // If no explicit correct answer found, try to infer from explanation
      if (!correctAnswer && explanation) {
        const answerInExplanation = explanation.match(/answer is ([a-d])\.?\s*/i);
        if (answerInExplanation) {
          correctAnswer = answerInExplanation[1].toLowerCase();
        }
      }
      
      // Fallback explanation if none found
      if (!explanation) {
        explanation = `The correct answer is ${correctAnswer?.toUpperCase()}. This question tests your understanding of the topic covered in the certification material.`;
      }
      
      return {
        id: `q_${Date.now()}_${index}`,
        question: translateContent(questionText),
        options: Object.fromEntries(
          Object.entries(options).map(([key, value]) => [key, translateContent(value)])
        ),
        correctAnswer,
        explanation: translateContent(explanation)
      };
    }).filter(q => q && q.correctAnswer && Object.keys(q.options).length >= 2);
    
    return questions.length > 0 ? questions : null;
  };

  // Handle quiz answer selection
  const handleQuizAnswer = (messageId, questionId, selectedOption) => {
    setQuizSessions(prev => {
      const session = prev[messageId] || {};
      const question = session.questions?.find(q => q.id === questionId);
      
      if (!question) return prev;
      
      const isCorrect = selectedOption === question.correctAnswer;
      
      // Check if this question was already answered (to avoid double counting)
      const wasAlreadyAnswered = session.currentAnswers && session.currentAnswers[questionId];
      
      let newScore = { ...(session.score || { correct: 0, total: 0 }) };
      if (!wasAlreadyAnswered) {
        // Only update score if this is the first time answering this question
        newScore = {
          correct: (newScore.correct || 0) + (isCorrect ? 1 : 0),
          total: (newScore.total || 0) + 1
        };
      }
      
      // Calculate total answered questions
      const answeredQuestions = Object.keys(session.currentAnswers || {});
      const isLastQuestion = answeredQuestions.length + 1 >= session.questions.length;
      
      return {
        ...prev,
        [messageId]: {
          ...session,
          currentAnswers: {
            ...session.currentAnswers,
            [questionId]: {
              selected: selectedOption,
              isCorrect,
              showResult: true
            }
          },
          score: newScore,
          isCompleted: isLastQuestion
        }
      };
    });
  };

  // Handle next question in quiz
  const handleNextQuestion = (messageId) => {
    setQuizSessions(prev => {
      const session = prev[messageId] || {};
      return {
        ...prev,
        [messageId]: {
          ...session,
          currentQuestionIndex: (session.currentQuestionIndex || 0) + 1
        }
      };
    });
  };

  // Handle previous question in quiz
  const handlePreviousQuestion = (messageId) => {
    setQuizSessions(prev => {
      const session = prev[messageId] || {};
      const currentIndex = session.currentQuestionIndex || 0;
      return {
        ...prev,
        [messageId]: {
          ...session,
          currentQuestionIndex: Math.max(0, currentIndex - 1)
        }
      };
    });
  };

  // Handle continue to next module
  const handleContinueNext = async (messageId, repeatCurrent = false) => {
    const quizSession = quizSessions[messageId];
    const nextModuleNumber = repeatCurrent ? 
      (quizSession?.moduleNumber || 1) : 
      (quizSession?.moduleNumber || 1) + 1;
    
    const continueMessage = {
      id: Date.now(),
      type: 'user',
      content: repeatCurrent ? 
        `Practice Module ${nextModuleNumber} again` : 
        `Continue to Module ${nextModuleNumber}`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, continueMessage]);
    setIsLoading(true);
    
    try {
      const response = await apiService.sendQueryWithChat(repeatCurrent ? 
        `Please start Module ${nextModuleNumber} practice questions again. I want to practice this module more. Generate questions in English.` :
        `Please start Module ${nextModuleNumber} practice questions. I want to continue with the next module in the AI-102 certification sequence. Generate questions in English.`, currentChatId);
      
      let botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response,
        timestamp: new Date()
      };

      if (typeof response === 'object' && response.type === 'quiz') {
        botMessage = {
          ...botMessage,
          type: 'quiz',
          isQuiz: true,
          content: translateContent(response.message) || `Starting Module ${nextModuleNumber}...`
        };

        setQuizSessions(prev => ({
          ...prev,
          [botMessage.id]: {
            questions: translateQuizQuestions(response.questions),
            currentQuestionIndex: 0,
            currentAnswers: {},
            moduleNumber: response.module_number || nextModuleNumber,
            moduleName: translateContent(response.module_name) || `Module ${nextModuleNumber}`,
            totalQuestions: response.total_questions || response.questions.length,
            totalModules: response.total_modules || 10
          }
        }));
      } else {
        // Try to parse text-based quiz if structured response failed
        const quizQuestions = parseQuizFromResponse(typeof response === 'string' ? response : JSON.stringify(response));
        if (quizQuestions && quizQuestions.length > 0) {
          botMessage.type = 'quiz';
          botMessage.isQuiz = true;
          botMessage.content = `Starting Module ${nextModuleNumber} - ${quizQuestions.length} Questions`;
          
          setQuizSessions(prev => ({
            ...prev,
            [botMessage.id]: {
              questions: translateQuizQuestions(quizQuestions),
              currentQuestionIndex: 0,
              currentAnswers: {},
              moduleNumber: nextModuleNumber,
              moduleName: `Module ${nextModuleNumber}`,
              totalQuestions: quizQuestions.length,
              totalModules: 10
            }
          }));
        }
      }
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error loading next module:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: `Sorry, I couldn't load Module ${nextModuleNumber}. Please try asking for it manually or select from available modules.`,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle select another module
  const handleSelectModule = async (messageId) => {
    const selectMessage = {
      id: Date.now(),
      type: 'user',
      content: 'Browse available modules',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, selectMessage]);
    setIsLoading(true);
    
    try {
      const response = await apiService.sendQueryWithChat('Show me all available AI-102 modules for practice. List them with descriptions in English.', currentChatId);

      let botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: translateContent(response),
        timestamp: new Date()
      };

      if (typeof response === 'object' && response.type === 'module_selection') {
        botMessage = {
          ...botMessage,
          type: 'module_selection',
          content: translateContent(response.message),
          modules: response.modules
        };
      }

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error loading modules:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'module_selection',
        content: 'Available AI-102 Certification Modules',
        modules: [
          {
            number: 1,
            title: 'AI Fundamentals',
            topics: [
              'Introduction to Artificial Intelligence',
              'AI workloads and considerations',
              'Responsible AI principles'
            ]
          },
          {
            number: 2,
            title: 'Cognitive Services',
            topics: [
              'Azure Cognitive Services overview',
              'Authentication and security',
              'Service configuration'
            ]
          },
          {
            number: 3,
            title: 'Computer Vision',
            topics: [
              'Image analysis and classification',
              'Optical Character Recognition (OCR)',
              'Custom Vision services'
            ]
          },
          {
            number: 4,
            title: 'Natural Language Processing',
            topics: [
              'Text analysis and sentiment',
              'Language Understanding (LUIS)',
              'QnA Maker integration'
            ]
          },
          {
            number: 5,
            title: 'Conversational AI',
            topics: [
              'Bot Framework fundamentals',
              'Dialog management',
              'Multi-turn conversations'
            ]
          },
          {
            number: 6,
            title: 'Speech Services',
            topics: [
              'Speech-to-text and text-to-speech',
              'Speech translation',
              'Custom speech models'
            ]
          },
          {
            number: 7,
            title: 'Document Intelligence',
            topics: [
              'Form Recognizer service',
              'Document processing',
              'Custom model training'
            ]
          },
          {
            number: 8,
            title: 'Knowledge Mining',
            topics: [
              'Azure Cognitive Search',
              'Indexing and enrichment',
              'Search solutions'
            ]
          },
          {
            number: 9,
            title: 'Azure OpenAI',
            topics: [
              'GPT models and completions',
              'Embeddings and semantic search',
              'Responsible AI practices'
            ]
          },
          {
            number: 10,
            title: 'AI Solution Architecture',
            topics: [
              'End-to-end AI solutions',
              'Performance optimization',
              'Monitoring and maintenance'
            ]
          }
        ]
      };
      errorMessage.timestamp = new Date();
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle return to main menu
  const handleReturnToMenu = async (messageId) => {
    const menuMessage = {
      id: Date.now(),
      type: 'user',
      content: 'Return to main menu',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, menuMessage]);
    setIsLoading(true);
    
    try {
      const response = await apiService.sendQueryWithChat('Hello, I would like to start a new study session. What can you help me with?', currentChatId);

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error returning to menu:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Welcome back! I can help you with:\n\n📚 Practice quiz questions by module\n🎯 Study specific topics\n💡 Explain concepts and answers\n📋 Review exam objectives\n\nWhat would you like to do today?',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Translation helper functions
  const translateContent = (text) => {
    if (!text) return text;
    
    const translations = {
      'Práctica General': 'General Practice',
      'Módulo': 'Module',
      'módulo': 'module',
      'Pregunta': 'Question',
      'pregunta': 'question',
      'Correcto': 'Correct',
      'Incorrecto': 'Incorrect',
      'Explicación': 'Explanation',
      'explicación': 'explanation',
      'Siguiente': 'Next',
      'siguiente': 'next',
      'Completado': 'Complete',
      'completado': 'complete',
      'Seleccione': 'Select',
      'seleccione': 'select',
      'la respuesta correcta es': 'the correct answer is',
      'La respuesta correcta es': 'The correct answer is'
    };
    
    let translatedText = text;
    Object.entries(translations).forEach(([spanish, english]) => {
      translatedText = translatedText.replace(new RegExp(spanish, 'gi'), english);
    });
    
    return translatedText;
  };

  const translateQuizQuestions = (questions) => {
    if (!questions || !Array.isArray(questions)) return questions;
    
    return questions.map(question => ({
      ...question,
      question: translateContent(question.question),
      options: question.options ? Object.fromEntries(
        Object.entries(question.options).map(([key, value]) => [key, translateContent(value)])
      ) : question.options,
      explanation: translateContent(question.explanation)
    }));
  };

  return (
    <div className="chat-interface card fade-in">
      <div className="chat-header">
        <div className="chat-title">
          <Bot size={20} />
          <span>AI Assistant</span>
        </div>
        <div className="chat-status">
          {currentChatId && (
            <span className="chat-id">Chat #{currentChatId.slice(0, 8)}</span>
          )}
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => {
          const isUserMessage = message.type === 'user';
          const isBotMessage = message.type === 'bot';
          const isQuizMessage = message.type === 'quiz' || message.isQuiz;
          const isEvaluation = message.type === 'evaluation';
          const previousMessage = index > 0 ? messages[index - 1] : null;
          const canCheckAnswer = isUserMessage && previousMessage && previousMessage.type === 'bot' && !previousMessage.isQuiz;
          
          // Handle quiz messages differently
          if (message.type === 'module_selection') {
            return (
              <div key={message.id} className="message bot-message">
                <div className="message-avatar">
                  <Bot size={16} />
                </div>
                <div className="message-content">
                  <ModuleList 
                    modules={message.modules} 
                    onModuleSelect={(moduleNumber) => {
                      const userMessage = {
                        id: Date.now(),
                        type: 'user',
                        content: `Start Module ${moduleNumber}`,
                        timestamp: new Date()
                      };
                      setMessages(prev => [...prev, userMessage]);
                      setIsLoading(true);
                      (async () => {
                        try {
                          const response = await apiService.sendQueryWithChat(`Please start Module ${moduleNumber} practice questions. Generate questions in English.`, currentChatId);

                          let botMessage = {
                            id: Date.now() + 1,
                            type: 'bot',
                            content: response,
                            timestamp: new Date()
                          };

                          if (typeof response === 'object' && response.type === 'quiz') {
                            botMessage = {
                              ...botMessage,
                              type: 'quiz',
                              isQuiz: true,
                              content: translateContent(response.message) || `Starting Module ${moduleNumber}...`
                            };
                            
                            setQuizSessions(prev => ({
                              ...prev,
                              [botMessage.id]: {
                                questions: translateQuizQuestions(response.questions),
                                currentQuestionIndex: 0,
                                currentAnswers: {},
                                moduleNumber: response.module_number || moduleNumber,
                                moduleName: translateContent(response.module_name) || `Module ${moduleNumber}`,
                                totalQuestions: response.total_questions || response.questions.length,
                                totalModules: response.total_modules || 10,
                                score: { correct: 0, total: 0 }  // Initialize score object
                              }
                            }));
                          }

                          setMessages(prev => [...prev, botMessage]);
                        } catch (error) {
                          console.error('Error loading module:', error);
                          const errorMessage = {
                            id: Date.now() + 1,
                            type: 'bot',
                            content: `Sorry, I couldn't load Module ${moduleNumber}. Please try again.`,
                            timestamp: new Date(),
                            isError: true
                          };
                          setMessages(prev => [...prev, errorMessage]);
                        } finally {
                          setIsLoading(false);
                        }
                      })();
                    }}
                  />
                </div>
              </div>
            );
          }
          
          if (isQuizMessage) {
            const quizSession = quizSessions[message.id];
            if (!quizSession || !quizSession.questions) {
              return (
                <div key={message.id} className="message bot-message">
                  <div className="message-avatar">
                    <Bot size={16} />
                  </div>
                  <div className="message-content">
                    <div className="message-text">Loading quiz...</div>
                  </div>
                </div>
              );
            }
            
            // Check if all questions are answered (module completed)
            const allQuestionsAnswered = quizSession.questions.every(q => 
              quizSession.currentAnswers && quizSession.currentAnswers[q.id]
            );
            
            if (allQuestionsAnswered) {
              return (
                <div key={message.id} className="message bot-message">
                  <div className="message-avatar">
                    <Bot size={16} />
                  </div>
                  <div className="message-content">
                    <div className="message-text">
                      <div className="quiz-complete-summary">
                        <QuizSummary 
                          quizSession={quizSession}
                          onContinueNext={(repeat) => handleContinueNext(message.id, repeat)}
                          onSelectModule={() => handleSelectModule(message.id)}
                          onReturnToMenu={() => handleReturnToMenu(message.id)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
            
            const currentQuestion = quizSession.questions[quizSession.currentQuestionIndex];
            if (!currentQuestion) {
              return (
                <div key={message.id} className="message bot-message">
                  <div className="message-avatar">
                    <Bot size={16} />
                  </div>
                  <div className="message-content">
                    <div className="message-text">Loading next question...</div>
                  </div>
                </div>
              );
            }
            
            const currentAnswer = quizSession.currentAnswers[currentQuestion.id];
            
            return (
              <div key={message.id} className="message bot-message quiz-message-wrapper">
                <div className="message-avatar">
                  <Bot size={16} />
                </div>
                <div className="message-content">
                  <QuizMessage
                    question={currentQuestion}
                    questionNumber={quizSession.currentQuestionIndex + 1}
                    totalQuestions={quizSession.questions.length}
                    moduleNumber={quizSession.moduleNumber}
                    moduleName={quizSession.moduleName}
                    onAnswerSelected={(option) => handleQuizAnswer(message.id, currentQuestion.id, option)}
                    onNextQuestion={() => handleNextQuestion(message.id)}
                    onPreviousQuestion={() => handlePreviousQuestion(message.id)}
                    showResult={currentAnswer?.showResult || false}
                    userAnswer={currentAnswer?.selected}
                    isCorrect={currentAnswer?.isCorrect || false}
                    explanation={currentQuestion.explanation}
                  />
                </div>
              </div>
            );
          }
          
          return (
            <div 
              key={message.id} 
              className={`message ${isUserMessage ? 'user-message' : isBotMessage ? 'bot-message' : 'evaluation-message'} ${message.isError ? 'error-message' : ''}`}
            >
              <div className="message-avatar">
                {isUserMessage ? (
                  <User size={16} />
                ) : isEvaluation ? (
                  <AlertCircle size={16} />
                ) : (
                  <Bot size={16} />
                )}
              </div>
              <div className="message-content">
                <div className="message-text">
                  {isEvaluation ? (
                    <EvaluationMessage content={message.content} />
                  ) : (
                    message.content
                  )}
                </div>
                <div className="message-actions">
                  <div className="message-time">
                    {formatTimestamp(message.timestamp)}
                  </div>

                </div>
              </div>
            </div>
          );
        })}
        
        {isLoading && (
          <div className="message bot-message loading-message">
            <div className="message-avatar">
              <Bot size={16} />
            </div>
            <div className="message-content">
              <div className="message-text">
                <Loader2 size={16} className="loading-spinner" />
                Thinking...
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <div className="input-container">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me about exam questions, concepts, or study materials..."
            className="chat-input"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            className="btn btn-primary send-btn"
            disabled={!inputValue.trim() || isLoading}
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;