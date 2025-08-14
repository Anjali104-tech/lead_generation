import React, { useState, useEffect } from "react";
import axios from "axios";
import ContactSearch from "./ContactSearch";

// Simple icon components
const BusinessIcon = () => <span className="text-lg">🏢</span>;
const IndustryIcon = () => <span className="text-lg">🏭</span>;
const LocationIcon = () => <span className="text-lg">📍</span>;
const ExportIcon = () => <span className="text-lg">📊</span>;

const CompanyResults = ({ parsedFilters }) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState("");
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
      
      // Use the _source flag for more reliable detection
      const isFromSidebar = parsedFilters._source === 'sidebar';
      const isFromQueryParser = parsedFilters._source === 'query_parser';
      
      // Debug logging
      console.log("=== Filter Detection Debug ===");
      console.log("parsedFilters:", parsedFilters);
      console.log("_source:", parsedFilters._source);
      console.log("isFromSidebar:", isFromSidebar);
      console.log("isFromQueryParser:", isFromQueryParser);
      console.log("INDUSTRY:", parsedFilters.INDUSTRY);
      console.log("REGION:", parsedFilters.REGION);
      console.log("COMPANY_HEADCOUNT:", parsedFilters.COMPANY_HEADCOUNT);
      console.log("SENIORITY_LEVEL:", parsedFilters.SENIORITY_LEVEL);
      console.log("KEYWORD:", parsedFilters.KEYWORD);
      console.log("TAGS:", parsedFilters.TAGS);
      console.log("CURRENT_COMPANY:", parsedFilters.CURRENT_COMPANY);
      console.log("=============================");
      
      // Simple and clear logic:
      // 1. If from sidebar → Auto search
      // 2. If from query parser → Manual search
      // 3. Otherwise → Manual search
      
      if (isFromSidebar) {
        console.log("Sidebar filters detected - automatically searching companies");
        setIsAutoSearch(true);
        fetchCompanies(1);
      } else {
        // Check if there's any meaningful content
        const hasContent = Object.values(parsedFilters).some(value => {
          if (Array.isArray(value)) {
            return value.length > 0 && value.some(item => item && item.toString().trim().length > 0);
          }
          return value && value.toString().trim().length > 0;
        });
        
        if (hasContent) {
          console.log("Query parser or other source detected - manual search required");
          setIsAutoSearch(false);
        } else {
          console.log("No meaningful filters detected - clearing results");
          setIsAutoSearch(false);
        }
      }
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
    setError("");
    
    try {
      // Use the same filter logic as fetchCompanies
      const filters = [];
      
      if (parsedFilters.INDUSTRY?.length > 0) {
        filters.push({
          filter_type: "INDUSTRY",
          type: "in",
          value: parsedFilters.INDUSTRY,
        });
      }
      
      if (parsedFilters.TAGS?.length > 0) {
        // Take only the first tag as Crustdata allows only one keyword
        filters.push({
          filter_type: "KEYWORD",
          type: "in",
          value: [parsedFilters.TAGS[0]],
        });
      }
      
      if (parsedFilters.REGION?.length > 0) {
        // Use the original region names as they come from the backend with correct mapping
        const regionNames = parsedFilters.REGION;
        
        filters.push({
          filter_type: "REGION",
          type: "in",
          value: regionNames,
        });
      }

      // Add company headcount filter if available
      if (parsedFilters.COMPANY_HEADCOUNT?.length > 0) {
        // Validate COMPANY_HEADCOUNT values against allowed values
        const validHeadcountValues = [
          "Self-employed",
          "1-10",
          "11-50",
          "51-200",
          "201-500",
          "501-1,000",
          "1,001-5,000",
          "5,001-10,000",
          "10,001+",
        ];

        const validValues = parsedFilters.COMPANY_HEADCOUNT.filter((value) =>
          validHeadcountValues.includes(value)
        );
        
        if (validValues.length > 0) {
          filters.push({
            filter_type: "COMPANY_HEADCOUNT",
            type: "in",
            value: validValues,
          });
        } else {
          console.warn(
            "Invalid COMPANY_HEADCOUNT values:",
            parsedFilters.COMPANY_HEADCOUNT
          );
          console.warn("Valid values are:", validHeadcountValues);
        }
      }

      // Add company headcount growth filter if available
      if (
        parsedFilters.COMPANY_HEADCOUNT_GROWTH &&
          (parsedFilters.COMPANY_HEADCOUNT_GROWTH.min !== undefined || 
          parsedFilters.COMPANY_HEADCOUNT_GROWTH.max !== undefined)
      ) {
        filters.push({
          filter_type: "COMPANY_HEADCOUNT_GROWTH",
          type: "between",
          value: {
            min: parsedFilters.COMPANY_HEADCOUNT_GROWTH.min || 0,
            max: parsedFilters.COMPANY_HEADCOUNT_GROWTH.max || 100,
          },
        });
      }

      // Add annual revenue filter if available
      if (
        parsedFilters.ANNUAL_REVENUE &&
          (parsedFilters.ANNUAL_REVENUE.min !== undefined || 
          parsedFilters.ANNUAL_REVENUE.max !== undefined)
      ) {
        filters.push({
          filter_type: "ANNUAL_REVENUE",
          type: "between",
          value: {
            min: parsedFilters.ANNUAL_REVENUE.min || 0,
            max: parsedFilters.ANNUAL_REVENUE.max || 1000,
          },
          sub_filter: "USD", // Default to USD currency
        });
      }

      // Add department headcount filter if available (with proper sub_filter)
      if (
        parsedFilters.DEPARTMENT_HEADCOUNT &&
          (parsedFilters.DEPARTMENT_HEADCOUNT.min !== undefined || 
          parsedFilters.DEPARTMENT_HEADCOUNT.max !== undefined)
      ) {
        // Default to Engineering if no department specified
        const department =
          parsedFilters.DEPARTMENT_HEADCOUNT.sub_filter || "Engineering";
        filters.push({
          filter_type: "DEPARTMENT_HEADCOUNT",
          type: "between",
          value: {
            min: parsedFilters.DEPARTMENT_HEADCOUNT.min || 0,
            max: parsedFilters.DEPARTMENT_HEADCOUNT.max || 100,
          },
          sub_filter: department,
        });
      }

      // Add department headcount growth filter if available (with proper sub_filter)
      if (
        parsedFilters.DEPARTMENT_HEADCOUNT_GROWTH &&
          (parsedFilters.DEPARTMENT_HEADCOUNT_GROWTH.min !== undefined || 
          parsedFilters.DEPARTMENT_HEADCOUNT_GROWTH.max !== undefined)
      ) {
        // Default to Engineering if no department specified
        const department =
          parsedFilters.DEPARTMENT_HEADCOUNT_GROWTH.sub_filter || "Engineering";
        filters.push({
          filter_type: "DEPARTMENT_HEADCOUNT_GROWTH",
          type: "between",
          value: {
            min: parsedFilters.DEPARTMENT_HEADCOUNT_GROWTH.min || 0,
            max: parsedFilters.DEPARTMENT_HEADCOUNT_GROWTH.max || 50,
          },
          sub_filter: department,
        });
      }

      // Add account activities filter if available
      if (parsedFilters.ACCOUNT_ACTIVITIES?.length > 0) {
        // Validate ACCOUNT_ACTIVITIES values against allowed values
        const validAccountActivitiesValues = [
          "Senior leadership changes in last 3 months",
          "Funding events in past 12 months"
        ];

        const validValues = parsedFilters.ACCOUNT_ACTIVITIES.filter((value) =>
          validAccountActivitiesValues.includes(value)
        );
        
        if (validValues.length > 0) {
        filters.push({
          filter_type: "ACCOUNT_ACTIVITIES",
          type: "in",
            value: validValues,
          });
        } else {
          console.warn(
            "Invalid ACCOUNT_ACTIVITIES values:",
            parsedFilters.ACCOUNT_ACTIVITIES
          );
          console.warn("Valid values are:", validAccountActivitiesValues);
        }
      }

      // Add job opportunities filter if available
      if (parsedFilters.JOB_OPPORTUNITIES) {
        // Handle both array and boolean formats for backward compatibility
        let jobOpportunitiesArray = [];
        if (Array.isArray(parsedFilters.JOB_OPPORTUNITIES)) {
          jobOpportunitiesArray = parsedFilters.JOB_OPPORTUNITIES;
        } else if (parsedFilters.JOB_OPPORTUNITIES === true) {
          // Convert boolean true to the correct value
          jobOpportunitiesArray = ["Hiring on Linkedin"];
        }
        
        if (jobOpportunitiesArray.length > 0) {
          // Validate JOB_OPPORTUNITIES values against allowed values
          const validJobOpportunitiesValues = [
            "Hiring on Linkedin"
          ];

          const validValues = jobOpportunitiesArray.filter((value) =>
            validJobOpportunitiesValues.includes(value)
          );
          
          if (validValues.length > 0) {
        filters.push({
          filter_type: "JOB_OPPORTUNITIES",
          type: "in",
              value: validValues,
            });
          } else {
            console.warn(
              "Invalid JOB_OPPORTUNITIES values:",
              jobOpportunitiesArray
            );
            console.warn("Valid values are:", validJobOpportunitiesValues);
          }
        }
      }

      // Add years of experience filter if available
      if (parsedFilters.YEARS_OF_EXPERIENCE?.length > 0) {
        // Validate YEARS_OF_EXPERIENCE values against allowed values
        const validExperienceValues = [
          "Less than 1 year",
          "1 to 2 years",
          "3 to 5 years",
          "6 to 10 years",
          "More than 10 years",
        ];

        const validValues = parsedFilters.YEARS_OF_EXPERIENCE.filter((value) =>
          validExperienceValues.includes(value)
        );
        
        if (validValues.length > 0) {
          filters.push({
            filter_type: "YEARS_OF_EXPERIENCE",
            type: "in",
            value: validValues,
          });
        } else {
          console.warn(
            "Invalid YEARS_OF_EXPERIENCE values:",
            parsedFilters.YEARS_OF_EXPERIENCE
          );
          console.warn("Valid values are:", validExperienceValues);
        }
      }
      
      // Add years at current company filter if available
      if (parsedFilters.YEARS_AT_CURRENT_COMPANY?.length > 0) {
        // Validate YEARS_AT_CURRENT_COMPANY values against allowed values
        const validCompanyYearsValues = [
          "Less than 1 year",
          "1 to 2 years",
          "3 to 5 years",
          "6 to 10 years",
          "More than 10 years",
        ];

        const validValues = parsedFilters.YEARS_AT_CURRENT_COMPANY.filter(
          (value) => validCompanyYearsValues.includes(value)
        );
        
        if (validValues.length > 0) {
          filters.push({
            filter_type: "YEARS_AT_CURRENT_COMPANY",
            type: "in",
            value: validValues,
          });
        } else {
          console.warn(
            "Invalid YEARS_AT_CURRENT_COMPANY values:",
            parsedFilters.YEARS_AT_CURRENT_COMPANY
          );
          console.warn("Valid values are:", validCompanyYearsValues);
        }
      }
      
      // Add years in current position filter if available
      if (parsedFilters.YEARS_IN_CURRENT_POSITION?.length > 0) {
        // Validate YEARS_IN_CURRENT_POSITION values against allowed values
        const validPositionYearsValues = [
          "Less than 1 year",
          "1 to 2 years",
          "3 to 5 years",
          "6 to 10 years",
          "More than 10 years",
        ];

        const validValues = parsedFilters.YEARS_IN_CURRENT_POSITION.filter(
          (value) => validPositionYearsValues.includes(value)
        );
        
        if (validValues.length > 0) {
          filters.push({
            filter_type: "YEARS_IN_CURRENT_POSITION",
            type: "in",
            value: validValues,
          });
        } else {
          console.warn(
            "Invalid YEARS_IN_CURRENT_POSITION values:",
            parsedFilters.YEARS_IN_CURRENT_POSITION
          );
          console.warn("Valid values are:", validPositionYearsValues);
        }
      }

      // Note: We don't add KEYWORD filter again here since it's already added from TAGS
      // If there's a separate KEYWORD field, it would override the TAGS one
      if (parsedFilters.KEYWORD?.length > 0 && !parsedFilters.TAGS?.length) {
        filters.push({
          filter_type: "KEYWORD",
          type: "in",
          value: parsedFilters.KEYWORD,
        });
      }

      const response = await axios.post(
        "http://localhost:5000/api/find-companies",
        {
        filters: filters,
        page: pageNum,
        regionIds: parsedFilters.REGION_IDS || [],
          regionNames: parsedFilters.REGION || [], // Send region names along with IDs
        }
      );
      
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
      console.error("Error fetching companies for page:", err);
      setError("Failed to load page " + pageNum);
    } finally {
      setPageLoading(false);
    }
  };

  const fetchCompanies = async (pageNum = 1) => {
    if (!parsedFilters) {
      setError("No filters provided");
      return;
    }

    setLoading(true);
    setError("");

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
      const hasPeopleFilters =
        parsedFilters.RECENTLY_CHANGED_JOBS === true ||
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
        console.log(
          "Detected people-focused search, will handle in contact search"
        );
        
        // Check if we also have company-focused filters that we can use
        const hasCompanyFilters =
          parsedFilters.INDUSTRY?.length > 0 ||
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
          console.log(
            "People-focused search also has company filters, proceeding with company search"
          );
        } else if (parsedFilters.CURRENT_COMPANY?.length > 0) {
          // Use the company name as a keyword to find the company
          filters.push({
            filter_type: "KEYWORD",
            type: "in",
            value: parsedFilters.CURRENT_COMPANY,
          });
        } else {
          // Pure people-focused search - we still need to show company search first
          // because contact search requires companies to be selected
          console.log(
            "Pure people-focused search detected, showing company search with people-focused indication"
          );
          setIsPeopleFocusedSearch(true);
          // Don't return - continue with company search to show all companies
        }
      }
      
      // We can't use CURRENT_TITLE in company search API
      // Storing job titles for informational purposes only
      const jobTitles = parsedFilters.CURRENT_TITLE;
      console.log("Job titles (not used in API call):", jobTitles);
      
      // Add industry filter if available
      if (parsedFilters.INDUSTRY?.length > 0) {
        filters.push({
          filter_type: "INDUSTRY",
          type: "in",
          value: parsedFilters.INDUSTRY,
        });
      }
      
      // Add tags/keywords filter if available (only one keyword allowed)
      if (parsedFilters.TAGS?.length > 0) {
        filters.push({
          filter_type: "KEYWORD",
          type: "in",
          value: [parsedFilters.TAGS[0]], // Take only the first tag as API allows max 1
        });
      }
      
      // Add region filter if available (only add once)
      if (parsedFilters.REGION?.length > 0) {
        filters.push({
          filter_type: "REGION",
          type: "in",
          value: parsedFilters.REGION,
        });
      }

      // Add company headcount filter if available
      if (parsedFilters.COMPANY_HEADCOUNT?.length > 0) {
        // Validate COMPANY_HEADCOUNT values against allowed values
        const validHeadcountValues = [
          "Self-employed",
          "1-10",
          "11-50",
          "51-200",
          "201-500",
          "501-1,000",
          "1,001-5,000",
          "5,001-10,000",
          "10,001+",
        ];

        const validValues = parsedFilters.COMPANY_HEADCOUNT.filter((value) =>
          validHeadcountValues.includes(value)
        );
        
        if (validValues.length > 0) {
          filters.push({
            filter_type: "COMPANY_HEADCOUNT",
            type: "in",
            value: validValues,
          });
        } else {
          console.warn(
            "Invalid COMPANY_HEADCOUNT values:",
            parsedFilters.COMPANY_HEADCOUNT
          );
          console.warn("Valid values are:", validHeadcountValues);
        }
      }

      // Add company headcount growth filter if available
      if (
        parsedFilters.COMPANY_HEADCOUNT_GROWTH &&
          (parsedFilters.COMPANY_HEADCOUNT_GROWTH.min !== undefined || 
          parsedFilters.COMPANY_HEADCOUNT_GROWTH.max !== undefined)
      ) {
        filters.push({
          filter_type: "COMPANY_HEADCOUNT_GROWTH",
          type: "between",
          value: {
            min: parsedFilters.COMPANY_HEADCOUNT_GROWTH.min || 0,
            max: parsedFilters.COMPANY_HEADCOUNT_GROWTH.max || 100,
          },
        });
      }

      // Add annual revenue filter if available
      if (
        parsedFilters.ANNUAL_REVENUE &&
          (parsedFilters.ANNUAL_REVENUE.min !== undefined || 
          parsedFilters.ANNUAL_REVENUE.max !== undefined)
      ) {
        filters.push({
          filter_type: "ANNUAL_REVENUE",
          type: "between",
          value: {
            min: parsedFilters.ANNUAL_REVENUE.min || 0,
            max: parsedFilters.ANNUAL_REVENUE.max || 1000,
          },
          sub_filter: "USD", // Default to USD currency
        });
      }

      // Add department headcount filter if available (with proper sub_filter)
      if (
        parsedFilters.DEPARTMENT_HEADCOUNT &&
          (parsedFilters.DEPARTMENT_HEADCOUNT.min !== undefined || 
          parsedFilters.DEPARTMENT_HEADCOUNT.max !== undefined)
      ) {
        // Default to Engineering if no department specified
        const department =
          parsedFilters.DEPARTMENT_HEADCOUNT.sub_filter || "Engineering";
        filters.push({
          filter_type: "DEPARTMENT_HEADCOUNT",
          type: "between",
          value: {
            min: parsedFilters.DEPARTMENT_HEADCOUNT.min || 0,
            max: parsedFilters.DEPARTMENT_HEADCOUNT.max || 100,
          },
          sub_filter: department,
        });
      }

      // Add department headcount growth filter if available (with proper sub_filter)
      if (
        parsedFilters.DEPARTMENT_HEADCOUNT_GROWTH &&
          (parsedFilters.DEPARTMENT_HEADCOUNT_GROWTH.min !== undefined || 
          parsedFilters.DEPARTMENT_HEADCOUNT_GROWTH.max !== undefined)
      ) {
        // Default to Engineering if no department specified
        const department =
          parsedFilters.DEPARTMENT_HEADCOUNT_GROWTH.sub_filter || "Engineering";
        filters.push({
          filter_type: "DEPARTMENT_HEADCOUNT_GROWTH",
          type: "between",
          value: {
            min: parsedFilters.DEPARTMENT_HEADCOUNT_GROWTH.min || 0,
            max: parsedFilters.DEPARTMENT_HEADCOUNT_GROWTH.max || 50,
          },
          sub_filter: department,
        });
      }

      // Add account activities filter if available
      if (parsedFilters.ACCOUNT_ACTIVITIES?.length > 0) {
        // Validate ACCOUNT_ACTIVITIES values against allowed values
        const validAccountActivitiesValues = [
          "Senior leadership changes in last 3 months",
          "Funding events in past 12 months"
        ];

        const validValues = parsedFilters.ACCOUNT_ACTIVITIES.filter((value) =>
          validAccountActivitiesValues.includes(value)
        );
        
        if (validValues.length > 0) {
        filters.push({
          filter_type: "ACCOUNT_ACTIVITIES",
          type: "in",
            value: validValues,
          });
        } else {
          console.warn(
            "Invalid ACCOUNT_ACTIVITIES values:",
            parsedFilters.ACCOUNT_ACTIVITIES
          );
          console.warn("Valid values are:", validAccountActivitiesValues);
        }
      }

      // Add job opportunities filter if available
      if (parsedFilters.JOB_OPPORTUNITIES) {
        // Handle both array and boolean formats for backward compatibility
        let jobOpportunitiesArray = [];
        if (Array.isArray(parsedFilters.JOB_OPPORTUNITIES)) {
          jobOpportunitiesArray = parsedFilters.JOB_OPPORTUNITIES;
        } else if (parsedFilters.JOB_OPPORTUNITIES === true) {
          // Convert boolean true to the correct value
          jobOpportunitiesArray = ["Hiring on Linkedin"];
        }
        
        if (jobOpportunitiesArray.length > 0) {
          // Validate JOB_OPPORTUNITIES values against allowed values
          const validJobOpportunitiesValues = [
            "Hiring on Linkedin"
          ];

          const validValues = jobOpportunitiesArray.filter((value) =>
            validJobOpportunitiesValues.includes(value)
          );
          
          if (validValues.length > 0) {
        filters.push({
          filter_type: "JOB_OPPORTUNITIES",
          type: "in",
              value: validValues,
            });
          } else {
            console.warn(
              "Invalid JOB_OPPORTUNITIES values:",
              jobOpportunitiesArray
            );
            console.warn("Valid values are:", validJobOpportunitiesValues);
          }
        }
      }

      // Add years of experience filter if available
      if (parsedFilters.YEARS_OF_EXPERIENCE?.length > 0) {
        // Validate YEARS_OF_EXPERIENCE values against allowed values
        const validExperienceValues = [
          "Less than 1 year",
          "1 to 2 years",
          "3 to 5 years",
          "6 to 10 years",
          "More than 10 years",
        ];

        const validValues = parsedFilters.YEARS_OF_EXPERIENCE.filter((value) =>
          validExperienceValues.includes(value)
        );
        
        if (validValues.length > 0) {
          filters.push({
            filter_type: "YEARS_OF_EXPERIENCE",
            type: "in",
            value: validValues,
          });
        } else {
          console.warn(
            "Invalid YEARS_OF_EXPERIENCE values:",
            parsedFilters.YEARS_OF_EXPERIENCE
          );
          console.warn("Valid values are:", validExperienceValues);
        }
      }
      
      // Add years at current company filter if available
      if (parsedFilters.YEARS_AT_CURRENT_COMPANY?.length > 0) {
        // Validate YEARS_AT_CURRENT_COMPANY values against allowed values
        const validCompanyYearsValues = [
          "Less than 1 year",
          "1 to 2 years",
          "3 to 5 years",
          "6 to 10 years",
          "More than 10 years",
        ];

        const validValues = parsedFilters.YEARS_AT_CURRENT_COMPANY.filter(
          (value) => validCompanyYearsValues.includes(value)
        );
        
        if (validValues.length > 0) {
          filters.push({
            filter_type: "YEARS_AT_CURRENT_COMPANY",
            type: "in",
            value: validValues,
          });
        } else {
          console.warn(
            "Invalid YEARS_AT_CURRENT_COMPANY values:",
            parsedFilters.YEARS_AT_CURRENT_COMPANY
          );
          console.warn("Valid values are:", validCompanyYearsValues);
        }
      }
      
      // Add years in current position filter if available
      if (parsedFilters.YEARS_IN_CURRENT_POSITION?.length > 0) {
        // Validate YEARS_IN_CURRENT_POSITION values against allowed values
        const validPositionYearsValues = [
          "Less than 1 year",
          "1 to 2 years",
          "3 to 5 years",
          "6 to 10 years",
          "More than 10 years",
        ];

        const validValues = parsedFilters.YEARS_IN_CURRENT_POSITION.filter(
          (value) => validPositionYearsValues.includes(value)
        );
        
        if (validValues.length > 0) {
          filters.push({
            filter_type: "YEARS_IN_CURRENT_POSITION",
            type: "in",
            value: validValues,
          });
        } else {
          console.warn(
            "Invalid YEARS_IN_CURRENT_POSITION values:",
            parsedFilters.YEARS_IN_CURRENT_POSITION
          );
          console.warn("Valid values are:", validPositionYearsValues);
        }
      }

      // Note: We don't add KEYWORD filter again here since it's already added from TAGS
      // If there's a separate KEYWORD field, it would override the TAGS one
      if (parsedFilters.KEYWORD?.length > 0 && !parsedFilters.TAGS?.length) {
        filters.push({
          filter_type: "KEYWORD",
          type: "in",
          value: parsedFilters.KEYWORD,
        });
      }

      console.log("Sending filters to API:", filters);
      
      // Check if we have any valid company filters
      if (filters.length === 0) {
        if (isPeopleFocusedSearch) {
          // For people-focused searches without company filters, show helpful message
          console.log(
            "People-focused search without company filters - showing helpful message"
          );
          setLoading(false);
          return;
        } else {
          setLoading(false);
          return;
        }
      }
      
      // Call the backend API with both region names and IDs if available
      const response = await axios.post(
        "http://localhost:5000/api/find-companies",
        {
        filters: filters,
        page: pageNum,
        regionIds: parsedFilters.REGION_IDS || [],
          regionNames: parsedFilters.REGION, // Send cleaned region names
        }
      );
      
      console.log("API response:", response.data);
      
      // Check if there's an error in the response
      if (response.data.error) {
        // Handle "No more results available" error
        if (response.data.error === "No more results available") {
          // Go back to the previous page since there are no more results
          const previousPage = Math.max(pageNum - 1, 1);
          setPage(previousPage);
          setError("No more results available. Returning to previous page.");
          
          // If we're already on page 1, just show the current results
          if (previousPage === 1) {
            setError(
              "No Results Found. Try Clearing Some Filters? Results matching this query could not be displayed. Please try refining your search or clearing some of your filters."
            );
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
        const calculatedTotalPages = Math.max(
          Math.ceil(totalCountValue / pageSize),
          1
        );
        setTotalPages(calculatedTotalPages);
        
        // Check if this is the last page
        const isLastPage =
          pageNum >= calculatedTotalPages || companiesList.length < pageSize;
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
        const calculatedTotalPages = Math.max(
          Math.ceil(companiesList.length / pageSize),
          1
        );
        setTotalPages(calculatedTotalPages);
        
        // If we got fewer companies than page size, this is the last page
        const isLastPage = companiesList.length < pageSize;
        setIsLastPage(isLastPage);
      }
      
      if (companiesList.length === 0) {
        setError(
          "No Results Found. Try Clearing Some Filters? Results matching this query could not be displayed. Please try refining your search or clearing some of your filters."
        );
        setIsLastPage(true);
      }
    } catch (err) {
      console.error("Error fetching companies:", err);
      console.error("Error details:", err.response?.data);
      
      // Check if it's a "no results" type error
      const errorMessage = err.response?.data?.error || "";
      if (
        errorMessage.toLowerCase().includes("no results") ||
        errorMessage.toLowerCase().includes("not found") ||
        errorMessage.toLowerCase().includes("no companies")
      ) {
        setError(
          "No Results Found. Try Clearing Some Filters? Results matching this query could not be displayed. Please try refining your search or clearing some of your filters."
        );
      } else {
        setError(errorMessage || "Failed to fetch companies");
      }
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  // Get a unique identifier for a company
  const getCompanyUniqueId = (company) => {
    // Try various possible unique identifiers in order of preference
    return (
      company.linkedin_company_id ||
           company.company_id || 
           company.id || 
      (company.name && company.location
        ? `${company.name}-${company.location}`
        : null)
    );
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Use a Map for faster lookups of selected companies
  const [selectedCompanyIds, setSelectedCompanyIds] = useState(new Map());
  const [isPeopleFocusedSearch, setIsPeopleFocusedSearch] = useState(false);
  const [isAutoSearch, setIsAutoSearch] = useState(false);
  
  // Toggle company selection - optimized version
  const handleToggle = (company) => () => {
    const companyId = getCompanyUniqueId(company);
    
    if (!companyId) {
      console.error("Unable to identify unique company ID", company);
      return;
    }
    
    // Create new copies for state updates
    const newSelectedCompanies = [...selectedCompanies];
    const newSelectedIds = new Map(selectedCompanyIds);
    
    if (selectedCompanyIds.has(companyId)) {
      // Remove the company if already selected
      const indexToRemove = selectedCompanies.findIndex(
        (c) => getCompanyUniqueId(c) === companyId
      );
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
    return (
      companies.length > 0 && selectedCompanies.length === companies.length
    );
  };

  const isIndeterminate = () => {
    return (
      selectedCompanies.length > 0 &&
      selectedCompanies.length < companies.length
    );
  };

  const handleSelectAll = () => {
    if (isAllSelected()) {
      setSelectedCompanies([]);
      setSelectedCompanyIds(new Map());
    } else {
      setSelectedCompanies([...companies]);
      const newSelectedIds = new Map();
      companies.forEach((company) => {
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
    console.log("Exporting companies:", selectedCompanies);
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
      <div className="flex justify-between items-center p-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <BusinessIcon />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
          {isPeopleFocusedSearch
            ? "Company Search (People-Focused)"
            : "Company Search"}
        </h3>
            {isAutoSearch && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm mt-1">
                Auto Search
              </span>
            )}
          </div>
        </div>
        <button 
          onClick={() => {
            setPage(1); 
            setIsAutoSearch(false); // Reset auto search state when manually clicked
            fetchCompanies(1);
          }}
          disabled={loading || !parsedFilters}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>{isAutoSearch ? "Search Again" : "Search Companies"}</span>
          </div>
        </button>
      </div>
      
      {!isPeopleFocusedSearch && parsedFilters?.CURRENT_TITLE?.length > 0 && (
        <div className="bg-blue-50/80 border-b border-blue-200/50 text-blue-700 px-6 py-4">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium">Note:</p>
              <p className="text-sm">Job titles ({parsedFilters.CURRENT_TITLE.join(", ")}) will be used for filtering leads after company selection. Company search only uses industry and keyword filters.</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50/80 border-b border-red-200/50 text-red-700 px-6 py-4">
          <div className="flex items-start space-x-2">
            <span className="text-red-500 text-lg">⚠️</span>
            <div>
              <p className="font-medium">{error}</p>
              {isAutoSearch && (
                <p className="text-sm mt-1">
                  This search was triggered automatically from your sidebar filters. You can adjust your filters and try again.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Searching for companies...</p>
          </div>
        </div>
      )}

      {/* Show people-focused search notification */}
      {isPeopleFocusedSearch && (
        <div className="bg-orange-50/80 border-b border-orange-200/50 text-orange-700 px-6 py-4">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="font-medium">People-Focused Search</p>
              <p className="text-sm mt-1">
                You've selected only people-focused filters (Job Titles, Seniority, Experience, etc.) without any company-related criteria.
          </p>
          <p className="text-sm font-medium mt-1">
            To get better results: Add at least one company-related filter
          </p>
            </div>
          </div>
        </div>
      )}

      {!isPeopleFocusedSearch && companies.length > 0 && (
        <>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200/50">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-700 font-semibold">
                    Found <span className="text-blue-600 font-bold">{totalCount.toLocaleString()}</span> companies
                    {totalPages > 1 && (
                      <span className="text-gray-500 font-normal ml-2">(Page {page} of {totalPages})</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className={`font-semibold ${
                  selectedCompanies.length > 0
                    ? "text-blue-600"
                    : "text-gray-500"
                }`}>
                Selected: {selectedCompanies.length}
              </p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden">
            {pageLoading && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-blue-600 font-medium">
                    Loading Page {page}...
                  </p>
                </div>
              </div>
            )}
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 w-1/10">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isAllSelected()}
                          ref={(input) => {
                            if (input) input.indeterminate = isIndeterminate();
                          }}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                        />
                        <span className="text-sm font-semibold">Select All</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 w-2/5">
                      <div className="flex items-center space-x-2">
                        <BusinessIcon />
                        <span>Company Name</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 w-3/10">
                      <div className="flex items-center space-x-2">
                        <IndustryIcon />
                        <span>Industry</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 w-1/5">
                      <div className="flex items-center space-x-2">
                        <LocationIcon />
                        <span>Location</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50">
                  {companies.map((company, index) => {
                    const companyId = getCompanyUniqueId(company);
                    const isItemSelected = isSelected(company);

                    return (
                      <tr 
                        key={companyId || `company-${index}`}
                        onClick={handleToggle(company)}
                        className={`hover:bg-gray-50/80 transition-all duration-200 cursor-pointer ${
                          isItemSelected
                            ? "bg-blue-50/80 border-l-4 border-blue-600"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={isItemSelected}
                            onChange={handleToggle(company)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">
                            {company.name || company.company_name}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-600 font-medium">
                            {company.industry || company.industries || "N/A"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
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
            <div className="p-6 border-t border-gray-200/50 bg-gray-50/50">
              <button
                onClick={exportCompanies}
                disabled={selectedCompanies.length === 0}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <div className="flex items-center space-x-2">
                <ExportIcon />
                  <span>Export Selected ({selectedCompanies.length})</span>
                </div>
              </button>
            </div>
          )}
          
          {/* Pagination controls - only show when there are multiple pages */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-blue-50">
              <div className="flex justify-center">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={page === 1 || pageLoading}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-white hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                  >
                    First
                  </button>
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1 || pageLoading}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-white hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-700 font-semibold bg-white rounded-lg border border-gray-300">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={
                      isLastPage || pageLoading || companies.length === 0
                    }
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-white hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={
                      isLastPage || pageLoading || companies.length === 0
                    }
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-white hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                  >
                    Last
                  </button>
                </div>
              </div>
              <p className="text-center text-gray-600 mt-3 font-medium">
                Showing {companies.length} of {totalCount.toLocaleString()} companies
              </p>
            </div>
          )}
          
          {/* Show results summary when all results are on one page */}
          {totalPages === 1 && totalCount > 0 && (
            <div className="p-6 border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-blue-50">
              <p className="text-center text-gray-600 font-medium">
                Showing all {totalCount.toLocaleString()} companies
              </p>
            </div>
          )}
        </>
      )}

      {!isPeopleFocusedSearch &&
        !loading &&
        companies.length === 0 &&
        !error && (
        <div className="py-16 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-12 border border-blue-200/50">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">
              {isAutoSearch ? "No companies found" : "Ready to discover companies"}
            </h4>
            <p className="text-gray-600 max-w-md mx-auto">
                {isAutoSearch 
                  ? "No companies match your current filters. Try adjusting your search criteria."
                  : "Click the \"Search Companies\" button above to find matching companies based on your filters."
                }
            </p>
          </div>
        </div>
      )}
      
      {/* Contacts search section */}
      {showContactSearch && (
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
