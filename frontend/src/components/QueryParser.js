import React, { useState } from 'react';
import axios from 'axios';

const QueryParser = ({ parsedFilters, onQueryParsed }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:5000/api/parse-query', {
        query: query.trim()
      });
      
      // Call the callback to update parent state
      onQueryParsed(response.data);
    } catch (err) {
      console.error('Error parsing query:', err);
      setError(
        err.response?.data?.error || 
        'Failed to parse query. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card max-w-6xl mx-auto ">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        Smart Query Parser
      </h2>
      
      <p className="text-gray-600 mb-6">
        Enter your query in natural language, and our AI will convert it into structured filters.
      </p>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-700">
          Example: "Fintech startups with company headcount growth between 10-50% and annual revenue over $1M"
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>Tip:</strong> For better contact search results, include at least one company-related filter (Industry, Region, Company Size, etc.) along with people-focused filters.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <input
            type="text"
            className="input-field mb-4"
            placeholder="E.g., Find CFOs in fintech startups with 100-500 employees"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          
          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Parsing...
              </div>
            ) : (
              'Parse Query'
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}
    </div>
  );
};

export default QueryParser;