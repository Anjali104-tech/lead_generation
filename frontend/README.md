# Lead Generation Frontend

This is the frontend application for the Lead Generation system with dynamic filtering capabilities.

## Features

### Dynamic Sidebar Filters
The application now includes a comprehensive sidebar with dynamic filter data fetched from the backend API. All filter options are populated from the Crust API documentation and backend data sources.

#### Filter Categories:
- **Job Titles**: CEO, CTO, CFO, VP roles, Directors, Managers, etc.
- **Industries**: Complete industry list from `industry_data.js`
- **Regions**: Global regions from `region_data.js`
- **Company Size**: Employee count ranges (1-10, 11-50, etc.)
- **Annual Revenue**: Revenue ranges in millions USD
- **Seniority Levels**: Owner/Partner, CXO, VP, Director, etc.
- **Years of Experience**: Experience ranges (Less than 1 year, 1-2 years, etc.)
- **Departments**: Engineering, Sales, Marketing, Finance, etc.
- **Company Types**: Public, Private, Non-Profit, etc.
- **Profile Languages**: Multiple language options
- **Fortune Rankings**: Fortune 50, 51-100, etc.
- **Followers**: LinkedIn follower ranges
- **Boolean Filters**: Recently changed jobs, Posted on LinkedIn, In the news

#### API Endpoints:
- `GET /api/filter-data`: Returns all filter options dynamically
- `POST /api/parse-query`: Parses natural language queries into structured filters

#### Data Sources:
- **Industries**: From `backend/industry_data.js`
- **Regions**: From `backend/region_data.js`
- **Other Filters**: Based on Crust API documentation

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Make sure the backend server is running on port 5000

## Components

### Sidebar.js
The main sidebar component that:
- Fetches filter data dynamically from the backend
- Provides expandable/collapsible filter sections
- Includes loading and error states
- Supports multiple filter types (multi-select, range sliders, radio buttons)

### App.js
Updated to include the sidebar in a two-column layout with the main content area.

## Styling
- Uses Tailwind CSS for styling
- Custom CSS for range sliders and animations
- Responsive design with proper hover effects

## Filter Integration
The sidebar filters are designed to work with the existing query parser system. When filters are applied, they can be converted to the same format used by the natural language query parser for consistency.
