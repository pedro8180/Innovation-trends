import React from 'react';
import './ModuleList.css';

const ModuleList = ({ modules, onModuleSelect }) => {
  return (
    <div className="module-list">
      <h3>Available AI-102 Certification Modules</h3>
      <div className="module-grid">
        {modules.map((module) => (
          <div 
            key={module.number}
            className="module-card"
            onClick={() => onModuleSelect(module.number)}
          >
            <h4>Module {module.number}: {module.title}</h4>
            <ul>
              {module.topics.map((topic, index) => (
                <li key={index}>{topic}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="module-instruction">Click on any module to start practicing!</p>
    </div>
  );
};

export default ModuleList;