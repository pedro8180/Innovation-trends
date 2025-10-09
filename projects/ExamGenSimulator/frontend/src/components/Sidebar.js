import React, { useState, useEffect } from 'react';
import { Menu, X, Plus, MessageSquare, Trash2 } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar, chats, currentChatId, onSelectChat, onNewChat, onDeleteChat }) => {
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const getChatTitle = (chat) => {
    if (chat.title) return chat.title;
    const firstUserMessage = chat.messages.find(msg => msg.type === 'user');
    if (firstUserMessage) {
      return firstUserMessage.content.slice(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
    }
    return 'New Chat';
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar} />}
      
      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="sidebar-header">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          {isOpen && (
            <button className="new-chat-btn btn btn-primary" onClick={onNewChat}>
              <Plus size={16} />
              New Chat
            </button>
          )}
        </div>

        {isOpen && (
          <div className="sidebar-content">
            <div className="chat-history">
              <h3 className="history-title">Chat History</h3>
              <div className="chat-list">
                {chats.length === 0 ? (
                  <div className="no-chats">
                    <MessageSquare size={24} />
                    <p>No chat history yet</p>
                  </div>
                ) : (
                  chats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`chat-item ${currentChatId === chat.id ? 'active' : ''}`}
                      onClick={() => onSelectChat(chat.id)}
                    >
                      <div className="chat-item-content">
                        <div className="chat-title">{getChatTitle(chat)}</div>
                        <div className="chat-date">{formatDate(chat.createdAt)}</div>
                      </div>
                      <button
                        className="delete-chat-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(chat.id);
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;