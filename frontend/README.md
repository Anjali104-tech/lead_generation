# Lead Generation Frontend

A modern React application for lead generation with a beautiful Tailwind CSS UI.

## Features

- **Smart Query Parser**: Convert natural language queries into structured filters
- **Company Search**: Find companies based on industry, keywords, and regions
- **Contact Discovery**: Find contacts within selected companies
- **Export Functionality**: Export contacts to CSV format
- **Responsive Design**: Beautiful, modern UI built with Tailwind CSS

## Tech Stack

- **React 19**: Latest React with hooks and functional components
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Axios**: HTTP client for API communication
- **PostCSS**: CSS processing with autoprefixer

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── QueryParser.js      # Main query parsing interface
│   ├── CompanyResults.js   # Company search and selection
│   └── ContactSearch.js    # Contact discovery and export
├── App.js                  # Main application component
├── index.js               # Application entry point
└── index.css              # Tailwind CSS imports and custom styles
```

## UI Components

### Custom Tailwind Classes

The application uses custom Tailwind classes defined in `index.css`:

- `.btn-primary`: Primary button with gradient background
- `.btn-secondary`: Secondary button with border
- `.card`: Card component with shadow and hover effects
- `.input-field`: Styled input fields with focus states

### Color Scheme

- **Primary**: Blue gradient (`blue-600` to `blue-700`)
- **Secondary**: Purple gradient (`purple-600` to `pink-600`)
- **Success**: Green tones
- **Error**: Red tones
- **Warning**: Orange tones

## API Integration

The frontend communicates with the backend API endpoints:

- `POST /api/parse-query`: Parse natural language queries
- `POST /api/find-companies`: Search for companies
- `POST /api/find-contacts`: Find contacts within companies

## Responsive Design

The application is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development

### Available Scripts

- `npm start`: Runs the app in development mode
- `npm test`: Launches the test runner
- `npm run build`: Builds the app for production
- `npm run eject`: Ejects from Create React App (not recommended)

### Code Style

- Use functional components with hooks
- Follow Tailwind CSS utility-first approach
- Maintain consistent spacing and typography
- Use semantic HTML elements

## Recent Changes

### Tailwind CSS Migration

The application has been successfully migrated from Material-UI to Tailwind CSS:

- ✅ Removed Material-UI dependencies
- ✅ Installed and configured Tailwind CSS
- ✅ Converted all components to use Tailwind classes
- ✅ Maintained all functionality and visual appeal
- ✅ Improved performance and bundle size
- ✅ Enhanced customizability and maintainability

### Benefits of Tailwind CSS

- **Smaller bundle size**: No large component library
- **Better performance**: No runtime CSS-in-JS overhead
- **More customizable**: Direct control over styling
- **Faster development**: Utility-first approach
- **Better maintainability**: No component library version dependencies
