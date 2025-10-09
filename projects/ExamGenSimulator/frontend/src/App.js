import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [currentMessages, setCurrentMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your AI exam preparation assistant. Ask me to generate practice questions, explain concepts, or help you prepare for your certification exam.',
      timestamp: new Date()
    }
  ]);

  // Load chats from localStorage on component mount
  useEffect(() => {
    const savedChats = localStorage.getItem('examgen-chats');
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats);
      setChats(parsedChats);
      
      // Load the most recent chat
      if (parsedChats.length > 0) {
        const mostRecent = parsedChats[0];
        setCurrentChatId(mostRecent.id);
        setCurrentMessages(mostRecent.messages);
      }
    }
  }, []);

  // Save chats to localStorage whenever chats change
  useEffect(() => {
    localStorage.setItem('examgen-chats', JSON.stringify(chats));
  }, [chats]);

  // Update current chat messages when they change
  useEffect(() => {
    if (currentChatId) {
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === currentChatId 
            ? { ...chat, messages: currentMessages, updatedAt: new Date() }
            : chat
        )
      );
    }
  }, [currentMessages, currentChatId]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNewChat = () => {
    const newChatId = Date.now().toString();
    const newChat = {
      id: newChatId,
      title: null,
      messages: [
        {
          id: 1,
          type: 'bot',
          content: 'Hello! I\'m your AI exam preparation assistant. Ask me to generate practice questions, explain concepts, or help you prepare for your certification exam.',
          timestamp: new Date()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setChats(prevChats => [newChat, ...prevChats]);
    setCurrentChatId(newChatId);
    setCurrentMessages(newChat.messages);
    setSidebarOpen(false);
  };

  const handleSelectChat = (chatId) => {
    const selectedChat = chats.find(chat => chat.id === chatId);
    if (selectedChat) {
      setCurrentChatId(chatId);
      setCurrentMessages(selectedChat.messages);
      setSidebarOpen(false);
    }
  };

  const handleDeleteChat = (chatId) => {
    setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
    
    if (currentChatId === chatId) {
      // If deleting current chat, create a new one
      handleNewChat();
    }
  };

  return (
    <div className="App">
      <Sidebar 
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
      />
      
      <div className={`main-wrapper ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Header toggleSidebar={toggleSidebar} />
        <main className="main-content">
          <div className="container">
            <div className="welcome-section fade-in">
              <h1 className="welcome-title">
                Exam Generator <span className="text-primary">Simulator</span>
              </h1>
              <p className="welcome-subtitle">
                AI-powered exam preparation with intelligent question generation
              </p>
            </div>
            
            <ChatInterface 
              messages={currentMessages}
              setMessages={setCurrentMessages}
              isLoading={isLoading} 
              setIsLoading={setIsLoading}
              currentChatId={currentChatId}
            />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default App;