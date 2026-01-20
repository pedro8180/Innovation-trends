# Exam Generator Simulator - Frontend

A modern React frontend for the Exam Generator Simulator, built with the Avanade design system and color palette.

## Features

- 🎨 **Avanade Design System**: Built using the official Avanade color palette and gradients
- 💬 **Interactive Chat Interface**: Real-time conversation with AI agents
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- ⚡ **Modern UI/UX**: Clean, intuitive interface with smooth animations
- 🔗 **API Integration**: Connects to FastAPI backend for AI agent interactions

## Color Palette Usage

The frontend follows the Avanade brand guidelines:

- **Primary**: Avanade Orange (`#FF6600`) - used sparingly for accents and CTAs
- **Background**: Avanade primary gradients - subtle luminous gradient
- **Supporting**: Carefully balanced use of secondary Avanade colors
- **Neutral**: Gray scale for text and UI elements

## Tech Stack

- **React 18** - Modern React with hooks
- **Axios** - HTTP client for API calls
- **Lucide React** - Beautiful, customizable icons
- **CSS3** - Custom CSS with CSS variables and modern features

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API running on `http://localhost:8000`

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd projects/ExamGenSimulator/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

This creates a `build` folder with optimized production files.

## Project Structure

```
src/
├── components/           # React components
│   ├── Header.js        # Top navigation header
│   ├── Footer.js        # Footer component
│   ├── ChatInterface.js # Main chat interface
│   └── *.css           # Component-specific styles
├── services/            # API and external services
│   └── api.js          # API client configuration
├── App.js              # Main application component
├── App.css             # Global app styles
├── index.js            # React entry point
└── index.css           # Global CSS variables and utilities
```

## API Integration

The frontend connects to your FastAPI backend at `http://localhost:8000/api/agents`. Make sure your backend server is running before starting the frontend.

### API Endpoints Used

- `POST /api/agents` - Send queries to AI agents

## Customization

### Colors

All colors are defined as CSS variables in `src/index.css`. You can easily customize the color scheme by modifying the `:root` variables.

### Components

Each component is self-contained with its own CSS file for easy maintenance and customization.

## Responsive Design

The application is fully responsive with breakpoints at:
- Mobile: `< 768px`
- Desktop: `>= 768px`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Tips

1. **Hot Reload**: The development server supports hot reload for instant feedback
2. **Error Handling**: The app includes comprehensive error handling for API calls
3. **Loading States**: Interactive loading indicators provide user feedback
4. **Accessibility**: Components follow accessibility best practices

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure your backend has CORS properly configured
2. **API Connection**: Verify the backend is running on `http://localhost:8000`
3. **Build Errors**: Clear `node_modules` and reinstall dependencies

### Backend Connection

If you're having issues connecting to the backend, check:
- Backend server is running
- CORS is configured in your FastAPI app
- API endpoint URLs match between frontend and backend

## Contributing

1. Follow the established component structure
2. Maintain the Avanade color palette guidelines
3. Ensure responsive design compatibility
4. Add proper error handling for new features