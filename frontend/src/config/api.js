const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  FILTER_DATA: `${API_BASE_URL}/api/filter-data`,
  QUERY: `${API_BASE_URL}/api/query`,
  COMPANIES: `${API_BASE_URL}/api/companies`,
  CONTACTS: `${API_BASE_URL}/api/contacts`
};

export default API_BASE_URL;
