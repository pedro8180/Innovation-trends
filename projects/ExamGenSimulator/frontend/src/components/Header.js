import React from 'react';
import { BookOpen, Zap, Menu } from 'lucide-react';
import './Header.css';

const Header = ({ toggleSidebar }) => {
  return (
    <header className="header">
      <div className="container">
      <div className="header-content">
        <div className="header-left">
          <button className="mobile-menu-btn" onClick={toggleSidebar}>
            <Menu size={20} />
          </button>
          <div className="logo">
            <div className="logo-icon">
              <BookOpen size={28} />
            </div>
            <span className="logo-text">ExamGen</span>
          </div>
        </div>          <nav className="nav">
            <div className="nav-item">
              <Zap size={16} />
              <span>AI Powered</span>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;