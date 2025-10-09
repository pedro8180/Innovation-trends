import React from 'react';
import { Heart } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <p className="footer-text">
            Made with <Heart size={16} className="heart-icon" /> using Avanade design system
          </p>
          <p className="footer-year">
            © 2025 Exam Generator Simulator
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;