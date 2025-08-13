import React, { useState } from 'react';
import axios from 'axios';
import CompanyResults from './CompanyResults';

const QueryParser = () => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    // Clear previous filters to hide previous results immediately
    setFilters(null);
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:5000/api/parse-query', {
        query: query.trim()
      });
      
      // Set new filters only after successful response
      setFilters(response.data);
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

  // Helper function to render filter values
  const renderFilterValue = (filterKey, value) => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return <span className="text-gray-500 text-sm">None specified</span>;
    }

    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-2">
          {value.map((item, index) => (
            <span 
              key={index} 
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm font-medium"
            >
              {item}
            </span>
          ))}
        </div>
      );
    }

    if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
      // Handle department-specific filters with sub_filter
      if (value.sub_filter) {
        return (
          <div className="flex flex-col gap-1">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm font-medium">
              {value.min} - {value.max}
            </span>
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
              {value.sub_filter} Department
            </span>
          </div>
        );
      }
      
      // Handle regular range filters
      return (
        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm font-medium">
          {value.min} - {value.max}
        </span>
      );
    }

    if (typeof value === 'boolean') {
      return (
        <span className={`px-3 py-1 rounded-md text-sm font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Yes' : 'No'}
        </span>
      );
    }

    return (
      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm font-medium">
        {value}
      </span>
    );
  };



  return (
    <div className="card max-w-6xl mx-auto">
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

      {filters && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <span className="mr-2">🔍</span>
            Parsed Filters
          </h3>
          

          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Job Titles */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-3">
                Job Titles:
              </h4>
              {renderFilterValue('CURRENT_TITLE', filters.CURRENT_TITLE)}
            </div>
            
            {/* Industries */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-purple-800 mb-3">
                Industries:
              </h4>
              {renderFilterValue('INDUSTRY', filters.INDUSTRY)}
            </div>
            
            {/* Specializations/Tags */}
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-cyan-800 mb-3">
                Specializations/Tags:
              </h4>
              {renderFilterValue('TAGS', filters.TAGS)}
            </div>
            
            {/* Regions */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-orange-800 mb-3">
                Regions:
              </h4>
              {renderFilterValue('REGION', filters.REGION)}
            </div>

            {/* Company Headcount */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-800 mb-3">
                Company Headcount:
              </h4>
              {renderFilterValue('COMPANY_HEADCOUNT', filters.COMPANY_HEADCOUNT)}
            </div>

            {/* Company Headcount Growth */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-emerald-800 mb-3">
                Company Headcount Growth (%):
              </h4>
              {renderFilterValue('COMPANY_HEADCOUNT_GROWTH', filters.COMPANY_HEADCOUNT_GROWTH)}
            </div>

            {/* Annual Revenue */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-3">
                Annual Revenue (Million USD):
              </h4>
              {renderFilterValue('ANNUAL_REVENUE', filters.ANNUAL_REVENUE)}
            </div>

            {/* Department Headcount */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-indigo-800 mb-3">
                Department Headcount:
              </h4>
              {renderFilterValue('DEPARTMENT_HEADCOUNT', filters.DEPARTMENT_HEADCOUNT)}
            </div>

            {/* Department Headcount Growth */}
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-pink-800 mb-3">
                Department Headcount Growth:
              </h4>
              {renderFilterValue('DEPARTMENT_HEADCOUNT_GROWTH', filters.DEPARTMENT_HEADCOUNT_GROWTH)}
            </div>

            {/* Account Activities */}
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-teal-800 mb-3">
                Account Activities:
              </h4>
              {renderFilterValue('ACCOUNT_ACTIVITIES', filters.ACCOUNT_ACTIVITIES)}
            </div>

            {/* Job Opportunities */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-amber-800 mb-3">
                Job Opportunities:
              </h4>
              {renderFilterValue('JOB_OPPORTUNITIES', filters.JOB_OPPORTUNITIES)}
            </div>

            {/* Keywords */}
            <div className="bg-lime-50 border border-lime-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-lime-800 mb-3">
                Keywords:
              </h4>
              {renderFilterValue('KEYWORD', filters.KEYWORD)}
            </div>

            {/* Current Company */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-red-800 mb-3">
                Current Company:
              </h4>
              {renderFilterValue('CURRENT_COMPANY', filters.CURRENT_COMPANY)}
            </div>

            {/* Years of Experience */}
            <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-violet-800 mb-3">
                Years of Experience:
              </h4>
              {renderFilterValue('YEARS_OF_EXPERIENCE', filters.YEARS_OF_EXPERIENCE)}
            </div>

            {/* Years at Current Company */}
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-rose-800 mb-3">
                Years at Current Company:
              </h4>
              {renderFilterValue('YEARS_AT_CURRENT_COMPANY', filters.YEARS_AT_CURRENT_COMPANY)}
            </div>

            {/* Years in Current Position */}
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-sky-800 mb-3">
                Years in Current Position:
              </h4>
              {renderFilterValue('YEARS_IN_CURRENT_POSITION', filters.YEARS_IN_CURRENT_POSITION)}
            </div>

            {/* Seniority Level */}
            <div className="bg-fuchsia-50 border border-fuchsia-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-fuchsia-800 mb-3">
                Seniority Level:
              </h4>
              {renderFilterValue('SENIORITY_LEVEL', filters.SENIORITY_LEVEL)}
            </div>

            {/* Recently Changed Jobs */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-slate-800 mb-3">
                Recently Changed Jobs:
              </h4>
              {filters.RECENTLY_CHANGED_JOBS ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Yes
                </span>
              ) : (
                <span className="text-gray-500 text-sm">Not specified</span>
              )}
            </div>

            {/* Posted on LinkedIn */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-zinc-800 mb-3">
                Posted on LinkedIn:
              </h4>
              {filters.POSTED_ON_LINKEDIN ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Yes
                </span>
              ) : (
                <span className="text-gray-500 text-sm">Not specified</span>
              )}
            </div>

            {/* In the News */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-neutral-800 mb-3">
                In the News:
              </h4>
              {filters.IN_THE_NEWS ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Yes
                </span>
              ) : (
                <span className="text-gray-500 text-sm">Not specified</span>
              )}
            </div>
          </div>
          
          <hr className="my-6 border-gray-200" />
          
          {/* Company results component */}
          <CompanyResults parsedFilters={filters} />
        </div>
      )}
    </div>
  );
};

export default QueryParser;