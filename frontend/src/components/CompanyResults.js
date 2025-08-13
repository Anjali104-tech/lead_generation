import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ContactSearch from './ContactSearch';

// Simple icon components
const BusinessIcon = () => <span className="text-lg">🏢</span>;
const IndustryIcon = () => <span className="text-lg">🏭</span>;
const LocationIcon = () => <span className="text-lg">📍</span>;
const ExportIcon = () => <span className="text-lg">📊</span>;

const CompanyResults = ({ parsedFilters }) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [showContactSearch, setShowContactSearch] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLastPage, setIsLastPage] = useState(false);
  
  // Show contact search when companies are selected
  useEffect(() => {
    if (selectedCompanies.length > 0) {
      setShowContactSearch(true);
    } else {
      setShowContactSearch(false);
    }
  }, [selectedCompanies.length]);

  // Clear results when parsedFilters changes (new search)
  useEffect(() => {
    if (parsedFilters) {
      // Clear previous results
      setCompanies([]);
      setSelectedCompanies([]);
      setSelectedCompanyIds(new Map());
      setShowContactSearch(false);
      setIsPeopleFocusedSearch(false);
      setTotalCount(0);
      setTotalPages(1);
      setPage(1);
      setIsLastPage(false);
      // Don't automatically fetch - user will click "Search Companies" button
    }
  }, [parsedFilters]);

  // Only fetch companies when page changes AFTER initial search
  useEffect(() => {
    // Skip initial render
    if (page !== 1 && companies.length > 0) {
      fetchCompaniesForPage(page);
    }
  }, [page]);
  
  // Special function for pagination
  const fetchCompaniesForPage = async (pageNum) => {
    if (!parsedFilters) return;
    
    setPageLoading(true);
    setError('');
    
    try {
      // Use the same filter logic as fetchCompanies
      const filters = [];
      
      if (parsedFilters.INDUSTRY?.length > 0) {
        filters.push({
          filter_type: 'INDUSTRY',
          type: 'in',
          value: parsedFilters.INDUSTRY
        });
      }
      
      if (parsedFilters.TAGS?.length > 0) {
        // Take only the first tag as Crustdata allows only one keyword
        filters.push({
          filter_type: 'KEYWORD',
          type: 'in',
          value: [parsedFilters.TAGS[0]]
        });
      }
      
      if (parsedFilters.REGION?.length > 0) {
        // Use the original region names as they come from the backend with correct mapping
        const regionNames = parsedFilters.REGION;
        
        filters.push({
          filter_type: 'REGION',
          type: 'in',
          value: regionNames
        });
      }

      // Add company headcount filter if available
      if (parsedFilters.COMPANY_HEADCOUNT?.length > 0) {
        // Validate COMPANY_HEADCOUNT values against allowed values
        const validHeadcountValues = [
          "Self-employed", "1-10", "11-50", "51-200", "201-500", 
          "501-1,000", "1,001-5,000", "5,001-10,000", "10,001+"
        ];
        
        const validValues = parsedFilters.COMPANY_HEADCOUNT.filter(value => 
          validHeadcountValues.includes(value)
        );
        
        if (validValues.length > 0) {
          filters.push({
            filter_type: 'COMPANY_HEADCOUNT',
            type: 'in',
            value: validValues
          });
        } else {
          console.warn('Invalid COMPANY_HEADCOUNT values:', parsedFilters.COMPANY_HEADCOUNT);
          console.warn('Valid values are:', validHeadcountValues);
        }
      }

      // Add company headcount growth filter if available
      if (parsedFilters.COMPANY_HEADCOUNT_GROWTH && 
          (parsedFilters.COMPANY_HEADCOUNT_GROWTH.min !== undefined || 
           parsedFilters.COMPANY_HEADCOUNT_GROWTH.max !== undefined)) {
        filters.push({
          filter_type: 'COMPANY_HEADCOUNT_GROWTH',
          type: 'between',
          value: {
            min: parsedFilters.COMPANY_HEADCOUNT_GROWTH.min || 0,
            max: parsedFilters.COMPANY_HEADCOUNT_GROWTH.max || 100
          }
        });
      }

      // Add annual revenue filter if available
      if (parsedFilters.ANNUAL_REVENUE && 
          (parsedFilters.ANNUAL_REVENUE.min !== undefined || 
           parsedFilters.ANNUAL_REVENUE.max !== undefined)) {
        filters.push({
          filter_type: 'ANNUAL_REVENUE',
          type: 'between',
          value: {
            min: parsedFilters.ANNUAL_REVENUE.min || 0,
            max: parsedFilters.ANNUAL_REVENUE.max || 1000
          },
          sub_filter: 'USD' // Default to USD currency
        });
      }

      // Add department headcount filter if available (with proper sub_filter)
      if (parsedFilters.DEPARTMENT_HEADCOUNT && 
          (parsedFilters.DEPARTMENT_HEADCOUNT.min !== undefined || 
           parsedFilters.DEPARTMENT_HEADCOUNT.max !== undefined)) {
        // Default to Engineering if no department specified
        const department = parsedFilters.DEPARTMENT_HEADCOUNT.sub_filter || 'Engineering';
        filters.push({
          filter_type: 'DEPARTMENT_HEADCOUNT',
          type: 'between',
          value: {
            min: parsedFilters.DEPARTMENT_HEADCOUNT.min || 0,
            max: parsedFilters.DEPARTMENT_HEADCOUNT.max || 100
          },
          sub_filter: department
        });
      }

      // Add department headcount growth filter if available (with proper sub_filter)
      if (parsedFilters.DEPARTMENT_HEADCOUNT_GROWTH && 
          (parsedFilters.DEPARTMENT_HEADCOUNT_GROWTH.min !== undefined || 
           parsedFilters.DEPARTMENT_HEADCOUNT_GROWTH.max !== undefined)) {
        // Default to Engineering if no department specified
        const department = parsedFilters.DEPARTMENT_HEADCOUNT_GROWTH.sub_filter || 'Engineering';
        filters.push({
          filter_type: 'DEPARTMENT_HEADCOUNT_GROWTH',
          type: 'between',
          value: {
            min: parsedFilters.DEPARTMENT_HEADCOUNT_GROWTH.min || 0,
            max: parsedFilters.DEPARTMENT_HEADCOUNT_GROWTH.max || 50
          },
          sub_filter: department
        });
      }

      // Add account activities filter if available
      if (parsedFilters.ACCOUNT_ACTIVITIES?.length > 0) {
        filters.push({
          filter_type: 'ACCOUNT_ACTIVITIES',
          type: 'in',
          value: parsedFilters.ACCOUNT_ACTIVITIES
        });
      }

      // Add job opportunities filter if available
      if (parsedFilters.JOB_OPPORTUNITIES?.length > 0) {
        filters.push({
          filter_type: 'JOB_OPPORTUNITIES',
          type: 'in',
          value: parsedFilters.JOB_OPPORTUNITIES
        });
      }

      // Add years of experience filter if available
      if (parsedFilters.YEARS_OF_EXPERIENCE?.length > 0) {
        // Validate YEARS_OF_EXPERIENCE values against allowed values
        const validExperienceValues = [
          "Less than 1 year", "1 to 2 years", "3 to 5 years", 
          "6 to 10 years", "More than 10 years"
        ];
        
        const validValues = parsedFilters.YEARS_OF_EXPERIENCE.filter(value => 
          validExperienceValues.includes(value)
        );
        
        if (validValues.length > 0) {
          filters.push({
            filter_type: 'YEARS_OF_EXPERIENCE',
            type: 'in',
            value: validValues
          });
        } else {
          console.warn('Invalid YEARS_OF_EXPERIENCE values:', parsedFilters.YEARS_OF_EXPERIENCE);
          console.warn('Valid values are:', validExperienceValues);
        }
      }
      
      // Add years at current company filter if available
      if (parsedFilters.YEARS_AT_CURRENT_COMPANY?.length > 0) {
        // Validate YEARS_AT_CURRENT_COMPANY values against allowed values
        const validCompanyYearsValues = [
          "Less than 1 year", "1 to 2 years", "3 to 5 years", 
          "6 to 10 years", "More than 10 years"
        ];
        
        const validValues = parsedFilters.YEARS_AT_CURRENT_COMPANY.filter(value => 
          validCompanyYearsValues.includes(value)
        );
        
        if (validValues.length > 0) {
          filters.push({
            filter_type: 'YEARS_AT_CURRENT_COMPANY',
            type: 'in',
            value: validValues
          });
        } else {
          console.warn('Invalid YEARS_AT_CURRENT_COMPANY values:', parsedFilters.YEARS_AT_CURRENT_COMPANY);
          console.warn('Valid values are:', validCompanyYearsValues);
        }
      }
      
      // Add years in current position filter if available
      if (parsedFilters.YEARS_IN_CURRENT_POSITION?.length > 0) {
        // Validate YEARS_IN_CURRENT_POSITION values against allowed values
        const validPositionYearsValues = [
          "Less than 1 year", "1 to 2 years", "3 to 5 years", 
          "6 to 10 years", "More than 10 years"
        ];
        
        const validValues = parsedFilters.YEARS_IN_CURRENT_POSITION.filter(value => 
          validPositionYearsValues.includes(value)
        );
        
        if (validValues.length > 0) {
          filters.push({
            filter_type: 'YEARS_IN_CURRENT_POSITION',
            type: 'in',
            value: validValues
          });
        } else {
          console.warn('Invalid YEARS_IN_CURRENT_POSITION values:', parsedFilters.YEARS_IN_CURRENT_POSITION);
          console.warn('Valid values are:', validPositionYearsValues);
        }
      }

      // Note: We don't add KEYWORD filter again here since it's already added from TAGS
      // If there's a separate KEYWORD field, it would override the TAGS one
      if (parsedFilters.KEYWORD?.length > 0 && !parsedFilters.TAGS?.length) {
        filters.push({
          filter_type: 'KEYWORD',
          type: 'in',
          value: parsedFilters.KEYWORD
        });
      }

      const response = await axios.post('http://localhost:5000/api/find-companies', {
        filters: filters,
        page: pageNum,
        regionIds: parsedFilters.REGION_IDS || [],
        regionNames: parsedFilters.REGION || [] // Send region names along with IDs
      });
      
      // Extract companies from response based on format
      let companiesList = [];
      if (response.data && response.data.companies) {
        companiesList = response.data.companies;
      } else if (response.data && response.data.results) {
        companiesList = response.data.results;
      }
      
      // Update companies
      setCompanies(companiesList);
      
      // Update pagination info
      if (response.data.total_count) {
        setTotalCount(response.data.total_count);
      }
      
    } catch (err) {
      console.error('Error fetching companies for page:', err);
      setError('Failed to load page ' + pageNum);
    } finally {
      setPageLoading(false);
    }
  };

  const fetchCompanies = async (pageNum = 1) => {
    if (!parsedFilters) {
      setError('No filters provided');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Convert filters to the structure expected by the backend
      const filters = [];
      
      // FILTER CATEGORIZATION:
      // COMPANY-FOCUSED: company headcount, company headcount growth, account activities, 
      // job opportunities, keywords, annual revenue, region, industry, specifications/tags, 
      // department headcount, department headcount growth
      // PEOPLE-FOCUSED: recently changed jobs, posted on linkedin, in the news, 
      // years at current company, years in current position, years of experience, 
      // current title, seniority level, current company
      
      // Check if this is primarily a people search (has people-specific filters)
      // PEOPLE-FOCUSED FILTERS:
      // - recently changed jobs, posted on linkedin, in the news
      // - years at current company, years in current position, years of experience
      // - current title, seniority level, current company
      const hasPeopleFilters = parsedFilters.RECENTLY_CHANGED_JOBS === true ||
                              parsedFilters.POSTED_ON_LINKEDIN === true ||
                              parsedFilters.IN_THE_NEWS === true ||
                              parsedFilters.YEARS_OF_EXPERIENCE?.length > 0 ||
                              parsedFilters.YEARS_AT_CURRENT_COMPANY?.length > 0 ||
                              parsedFilters.YEARS_IN_CURRENT_POSITION?.length > 0 ||
                              parsedFilters.CURRENT_TITLE?.length > 0 ||
                              parsedFilters.SENIORITY_LEVEL?.length > 0 ||
                              parsedFilters.CURRENT_COMPANY?.length > 0;

      // If this is primarily a people search, we need to handle it differently
      if (hasPeopleFilters) {
        console.log('Detected people-focused search, will handle in contact search');
        
        // Check if we also have company-focused filters that we can use
        const hasCompanyFilters = parsedFilters.INDUSTRY?.length > 0 ||
                                 parsedFilters.REGION?.length > 0 ||
                                 parsedFilters.COMPANY_HEADCOUNT?.length > 0 ||
                                 parsedFilters.COMPANY_HEADCOUNT_GROWTH ||
                                 parsedFilters.ANNUAL_REVENUE ||
                                 parsedFilters.DEPARTMENT_HEADCOUNT ||
                                 parsedFilters.DEPARTMENT_HEADCOUNT_GROWTH ||
                                 parsedFilters.ACCOUNT_ACTIVITIES?.length > 0 ||
                                 parsedFilters.JOB_OPPORTUNITIES?.length > 0 ||
                                 parsedFilters.KEYWORD?.length > 0 ||
                                 parsedFilters.TAGS?.length > 0;
        
        if (hasCompanyFilters) {
          // We have company filters, so we can still do a company search
          console.log('People-focused search also has company filters, proceeding with company search');
        } else if (parsedFilters.CURRENT_COMPANY?.length > 0) {
          // Use the company name as a keyword to find the company
          filters.push({
            filter_type: 'KEYWORD',
            type: 'in',
            value: parsedFilters.CURRENT_COMPANY
          });
        } else {
          // Pure people-focused search - we still need to show company search first
          // because contact search requires companies to be selected
          console.log('Pure people-focused search detected, showing company search with people-focused indication');
          setIsPeopleFocusedSearch(true);
          // Don't return - continue with company search to show all companies
        }
      }
      
      // We can't use CURRENT_TITLE in company search API
      // Storing job titles for informational purposes only
      const jobTitles = parsedFilters.CURRENT_TITLE;
      console.log('Job titles (not used in API call):', jobTitles);
      
      // Add industry filter if available
      if (parsedFilters.INDUSTRY?.length > 0) {
        filters.push({
          filter_type: 'INDUSTRY',
          type: 'in',
          value: parsedFilters.INDUSTRY
        });
      }
      
      // Add tags/keywords filter if available (only one keyword allowed)
      if (parsedFilters.TAGS?.length > 0) {
        filters.push({
          filter_type: 'KEYWORD',
          type: 'in',
          value: [parsedFilters.TAGS[0]] // Take only the first tag as API allows max 1
        });
      }
      
      // Add region filter if available (only add once)
      if (parsedFilters.REGION?.length > 0) {
        filters.push({
          filter_type: 'REGION',
          type: 'in',
          value: parsedFilters.REGION
        });
      }

      // Add company headcount filter if available
      if (parsedFilters.COMPANY_HEADCOUNT?.length > 0) {
        // Validate COMPANY_HEADCOUNT values against allowed values
        const validHeadcountValues = [
          "Self-employed", "1-10", "11-50", "51-200", "201-500", 
          "501-1,000", "1,001-5,000", "5,001-10,000", "10,001+"
        ];
        
        const validValues = parsedFilters.COMPANY_HEADCOUNT.filter(value => 
          validHeadcountValues.includes(value)
        );
        
        if (validValues.length > 0) {
          filters.push({
            filter_type: 'COMPANY_HEADCOUNT',
            type: 'in',
            value: validValues
          });
        } else {
          console.warn('Invalid COMPANY_HEADCOUNT values:', parsedFilters.COMPANY_HEADCOUNT);
          console.warn('Valid values are:', validHeadcountValues);
        }
      }

      // Add company headcount growth filter if available
      if (parsedFilters.COMPANY_HEADCOUNT_GROWTH && 
          (parsedFilters.COMPANY_HEADCOUNT_GROWTH.min !== undefined || 
           parsedFilters.COMPANY_HEADCOUNT_GROWTH.max !== undefined)) {
        filters.push({
          filter_type: 'COMPANY_HEADCOUNT_GROWTH',
          type: 'between',
          value: {
            min: parsedFilters.COMPANY_HEADCOUNT_GROWTH.min || 0,
            max: parsedFilters.COMPANY_HEADCOUNT_GROWTH.max || 100
          }
        });
      }

      // Add annual revenue filter if available
      if (parsedFilters.ANNUAL_REVENUE && 
          (parsedFilters.ANNUAL_REVENUE.min !== undefined || 
           parsedFilters.ANNUAL_REVENUE.max !== undefined)) {
        filters.push({
          filter_type: 'ANNUAL_REVENUE',
          type: 'between',
          value: {
            min: parsedFilters.ANNUAL_REVENUE.min || 0,
            max: parsedFilters.ANNUAL_REVENUE.max || 1000
          },
          sub_filter: 'USD' // Default to USD currency
        });
      }

      // Add department headcount filter if available (with proper sub_filter)
      if (parsedFilters.DEPARTMENT_HEADCOUNT && 
          (parsedFilters.DEPARTMENT_HEADCOUNT.min !== undefined || 
           parsedFilters.DEPARTMENT_HEADCOUNT.max !== undefined)) {
        // Default to Engineering if no department specified
        const department = parsedFilters.DEPARTMENT_HEADCOUNT.sub_filter || 'Engineering';
        filters.push({
          filter_type: 'DEPARTMENT_HEADCOUNT',
          type: 'between',
          value: {
            min: parsedFilters.DEPARTMENT_HEADCOUNT.min || 0,
            max: parsedFilters.DEPARTMENT_HEADCOUNT.max || 100
          },
          sub_filter: department
        });
      }

      // Add department headcount growth filter if available (with proper sub_filter)
      if (parsedFilters.DEPARTMENT_HEADCOUNT_GROWTH && 
          (parsedFilters.DEPARTMENT_HEADCOUNT_GROWTH.min !== undefined || 
           parsedFilters.DEPARTMENT_HEADCOUNT_GROWTH.max !== undefined)) {
        // Default to Engineering if no department specified
        const department = parsedFilters.DEPARTMENT_HEADCOUNT_GROWTH.sub_filter || 'Engineering';
        filters.push({
          filter_type: 'DEPARTMENT_HEADCOUNT_GROWTH',
          type: 'between',
          value: {
            min: parsedFilters.DEPARTMENT_HEADCOUNT_GROWTH.min || 0,
            max: parsedFilters.DEPARTMENT_HEADCOUNT_GROWTH.max || 50
          },
          sub_filter: department
        });
      }

      // Add account activities filter if available
      if (parsedFilters.ACCOUNT_ACTIVITIES?.length > 0) {
        filters.push({
          filter_type: 'ACCOUNT_ACTIVITIES',
          type: 'in',
          value: parsedFilters.ACCOUNT_ACTIVITIES
        });
      }

      // Add job opportunities filter if available
      if (parsedFilters.JOB_OPPORTUNITIES?.length > 0) {
        filters.push({
          filter_type: 'JOB_OPPORTUNITIES',
          type: 'in',
          value: parsedFilters.JOB_OPPORTUNITIES
        });
      }

      // Add years of experience filter if available
      if (parsedFilters.YEARS_OF_EXPERIENCE?.length > 0) {
        // Validate YEARS_OF_EXPERIENCE values against allowed values
        const validExperienceValues = [
          "Less than 1 year", "1 to 2 years", "3 to 5 years", 
          "6 to 10 years", "More than 10 years"
        ];
        
        const validValues = parsedFilters.YEARS_OF_EXPERIENCE.filter(value => 
          validExperienceValues.includes(value)
        );
        
        if (validValues.length > 0) {
          filters.push({
            filter_type: 'YEARS_OF_EXPERIENCE',
            type: 'in',
            value: validValues
          });
        } else {
          console.warn('Invalid YEARS_OF_EXPERIENCE values:', parsedFilters.YEARS_OF_EXPERIENCE);
          console.warn('Valid values are:', validExperienceValues);
        }
      }
      
      // Add years at current company filter if available
      if (parsedFilters.YEARS_AT_CURRENT_COMPANY?.length > 0) {
        // Validate YEARS_AT_CURRENT_COMPANY values against allowed values
        const validCompanyYearsValues = [
          "Less than 1 year", "1 to 2 years", "3 to 5 years", 
          "6 to 10 years", "More than 10 years"
        ];
        
        const validValues = parsedFilters.YEARS_AT_CURRENT_COMPANY.filter(value => 
          validCompanyYearsValues.includes(value)
        );
        
        if (validValues.length > 0) {
          filters.push({
            filter_type: 'YEARS_AT_CURRENT_COMPANY',
            type: 'in',
            value: validValues
          });
        } else {
          console.warn('Invalid YEARS_AT_CURRENT_COMPANY values:', parsedFilters.YEARS_AT_CURRENT_COMPANY);
          console.warn('Valid values are:', validCompanyYearsValues);
        }
      }
      
      // Add years in current position filter if available
      if (parsedFilters.YEARS_IN_CURRENT_POSITION?.length > 0) {
        // Validate YEARS_IN_CURRENT_POSITION values against allowed values
        const validPositionYearsValues = [
          "Less than 1 year", "1 to 2 years", "3 to 5 years", 
          "6 to 10 years", "More than 10 years"
        ];
        
        const validValues = parsedFilters.YEARS_IN_CURRENT_POSITION.filter(value => 
          validPositionYearsValues.includes(value)
        );
        
        if (validValues.length > 0) {
          filters.push({
            filter_type: 'YEARS_IN_CURRENT_POSITION',
            type: 'in',
            value: validValues
          });
        } else {
          console.warn('Invalid YEARS_IN_CURRENT_POSITION values:', parsedFilters.YEARS_IN_CURRENT_POSITION);
          console.warn('Valid values are:', validPositionYearsValues);
        }
      }

      // Note: We don't add KEYWORD filter again here since it's already added from TAGS
      // If there's a separate KEYWORD field, it would override the TAGS one
      if (parsedFilters.KEYWORD?.length > 0 && !parsedFilters.TAGS?.length) {
        filters.push({
          filter_type: 'KEYWORD',
          type: 'in',
          value: parsedFilters.KEYWORD
        });
      }
      
      console.log('Sending filters to API:', filters);
      
      // Check if we have any valid company filters
      if (filters.length === 0) {
        if (isPeopleFocusedSearch) {
          // For people-focused searches without company filters, show helpful message
          console.log('People-focused search without company filters - showing helpful message');
          setError('This search is focused on people. Please search for companies first (e.g., "Find all companies" or "Find fintech companies") and then select them to search for contacts.');
          setLoading(false);
          return;
        } else {
          setError('No valid company filters found. This search appears to be focused on people. Please use the "Find Contacts" feature after selecting companies.');
          setLoading(false);
          return;
        }
      }
      
      // Call the backend API with both region names and IDs if available
      const response = await axios.post('http://localhost:5000/api/find-companies', {
        filters: filters,
        page: pageNum,
        regionIds: parsedFilters.REGION_IDS || [],
        regionNames: parsedFilters.REGION // Send cleaned region names
      });
      
      console.log('API response:', response.data);
      
      // Check if there's an error in the response
      if (response.data.error) {
        // Handle "No more results available" error
        if (response.data.error === "No more results available") {
          // Go back to the previous page since there are no more results
          const previousPage = Math.max(pageNum - 1, 1);
          setPage(previousPage);
          setError('No more results available. Returning to previous page.');
          
          // If we're already on page 1, just show the current results
          if (previousPage === 1) {
            setError('No more results available.');
          } else {
            // Fetch the previous page
            fetchCompaniesForPage(previousPage);
            return;
          }
        } else {
          setError(response.data.error);
        }
        setCompanies([]);
        setIsLastPage(true);
        return;
      }
      
      // Extract companies from response based on format
      let companiesList = [];
      if (response.data && response.data.companies) {
        companiesList = response.data.companies;
      } else if (response.data && response.data.results) {
        // Handle API response format variance
        companiesList = response.data.results;
      }
      
      // Set companies
      setCompanies(companiesList);
      
      // Set pagination info
      const totalCountValue = parseInt(response.data.total_count) || 0;
      
      if (totalCountValue > 0) {
        setTotalCount(totalCountValue);
        
        // Use consistent page size of 10 (matching backend)
        const pageSize = 10;
        const calculatedTotalPages = Math.max(Math.ceil(totalCountValue / pageSize), 1);
        setTotalPages(calculatedTotalPages);
        
        // Check if this is the last page
        const isLastPage = pageNum >= calculatedTotalPages || companiesList.length < pageSize;
        setIsLastPage(isLastPage);
        
        // If current page exceeds total pages, adjust it
        if (pageNum > calculatedTotalPages) {
          setPage(calculatedTotalPages);
          setIsLastPage(true);
        }
      } else {
        // If no total count is provided, use the number of companies returned
        setTotalCount(companiesList.length);
        
        // Use consistent page size of 10
        const pageSize = 10;
        const calculatedTotalPages = Math.max(Math.ceil(companiesList.length / pageSize), 1);
        setTotalPages(calculatedTotalPages);
        
        // If we got fewer companies than page size, this is the last page
        const isLastPage = companiesList.length < pageSize;
        setIsLastPage(isLastPage);
      }
      
      if (companiesList.length === 0) {
        setError('No companies found matching these filters');
        setIsLastPage(true);
      }
      
    } catch (err) {
      console.error('Error fetching companies:', err);
      console.error('Error details:', err.response?.data);
      
      setError(err.response?.data?.error || 'Failed to fetch companies');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  // Get a unique identifier for a company
  const getCompanyUniqueId = (company) => {
    // Try various possible unique identifiers in order of preference
    return company.linkedin_company_id || 
           company.company_id || 
           company.id || 
           (company.name && company.location ? `${company.name}-${company.location}` : null);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Use a Map for faster lookups of selected companies
  const [selectedCompanyIds, setSelectedCompanyIds] = useState(new Map());
  const [isPeopleFocusedSearch, setIsPeopleFocusedSearch] = useState(false);
  
  // Toggle company selection - optimized version
  const handleToggle = (company) => () => {
    const companyId = getCompanyUniqueId(company);
    
    if (!companyId) {
      console.error('Unable to identify unique company ID', company);
      return;
    }
    
    // Create new copies for state updates
    const newSelectedCompanies = [...selectedCompanies];
    const newSelectedIds = new Map(selectedCompanyIds);
    
    if (selectedCompanyIds.has(companyId)) {
      // Remove the company if already selected
      const indexToRemove = selectedCompanies.findIndex(c => getCompanyUniqueId(c) === companyId);
      if (indexToRemove !== -1) {
        newSelectedCompanies.splice(indexToRemove, 1);
      }
      newSelectedIds.delete(companyId);
    } else {
      // Add the company if not yet selected
      newSelectedCompanies.push(company);
      newSelectedIds.set(companyId, true);
    }

    // Update both state variables
    setSelectedCompanies(newSelectedCompanies);
    setSelectedCompanyIds(newSelectedIds);
  };

  // Check if a company is selected - optimized version
  const isSelected = (company) => {
    const companyId = getCompanyUniqueId(company);
    if (!companyId) return false;
    return selectedCompanyIds.has(companyId);
  };

  const isAllSelected = () => {
    return companies.length > 0 && selectedCompanies.length === companies.length;
  };

  const isIndeterminate = () => {
    return selectedCompanies.length > 0 && selectedCompanies.length < companies.length;
  };

  const handleSelectAll = () => {
    if (isAllSelected()) {
      setSelectedCompanies([]);
      setSelectedCompanyIds(new Map());
    } else {
      setSelectedCompanies([...companies]);
      const newSelectedIds = new Map();
      companies.forEach(company => {
        const companyId = getCompanyUniqueId(company);
        if (companyId) {
          newSelectedIds.set(companyId, true);
        }
      });
      setSelectedCompanyIds(newSelectedIds);
    }
  };

  const exportCompanies = () => {
    // Future implementation for exporting to CSV/Excel
    console.log('Exporting companies:', selectedCompanies);
  };

  return (
    <div className="card mt-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          {isPeopleFocusedSearch ? 'Company Search (People-Focused)' : 'Company Search'}
        </h3>
        <button 
          onClick={() => {
            setPage(1); 
            fetchCompanies(1);
          }}
          disabled={loading || !parsedFilters}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Search Companies
        </button>
      </div>
      
      {!isPeopleFocusedSearch && parsedFilters?.CURRENT_TITLE?.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
          Note: Job titles ({parsedFilters.CURRENT_TITLE.join(", ")}) will be used for filtering leads after company selection. 
          Company search only uses industry and keyword filters.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Show people-focused search notification */}
      {isPeopleFocusedSearch && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
          <p className="font-medium">People-focused search detected!</p>
          <p>Please search for companies first, then select them to search for contacts with your specified criteria.</p>
        </div>
      )}

      {!isPeopleFocusedSearch && companies.length > 0 && (
        <>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <p className="text-gray-700">
                Found <strong>{totalCount.toLocaleString()}</strong> companies
                {totalPages > 1 && ` (Page ${page} of ${totalPages})`}
              </p>
              <p className={`font-medium ${selectedCompanies.length > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                Selected: {selectedCompanies.length}
              </p>
            </div>
          </div>

          <hr className="mb-6 border-gray-200" />

          <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            {pageLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-90 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-blue-600 font-medium">Loading Page {page}...</p>
                </div>
              </div>
            )}
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-700 w-1/10">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isAllSelected()}
                          ref={(input) => {
                            if (input) input.indeterminate = isIndeterminate();
                          }}
                          onChange={handleSelectAll}
                          className="mr-2 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium">Select All</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 w-2/5">
                      <div className="flex items-center">
                        <BusinessIcon />
                        <span className="ml-2">Company Name</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 w-3/10">
                      <div className="flex items-center">
                        <IndustryIcon />
                        <span className="ml-2">Industry</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 w-1/5">
                      <div className="flex items-center">
                        <LocationIcon />
                        <span className="ml-2">Location</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company, index) => {
                    const companyId = getCompanyUniqueId(company);
                    const isItemSelected = isSelected(company);

                    return (
                      <tr 
                        key={companyId || `company-${index}`}
                        onClick={handleToggle(company)}
                        className={`hover:bg-gray-50 transition-colors duration-200 cursor-pointer ${
                          isItemSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isItemSelected}
                            onChange={handleToggle(company)}
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">
                            {company.name || company.company_name}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-600 font-medium">
                            {company.industry || company.industries || "N/A"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-600 font-medium">
                            {company.location || "N/A"}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {selectedCompanies.length > 0 && (
            <div className="mt-6">
              <button
                onClick={exportCompanies}
                disabled={selectedCompanies.length === 0}
                className="btn-secondary"
              >
                <ExportIcon />
                <span className="ml-2">Export Selected ({selectedCompanies.length})</span>
              </button>
            </div>
          )}
          
          {/* Pagination controls - only show when there are multiple pages */}
          {totalPages > 1 && (
            <div className="mt-6 p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="flex justify-center">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={page === 1 || pageLoading}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    First
                  </button>
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1 || pageLoading}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-2 text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={isLastPage || pageLoading || companies.length === 0}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={isLastPage || pageLoading || companies.length === 0}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Last
                  </button>
                </div>
              </div>
              <p className="text-center text-gray-600 mt-2 font-medium">
                Showing {companies.length} of {totalCount.toLocaleString()} companies
              </p>
            </div>
          )}
          
          {/* Show results summary when all results are on one page */}
          {totalPages === 1 && totalCount > 0 && (
            <div className="mt-6 p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <p className="text-center text-gray-600 font-medium">
                Showing all {totalCount.toLocaleString()} companies
              </p>
            </div>
          )}
        </>
      )}

      {!isPeopleFocusedSearch && !loading && companies.length === 0 && !error && (
        <div className="py-8 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
            <h4 className="text-lg font-semibold text-blue-800 mb-2">
              Ready to discover companies
            </h4>
            <p className="text-gray-600 max-w-md mx-auto">
              Click the "Search Companies" button above to find matching companies based on your filters.
            </p>
          </div>
        </div>
      )}
      
      {/* Contacts search section */}
      {(showContactSearch || isPeopleFocusedSearch) && (
        <ContactSearch 
          selectedCompanies={selectedCompanies}
          jobTitles={parsedFilters?.CURRENT_TITLE}
          parsedFilters={parsedFilters}
        />
      )}
    </div>
  );
};

export default CompanyResults;