import React, { useState } from "react";
import QueryParser from "./components/QueryParser";
import Sidebar from "./components/Sidebar";
import CompanyResults from "./components/CompanyResults";

function App() {
  // Simple state for filters
  const [parsedFilters, setParsedFilters] = useState(null);
  const [sidebarFilters, setSidebarFilters] = useState({});



  // Function to update filters from query parser
  const updateFromQuery = (filters) => {
    console.log("Raw filters received from backend:", filters);
    
    // Ensure boolean filters have default values
    const processedFilters = {
      ...filters,
      _source: 'query_parser', // Add flag to indicate source
      JOB_OPPORTUNITIES:
        filters.JOB_OPPORTUNITIES !== undefined
          ? filters.JOB_OPPORTUNITIES
          : null,
      RECENTLY_CHANGED_JOBS:
        filters.RECENTLY_CHANGED_JOBS !== undefined
          ? filters.RECENTLY_CHANGED_JOBS
          : null,
      POSTED_ON_LINKEDIN:
        filters.POSTED_ON_LINKEDIN !== undefined
          ? filters.POSTED_ON_LINKEDIN
          : null,
      IN_THE_NEWS:
        filters.IN_THE_NEWS !== undefined ? filters.IN_THE_NEWS : null,
    };

    console.log("Processed filters:", processedFilters);
    
    setParsedFilters(processedFilters);
    
    // Convert parsed filters to sidebar format - ensure exact matching
    const sidebarState = {
      jobTitles: [],
      industries: [],
      regions: [],
      companySizes: [],
      revenueRanges: [],
      seniorityLevels: [],
      yearsRanges: [],
      growthRanges: [],
      departments: [],
      departmentSizes: [],
      specializations: [],
      accountActivities: [],
      currentCompany: null,
      yearsAtCompany: [],
      yearsInPosition: [],
      jobOpportunities: [],
      recentlyChanged: null,
      linkedinPosted: null,
      inTheNews: null,
    };
    
    // Map parsed filters to sidebar format with exact matching
    if (processedFilters.CURRENT_TITLE) {
      sidebarState.jobTitles = Array.isArray(processedFilters.CURRENT_TITLE)
        ? processedFilters.CURRENT_TITLE
        : [processedFilters.CURRENT_TITLE];
    }
    
    if (processedFilters.INDUSTRY) {
      sidebarState.industries = Array.isArray(processedFilters.INDUSTRY)
        ? processedFilters.INDUSTRY
        : [processedFilters.INDUSTRY];
    }
    
    if (processedFilters.REGION) {
      sidebarState.regions = Array.isArray(processedFilters.REGION)
        ? processedFilters.REGION
        : [processedFilters.REGION];
    }
    
    if (processedFilters.COMPANY_HEADCOUNT) {
      // Handle different formats of company headcount
      let companySize = processedFilters.COMPANY_HEADCOUNT;
      if (
        typeof companySize === "object" &&
        companySize.min &&
        companySize.max
      ) {
        companySize = `${companySize.min}-${companySize.max}`;
      }
      sidebarState.companySizes = Array.isArray(companySize)
        ? companySize
        : [companySize];
    }
    
    if (processedFilters.ANNUAL_REVENUE) {
      // Handle different formats of annual revenue
      let revenue = processedFilters.ANNUAL_REVENUE;
      if (typeof revenue === "object" && revenue.min && revenue.max) {
        revenue = `$${revenue.min}M-$${revenue.max}M`;
      }
      sidebarState.revenueRanges = Array.isArray(revenue) ? revenue : [revenue];
    }
    
    if (processedFilters.SENIORITY_LEVEL) {
      sidebarState.seniorityLevels = Array.isArray(
        processedFilters.SENIORITY_LEVEL
      )
        ? processedFilters.SENIORITY_LEVEL
        : [processedFilters.SENIORITY_LEVEL];
    }
    
    if (processedFilters.YEARS_OF_EXPERIENCE) {
      // Handle different formats of years
      let years = processedFilters.YEARS_OF_EXPERIENCE;
      if (typeof years === "object" && years.min && years.max) {
        years = `${years.min}-${years.max} years`;
      }
      sidebarState.yearsRanges = Array.isArray(years) ? years : [years];
    }
    
    if (processedFilters.YEARS_AT_CURRENT_COMPANY) {
      let yearsAtCompany = processedFilters.YEARS_AT_CURRENT_COMPANY;
      if (
        typeof yearsAtCompany === "object" &&
        yearsAtCompany.min &&
        yearsAtCompany.max
      ) {
        yearsAtCompany = `${yearsAtCompany.min}-${yearsAtCompany.max} years`;
      }
      sidebarState.yearsAtCompany = Array.isArray(yearsAtCompany)
        ? yearsAtCompany
        : [yearsAtCompany];
    }
    
    if (processedFilters.YEARS_IN_CURRENT_POSITION) {
      let yearsInPosition = processedFilters.YEARS_IN_CURRENT_POSITION;
      if (
        typeof yearsInPosition === "object" &&
        yearsInPosition.min &&
        yearsInPosition.max
      ) {
        yearsInPosition = `${yearsInPosition.min}-${yearsInPosition.max} years`;
      }
      sidebarState.yearsInPosition = Array.isArray(yearsInPosition)
        ? yearsInPosition
        : [yearsInPosition];
    }
    
    if (processedFilters.COMPANY_HEADCOUNT_GROWTH) {
      // Handle different formats of growth
      let growth = processedFilters.COMPANY_HEADCOUNT_GROWTH;
      if (typeof growth === "object" && growth.min && growth.max) {
        growth = `${growth.min}-${growth.max}%`;
      }
      sidebarState.growthRanges = Array.isArray(growth) ? growth : [growth];
    }
    
    if (processedFilters.DEPARTMENT_HEADCOUNT) {
      // Handle department headcount
      if (
        typeof processedFilters.DEPARTMENT_HEADCOUNT === "object" &&
        processedFilters.DEPARTMENT_HEADCOUNT.sub_filter
      ) {
        sidebarState.departments = [
          processedFilters.DEPARTMENT_HEADCOUNT.sub_filter,
        ];
        // Also handle the size range if available
        if (
          processedFilters.DEPARTMENT_HEADCOUNT.min &&
          processedFilters.DEPARTMENT_HEADCOUNT.max
        ) {
          sidebarState.departmentSizes = [
            `${processedFilters.DEPARTMENT_HEADCOUNT.min}-${processedFilters.DEPARTMENT_HEADCOUNT.max}`,
          ];
        }
      } else {
        sidebarState.departments = Array.isArray(
          processedFilters.DEPARTMENT_HEADCOUNT
        )
          ? processedFilters.DEPARTMENT_HEADCOUNT
          : [processedFilters.DEPARTMENT_HEADCOUNT];
      }
    }
    
    if (processedFilters.TAGS) {
      sidebarState.specializations = Array.isArray(processedFilters.TAGS)
        ? processedFilters.TAGS
        : [processedFilters.TAGS];
    }
    
    if (processedFilters.ACCOUNT_ACTIVITIES) {
      sidebarState.accountActivities = Array.isArray(
        processedFilters.ACCOUNT_ACTIVITIES
      )
        ? processedFilters.ACCOUNT_ACTIVITIES
        : [processedFilters.ACCOUNT_ACTIVITIES];
    }
    
    if (processedFilters.CURRENT_COMPANY) {
      sidebarState.currentCompany = Array.isArray(
        processedFilters.CURRENT_COMPANY
      )
        ? processedFilters.CURRENT_COMPANY[0]
        : processedFilters.CURRENT_COMPANY;
    }
    
    if (processedFilters.JOB_OPPORTUNITIES !== undefined) {
      sidebarState.jobOpportunities = Array.isArray(processedFilters.JOB_OPPORTUNITIES) 
        ? processedFilters.JOB_OPPORTUNITIES 
        : [processedFilters.JOB_OPPORTUNITIES];
    } else {
      sidebarState.jobOpportunities = []; // Don't set default false
    }
    
    if (processedFilters.RECENTLY_CHANGED_JOBS !== undefined) {
      sidebarState.recentlyChanged = processedFilters.RECENTLY_CHANGED_JOBS;
    } else {
      sidebarState.recentlyChanged = null; // Don't set default false
    }
    
    if (processedFilters.POSTED_ON_LINKEDIN !== undefined) {
      sidebarState.linkedinPosted = processedFilters.POSTED_ON_LINKEDIN;
    } else {
      sidebarState.linkedinPosted = null; // Don't set default false
    }
    
    if (processedFilters.IN_THE_NEWS !== undefined) {
      sidebarState.inTheNews = processedFilters.IN_THE_NEWS;
    } else {
      sidebarState.inTheNews = null; // Don't set default false
    }
    
    setSidebarFilters(sidebarState);
  };

  // Function to update filters from sidebar
  const updateFromSidebar = (newSidebarFilters) => {
    setSidebarFilters(newSidebarFilters);
    
    // Convert sidebar filters back to parsed format - ensure exact matching
    const newParsedFilters = parsedFilters ? { ...parsedFilters } : {};
    
    // Add a flag to indicate this came from sidebar
    newParsedFilters._source = 'sidebar';
    
    // Map sidebar filters back to parsed format with exact matching
    if (newSidebarFilters.jobTitles && newSidebarFilters.jobTitles.length > 0) {
      newParsedFilters.CURRENT_TITLE = newSidebarFilters.jobTitles;
    } else {
      delete newParsedFilters.CURRENT_TITLE;
    }
    
    if (
      newSidebarFilters.industries &&
      newSidebarFilters.industries.length > 0
    ) {
      newParsedFilters.INDUSTRY = newSidebarFilters.industries;
    } else {
      delete newParsedFilters.INDUSTRY;
    }
    
    if (newSidebarFilters.regions && newSidebarFilters.regions.length > 0) {
      newParsedFilters.REGION = newSidebarFilters.regions;
    } else {
      delete newParsedFilters.REGION;
    }
    
    if (
      newSidebarFilters.companySizes &&
      newSidebarFilters.companySizes.length > 0
    ) {
      newParsedFilters.COMPANY_HEADCOUNT = newSidebarFilters.companySizes;
    } else {
      delete newParsedFilters.COMPANY_HEADCOUNT;
    }
    
    if (
      newSidebarFilters.revenueRanges &&
      newSidebarFilters.revenueRanges.length > 0
    ) {
      newParsedFilters.ANNUAL_REVENUE = newSidebarFilters.revenueRanges;
    } else {
      delete newParsedFilters.ANNUAL_REVENUE;
    }
    
    if (
      newSidebarFilters.seniorityLevels &&
      newSidebarFilters.seniorityLevels.length > 0
    ) {
      newParsedFilters.SENIORITY_LEVEL = newSidebarFilters.seniorityLevels;
    } else {
      delete newParsedFilters.SENIORITY_LEVEL;
    }
    
    if (
      newSidebarFilters.yearsRanges &&
      newSidebarFilters.yearsRanges.length > 0
    ) {
      newParsedFilters.YEARS_OF_EXPERIENCE = newSidebarFilters.yearsRanges;
    } else {
      delete newParsedFilters.YEARS_OF_EXPERIENCE;
    }
    
    if (
      newSidebarFilters.yearsAtCompany &&
      newSidebarFilters.yearsAtCompany.length > 0
    ) {
      newParsedFilters.YEARS_AT_CURRENT_COMPANY =
        newSidebarFilters.yearsAtCompany;
    } else {
      delete newParsedFilters.YEARS_AT_CURRENT_COMPANY;
    }
    
    if (
      newSidebarFilters.yearsInPosition &&
      newSidebarFilters.yearsInPosition.length > 0
    ) {
      newParsedFilters.YEARS_IN_CURRENT_POSITION =
        newSidebarFilters.yearsInPosition;
    } else {
      delete newParsedFilters.YEARS_IN_CURRENT_POSITION;
    }
    
    if (
      newSidebarFilters.growthRanges &&
      newSidebarFilters.growthRanges.length > 0
    ) {
      newParsedFilters.COMPANY_HEADCOUNT_GROWTH =
        newSidebarFilters.growthRanges;
    } else {
      delete newParsedFilters.COMPANY_HEADCOUNT_GROWTH;
    }
    
    if (
      newSidebarFilters.departments &&
      newSidebarFilters.departments.length > 0
    ) {
      newParsedFilters.DEPARTMENT_HEADCOUNT = newSidebarFilters.departments;
    } else {
      delete newParsedFilters.DEPARTMENT_HEADCOUNT;
    }
    
    if (
      newSidebarFilters.departmentSizes &&
      newSidebarFilters.departmentSizes.length > 0
    ) {
      // Convert departmentSizes back to DEPARTMENT_HEADCOUNT format
      const deptSize = newSidebarFilters.departmentSizes[0];
      if (deptSize && deptSize.includes("-")) {
        const [min, max] = deptSize.split("-");
        newParsedFilters.DEPARTMENT_HEADCOUNT = {
          min: parseInt(min),
          max: parseInt(max),
          sub_filter: newSidebarFilters.departments?.[0] || "Engineering",
        };
      }
    } else {
      delete newParsedFilters.DEPARTMENT_HEADCOUNT;
    }
    
    if (
      newSidebarFilters.departmentGrowthRanges &&
      newSidebarFilters.departmentGrowthRanges.length > 0
    ) {
      newParsedFilters.DEPARTMENT_HEADCOUNT_GROWTH = {
        min: newSidebarFilters.departmentGrowthRanges[0] || 0,
        max: newSidebarFilters.departmentGrowthRanges[1] || 200,
        sub_filter: newSidebarFilters.departments?.[0] || "Engineering",
      };
    } else {
      delete newParsedFilters.DEPARTMENT_HEADCOUNT_GROWTH;
    }
    
    if (
      newSidebarFilters.specializations &&
      newSidebarFilters.specializations.length > 0
    ) {
      newParsedFilters.TAGS = newSidebarFilters.specializations;
    } else {
      delete newParsedFilters.TAGS;
    }
    
    if (
      newSidebarFilters.accountActivities &&
      newSidebarFilters.accountActivities.length > 0
    ) {
      newParsedFilters.ACCOUNT_ACTIVITIES = newSidebarFilters.accountActivities;
    } else {
      delete newParsedFilters.ACCOUNT_ACTIVITIES;
    }
    
    if (newSidebarFilters.currentCompany) {
      newParsedFilters.CURRENT_COMPANY = newSidebarFilters.currentCompany;
    } else {
      delete newParsedFilters.CURRENT_COMPANY;
    }
    
    if (
      newSidebarFilters.jobOpportunities !== undefined &&
      newSidebarFilters.jobOpportunities && newSidebarFilters.jobOpportunities.length > 0
    ) {
      newParsedFilters.JOB_OPPORTUNITIES = newSidebarFilters.jobOpportunities;
    } else {
      delete newParsedFilters.JOB_OPPORTUNITIES;
    }
    
    if (
      newSidebarFilters.recentlyChanged !== undefined &&
      newSidebarFilters.recentlyChanged !== null
    ) {
      newParsedFilters.RECENTLY_CHANGED_JOBS =
        newSidebarFilters.recentlyChanged;
    } else {
      delete newParsedFilters.RECENTLY_CHANGED_JOBS;
    }
    
    if (
      newSidebarFilters.linkedinPosted !== undefined &&
      newSidebarFilters.linkedinPosted !== null
    ) {
      newParsedFilters.POSTED_ON_LINKEDIN = newSidebarFilters.linkedinPosted;
    } else {
      delete newParsedFilters.POSTED_ON_LINKEDIN;
    }
    
    if (
      newSidebarFilters.inTheNews !== undefined &&
      newSidebarFilters.inTheNews !== null
    ) {
      newParsedFilters.IN_THE_NEWS = newSidebarFilters.inTheNews;
    } else {
      delete newParsedFilters.IN_THE_NEWS;
    }
    
    setParsedFilters(newParsedFilters);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Lead Generation App
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Ready to discover leads</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout with Sidebar */}
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar 
          sidebarFilters={sidebarFilters}
          onSidebarChange={updateFromSidebar}
        />
        
        {/* Main Content */}
        <main className="flex-1 ml-80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-8">
              <QueryParser 
                parsedFilters={parsedFilters}
                onQueryParsed={updateFromQuery}
              />

              {/* Show CompanyResults when there are active filters (from sidebar or parsing) */}
              {parsedFilters && Object.keys(parsedFilters).length > 0 && (
                <CompanyResults parsedFilters={parsedFilters} />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
