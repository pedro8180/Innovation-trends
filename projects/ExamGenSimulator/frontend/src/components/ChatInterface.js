import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import QuizMessage from './QuizMessage';
import QuizSummary from './QuizSummary';
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
      const response = await axios.post('http://localhost:8000/api/agents', {
        query: userMessage.content
      });

      let botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.data,
        timestamp: new Date()
      };

      // Check if response is a structured response
      if (typeof response.data === 'object' && response.data.type) {
        if (response.data.type === 'quiz') {
          botMessage = {
            ...botMessage,
            type: 'quiz',
            isQuiz: true,
            content: response.data.message || 'Starting quiz...'
          };
          
          // Initialize quiz session with module information
          setQuizSessions(prev => ({
            ...prev,
            [botMessage.id]: {
              questions: translateQuizQuestions(response.data.questions),
              currentQuestionIndex: 0,
              currentAnswers: {},
              moduleNumber: response.data.module_number || 1,
              moduleName: translateContent(response.data.module_name) || 'General Practice',
              totalQuestions: response.data.total_questions || response.data.questions.length,
              totalModules: response.data.total_modules || 10
            }
          }));
        } else if (response.data.type === 'module_selection') {
          botMessage = {
            ...botMessage,
            type: 'module_selection',
            content: response.data.message,
            modules: response.data.modules
          };
        }
      } else {
        // Check if response contains quiz questions in text format (fallback)
        const quizQuestions = parseQuizFromResponse(typeof response.data === 'string' ? response.data : JSON.stringify(response.data));
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
      const checkPrompt = `Please analyze this answer to the following question:

Question: ${questionContent}
User's Answer: ${userAnswer}

Please evaluate if the answer is correct or incorrect and provide a detailed explanation of why it's right or wrong. Include:
1. Whether the answer is CORRECT or INCORRECT
2. A clear explanation of the reasoning
3. If incorrect, what the correct answer should be
4. Additional learning points or tips

Format your response clearly with the evaluation result first.`;

      const response = await axios.post('http://localhost:8000/api/agents', {
        query: checkPrompt
      });

      const evaluationMessage = {
        id: Date.now(),
        type: 'evaluation',
        content: response.data,
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
    // Check if the response contains multiple choice questions
    const questionPattern = /(\d+\.\s*Question\s*\d*:?\s*)(.*?)(?=\d+\.\s*Question|\**Module|$)/gis;
    const matches = [...content.matchAll(questionPattern)];
    
    if (matches.length === 0) return null;
    
    const questions = matches.map((match, index) => {
      const questionText = match[2].trim();
      
      // Extract question and options
      const lines = questionText.split('\n').filter(line => line.trim());
      const questionLine = lines[0];
      
      // Find options (a), b), c), d))
      const options = {};
      const optionPattern = /([a-d])\)\s*(.*)/gi;
      let correctAnswer = null;
      
      lines.forEach(line => {
        const optionMatch = line.match(optionPattern);
        if (optionMatch) {
          const letter = optionMatch[0].match(/([a-d])/i)[1].toLowerCase();
          const text = optionMatch[0].replace(/[a-d]\)\s*/i, '').trim();
          options[letter] = text;
        }
        
        // Look for correct answer
        if (line.toLowerCase().includes('correct answer:')) {
          const answerMatch = line.match(/([a-d])\)/i);
          if (answerMatch) {
            correctAnswer = answerMatch[1].toLowerCase();
          }
        }
      });
      
      // Generate explanation (simplified for now)
      const explanation = translateContent(`The correct answer is ${correctAnswer?.toUpperCase()}. This question tests your understanding of the topic covered in the certification material.`);
      
      return {
        id: `q_${Date.now()}_${index}`,
        question: translateContent(questionLine.replace(/^\d+\.\s*Question\s*\d*:?\s*/i, '').trim()),
        options: Object.fromEntries(
          Object.entries(options).map(([key, value]) => [key, translateContent(value)])
        ),
        correctAnswer,
        explanation
      };
    }).filter(q => q.correctAnswer && Object.keys(q.options).length > 0);
    
    return questions.length > 0 ? questions : null;
  };

  // Handle quiz answer selection
  const handleQuizAnswer = (messageId, questionId, selectedOption) => {
    setQuizSessions(prev => {
      const session = prev[messageId] || {};
      const question = session.questions?.find(q => q.id === questionId);
      
      if (!question) return prev;
      
      const isCorrect = selectedOption === question.correctAnswer;
      
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
          }
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
      const response = await axios.post('http://localhost:8000/api/agents', {
        query: repeatCurrent ? 
          `Please start Module ${nextModuleNumber} practice questions again. I want to practice this module more. Generate questions in English.` :
          `Please start Module ${nextModuleNumber} practice questions. I want to continue with the next module in the AI-102 certification sequence. Generate questions in English.`
      });
      
      let botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.data,
        timestamp: new Date()
      };
      
      if (typeof response.data === 'object' && response.data.type === 'quiz') {
        botMessage = {
          ...botMessage,
          type: 'quiz',
          isQuiz: true,
          content: translateContent(response.data.message) || `Starting Module ${nextModuleNumber}...`
        };
        
        setQuizSessions(prev => ({
          ...prev,
          [botMessage.id]: {
            questions: translateQuizQuestions(response.data.questions),
            currentQuestionIndex: 0,
            currentAnswers: {},
            moduleNumber: response.data.module_number || nextModuleNumber,
            moduleName: translateContent(response.data.module_name) || `Module ${nextModuleNumber}`,
            totalQuestions: response.data.total_questions || response.data.questions.length,
            totalModules: response.data.total_modules || 10
          }
        }));
      } else {
        // Try to parse text-based quiz if structured response failed
        const quizQuestions = parseQuizFromResponse(typeof response.data === 'string' ? response.data : JSON.stringify(response.data));
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
      const response = await axios.post('http://localhost:8000/api/agents', {
        query: 'Show me all available AI-102 modules for practice. List them with descriptions in English.'
      });
      
      let botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: translateContent(response.data),
        timestamp: new Date()
      };
      
      if (typeof response.data === 'object' && response.data.type === 'module_selection') {
        botMessage = {
          ...botMessage,
          type: 'module_selection',
          content: translateContent(response.data.message),
          modules: response.data.modules
        };
      }
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error loading modules:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: `📚 **Available AI-102 Certification Modules:**

🔹 **Module 1: AI Fundamentals**
   • Introduction to Artificial Intelligence
   • AI workloads and considerations
   • Responsible AI principles

🔹 **Module 2: Cognitive Services**
   • Azure Cognitive Services overview
   • Authentication and security
   • Service configuration

🔹 **Module 3: Computer Vision**
   • Image analysis and classification
   • Optical Character Recognition (OCR)
   • Custom Vision services

🔹 **Module 4: Natural Language Processing**
   • Text analysis and sentiment
   • Language Understanding (LUIS)
   • QnA Maker integration

🔹 **Module 5: Conversational AI**
   • Bot Framework fundamentals
   • Dialog management
   • Multi-turn conversations

🔹 **Module 6: Speech Services**
   • Speech-to-text and text-to-speech
   • Speech translation
   • Custom speech models

🔹 **Module 7: Document Intelligence**
   • Form Recognizer service
   • Document processing
   • Custom model training

🔹 **Module 8: Knowledge Mining**
   • Azure Cognitive Search
   • Indexing and enrichment
   • Search solutions

🔹 **Module 9: Azure OpenAI**
   • GPT models and completions
   • Embeddings and semantic search
   • Responsible AI practices

🔹 **Module 10: AI Solution Architecture**
   • End-to-end AI solutions
   • Performance optimization
   • Monitoring and maintenance

💡 **Just type "Module X" (where X is the number) to start practicing that module!**`,
        timestamp: new Date()
      };
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
      const response = await axios.post('http://localhost:8000/api/agents', {
        query: 'Hello, I would like to start a new study session. What can you help me with?'
      });
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.data,
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
            
            const currentQuestion = quizSession.questions[quizSession.currentQuestionIndex];
            if (!currentQuestion) {
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
                  {message.content}
                </div>
                <div className="message-actions">
                  <div className="message-time">
                    {formatTimestamp(message.timestamp)}
                  </div>
                  {canCheckAnswer && (
                    <button
                      className="check-answer-btn"
                      onClick={() => handleCheckAnswer(message.id, message.content, previousMessage.content)}
                      disabled={checkingAnswer === message.id}
                      title="Check your answer"
                    >
                      {checkingAnswer === message.id ? (
                        <Loader2 size={14} className="loading-spinner" />
                      ) : (
                        <CheckCircle size={14} />
                      )}
                    </button>
                  )}
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