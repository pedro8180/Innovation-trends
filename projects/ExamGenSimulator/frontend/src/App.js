import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import './App.css';
import { apiService } from './services/api';

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
    // Load chats from backend if available, otherwise fallback to localStorage
    const loadChats = async () => {
      try {
        const serverChats = await apiService.listChats();
        if (Array.isArray(serverChats) && serverChats.length > 0) {
          // map server structure to frontend shape
          const mapped = serverChats.map(c => ({
            id: c.id,
            title: c.name || null,
            messages: [],
            createdAt: c.created_at || new Date(),
            updatedAt: c.created_at || new Date()
          }));
          setChats(mapped);

          const mostRecent = mapped[0];
          setCurrentChatId(mostRecent.id);
          setCurrentMessages(mostRecent.messages);
          return;
        }
      } catch (err) {
        // fallback to localStorage
        const savedChats = localStorage.getItem('examgen-chats');
        if (savedChats) {
          const parsedChats = JSON.parse(savedChats);
          setChats(parsedChats);
          if (parsedChats.length > 0) {
            const mostRecent = parsedChats[0];
            setCurrentChatId(mostRecent.id);
            setCurrentMessages(mostRecent.messages);
          }
        }
      }
    };

    loadChats();
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

  const handleNewChat = async () => {
    try {
      const result = await apiService.createChat();
      const newChatId = result.chat_id;
      const newChat = {
        id: newChatId,
        title: null,
        messages: [
          {
            id: Date.now(),
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
    } catch (err) {
      console.error('Failed to create chat on server, falling back locally', err);
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
    }
  };

  const handleSelectChat = (chatId) => {
    // Fetch messages from backend for selected chat
    const loadChat = async () => {
      try {
        const resp = await apiService.getChat(chatId);
        const msgs = (resp.messages || []).map(m => ({
          id: m.id,
          type: m.role === 'user' ? 'user' : 'bot',
          content: m.content,
          timestamp: new Date(m.timestamp)
        }));

        // Update local chats list with messages
        setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: msgs } : c));
        setCurrentChatId(chatId);
        setCurrentMessages(msgs.length ? msgs : []);
        setSidebarOpen(false);
      } catch (err) {
        console.error('Failed to load chat from server, falling back to local', err);
        const selectedChat = chats.find(chat => chat.id === chatId);
        if (selectedChat) {
          setCurrentChatId(chatId);
          setCurrentMessages(selectedChat.messages);
          setSidebarOpen(false);
        }
      }
    };

    loadChat();
  };

  const handleDeleteChat = (chatId) => {
    const doDelete = async () => {
      try {
        await apiService.deleteChat(chatId);
      } catch (err) {
        console.warn('Failed to delete chat on server, deleting locally', err);
      }

      setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
      if (currentChatId === chatId) {
        handleNewChat();
      }
    };

    doDelete();
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
            {/* Only show welcome section if no user messages have been sent */}
            {currentMessages.length <= 1 && (
              <div className="welcome-section fade-in">
                <h1 className="welcome-title">
                  Exam Generator <span className="text-primary">Simulator</span>
                </h1>
                <p className="welcome-subtitle">
                  AI-powered exam preparation with intelligent question generation
                </p>
              </div>
            )}
            
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