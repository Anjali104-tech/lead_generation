import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { API_ENDPOINTS } from "../config/api";

const Sidebar = ({ sidebarFilters, onSidebarChange }) => {
  const [expandedSections, setExpandedSections] = useState({});
  const [filterData, setFilterData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const sidebarRef = useRef(null);
  const scrollPositionRef = useRef(0);

  // Local state for filter selections
  const [selectedFilters, setSelectedFilters] = useState({
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
    departmentGrowthRanges: [],
    specializations: [],
    accountActivities: [],
    currentCompany: null,
    yearsAtCompany: [],
    yearsInPosition: [],
    jobOpportunities: [],
    recentlyChanged: null,
    linkedinPosted: null,
    inTheNews: null,
  });

  // Predefined options for specializations
  const specializationOptions = [
    "AI/ML",
    "Blockchain",
    "SaaS",
    "Fintech",
    "E-commerce",
    "Healthcare",
    "EdTech",
    "Cybersecurity",
    "IoT",
    "Cloud Computing",
    "Mobile Apps",
    "Data Analytics",
    "Machine Learning",
    "Artificial Intelligence",
    "Robotics",
    "Biotechnology",
    "Clean Energy",
    "Real Estate Tech",
    "Food Tech",
    "Travel Tech",
    "Entertainment",
    "Gaming",
    "Social Media",
    "B2B",
    "B2C",
    "Enterprise",
    "Startup",
    "Scale-up",
    "Unicorn",
  ];

  // Predefined options for keywords
  const keywordOptions = [
    "startup",
    "enterprise",
    "B2B",
    "B2C",
    "AI",
    "ML",
    "blockchain",
    "fintech",
    "healthtech",
    "edtech",
    "proptech",
    "foodtech",
    "traveltech",
    "cybersecurity",
    "cloud",
    "saas",
    "mobile",
    "web",
    "data",
    "analytics",
    "automation",
    "digital",
    "innovation",
    "technology",
    "software",
    "hardware",
    "platform",
    "marketplace",
    "subscription",
    "freemium",
  ];

  // Predefined options for current companies (popular companies)
  const companyOptions = [
    "Google",
    "Microsoft",
    "Apple",
    "Amazon",
    "Meta",
    "Netflix",
    "Tesla",
    "Salesforce",
    "Adobe",
    "Oracle",
    "IBM",
    "Intel",
    "Cisco",
    "NVIDIA",
    "AMD",
    "Qualcomm",
    "PayPal",
    "Stripe",
    "Square",
    "Shopify",
    "Uber",
    "Lyft",
    "Airbnb",
    "DoorDash",
    "Instacart",
    "Zoom",
    "Slack",
    "Notion",
    "Figma",
    "Canva",
    "Spotify",
    "Pinterest",
    "Twitter",
    "LinkedIn",
    "GitHub",
    "Atlassian",
    "MongoDB",
    "Databricks",
    "Snowflake",
    "Palantir",
  ];

  // Update local state when props change (from query parser)
  useEffect(() => {
    if (sidebarFilters && Object.keys(sidebarFilters).length > 0) {
      setSelectedFilters((prev) => ({ ...prev, ...sidebarFilters }));
    }
  }, [sidebarFilters]);

  // Fetch filter data from API
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_ENDPOINTS.FILTER_DATA);
        const result = await response.json();

        if (result.success) {
          // Use hardcoded regions instead of API data
          const hardcodedRegions = [
            "United States",
            "Canada",
            "United Kingdom",
            "Germany",
            "France",
            "Australia",
            "India",
            "China",
            "Japan",
            "Brazil",
            "Mexico",
            "Netherlands",
            "Sweden",
            "Norway",
            "Denmark",
            "Finland",
            "Switzerland",
            "Austria",
            "Belgium",
            "Italy",
            "Spain",
            "Portugal",
            "Ireland",
            "New Zealand",
            "Singapore",
            "South Korea",
            "Israel",
            "United Arab Emirates",
            "Saudi Arabia",
            "South Africa"
          ];
          
          setFilterData({
            ...result.data,
            regions: hardcodedRegions
          });
        } else {
          setError("Failed to fetch filter data");
        }
      } catch (err) {
        setError("Error fetching filter data: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFilterData();
  }, []);

  // Track scroll position
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const handleScroll = () => {
      scrollPositionRef.current = sidebar.scrollTop;
    };

    sidebar.addEventListener("scroll", handleScroll);
    return () => sidebar.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleSection = (sectionName) => {
    // Store current scroll position
    if (sidebarRef.current) {
      scrollPositionRef.current = sidebarRef.current.scrollTop;
    }

    // Use a callback to ensure scroll position is restored after state update
    setExpandedSections((prev) => {
      const newState = {
        ...prev,
        [sectionName]: !prev[sectionName],
      };

      // Schedule scroll restoration for the next tick
      requestAnimationFrame(() => {
        if (sidebarRef.current && scrollPositionRef.current > 0) {
          sidebarRef.current.scrollTop = scrollPositionRef.current;
        }
      });

      return newState;
    });
  };

  // Restore scroll position after DOM updates
  useLayoutEffect(() => {
    if (sidebarRef.current && scrollPositionRef.current > 0) {
      sidebarRef.current.scrollTop = scrollPositionRef.current;
    }
  });

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...selectedFilters };

    if (Array.isArray(value)) {
      newFilters[filterType] = value;
    } else {
      newFilters[filterType] = value;
    }

    setSelectedFilters(newFilters);
  };

  // Handle checkbox changes for multi-select
  const handleCheckboxChange = (filterType, option, checked) => {
    const currentValues = selectedFilters[filterType] || [];
    let newValues;

    if (checked) {
      newValues = [...currentValues, option];
    } else {
      newValues = currentValues.filter((item) => item !== option);
    }

    handleFilterChange(filterType, newValues);
  };

  // Handle radio button changes
  const handleRadioChange = (filterType, value) => {
    handleFilterChange(filterType, value);
  };

  // Clear all filters
  const clearAllFilters = () => {
    const emptyFilters = {
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
      departmentGrowthRanges: [],
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

    setSelectedFilters(emptyFilters);
    if (onSidebarChange) {
      onSidebarChange(emptyFilters);
    }
  };

  // Apply filters function
  const applyFilters = () => {
    if (onSidebarChange) {
      onSidebarChange(selectedFilters);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading filters...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading filters</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Extract data from filterData
  const {
    jobTitles = [],
    industries = [],
    regions = [],
    companySizes = [],
    revenueRanges = [],
    seniorityLevels = [],
    yearsRanges = [],
    growthRanges = [],
    departments = [],
    booleanOptions = [],
  } = filterData;

  const FilterSection = ({ title, children, isExpanded, onToggle, hasActiveFilters }) => (
    <div className="mb-2">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2.5 text-left bg-gray-50/80 border-2 border-gray-200/60 rounded-lg hover:bg-gray-100/80 transition-all duration-200 group"
      >
        <div className="flex items-center space-x-2">
          <span className="font-medium text-sm text-gray-900 group-hover:text-blue-600 transition-colors duration-200">{title}</span>
          {hasActiveFilters && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm">
              Active
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-all duration-300 group-hover:text-blue-600 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'
        }`}
      >
        <div className="p-3 bg-white border border-gray-200/60 rounded-lg">
          {children}
        </div>
      </div>
    </div>
  );

  const MultiSelectDropdown = ({ options, placeholder, filterType }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const filteredOptions = options.filter((option) =>
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    return (
      <div className="space-y-2 " ref={dropdownRef}>
        <div className="relative">
          <input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsOpen(true)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <div className="absolute right-3 top-2.5">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        {isOpen && (
          <div className="max-h-40 overflow-y-auto space-y-1 border border-gray-200 rounded-md p-2 bg-white dropdown-options">
            {filteredOptions.map((option, index) => {
              const isSelected =
                selectedFilters[filterType] &&
                selectedFilters[filterType].includes(option);
              return (
                <label
                  key={index}
                  className="flex items-center space-x-2 text-sm"
                >
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={isSelected}
                    onChange={(e) =>
                      handleCheckboxChange(filterType, option, e.target.checked)
                    }
                  />
                  <span
                    className={`text-gray-700 ${
                      isSelected ? "font-medium" : ""
                    }`}
                  >
                    {option}
                  </span>
                </label>
              );
            })}
            {filteredOptions.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-2">
                No options found
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const RangeSlider = ({ min, max, step = 1 }) => (
    <div className="space-y-3">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        onFocus={(e) => e.target.blur()}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
      <div className="flex space-x-2">
        <input
          type="number"
          placeholder="Min"
          onFocus={(e) => e.target.blur()}
          className="w-1/2 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          type="number"
          placeholder="Max"
          onFocus={(e) => e.target.blur()}
          className="w-1/2 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    </div>
  );

  const RadioGroup = ({ options, name, filterType }) => (
    <div className="space-y-2">
      {options.map((option, index) => {
        const isSelected = selectedFilters[filterType] === option.value;
        return (
          <label key={index} className="flex items-center space-x-2 text-sm">
            <input
              type="radio"
              name={name}
              value={option.value}
              className="text-blue-600 focus:ring-blue-500"
              checked={isSelected}
              onChange={() => handleRadioChange(filterType, option.value)}
            />
            <span
              className={`text-gray-700 ${isSelected ? "font-medium" : ""}`}
            >
              {option.label}
            </span>
          </label>
        );
      })}
    </div>
  );

  return (
    <div className="w-80 bg-white/90 backdrop-blur-sm border-r border-gray-200/50 h-screen flex flex-col shadow-xl fixed left-0 top-0 z-50" style={{ overscrollBehavior: 'contain' }}>
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto sidebar-scrollbar min-h-0" ref={sidebarRef} style={{ overscrollBehavior: 'contain' }}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Filters</h2>
              <p className="text-sm text-gray-600">Refine your search results</p>
            </div>
          </div>


          {/* Active Filters Summary */}
          {Object.values(selectedFilters).some(value =>
            (Array.isArray(value) && value && value.length > 0) ||
            (typeof value === 'boolean' && value !== null)
          ) && (
            <div className="mt-4 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-blue-200/50 shadow-sm">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h3 className="text-sm font-semibold text-blue-900">Active Filters:</h3>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedFilters.jobTitles && selectedFilters.jobTitles.length > 0 && (
                  <div className="text-xs text-blue-700 bg-blue-50 px-2 rounded-md">
                    <strong>Job Titles:</strong> {selectedFilters.jobTitles.join(', ')}
                  </div>
                )}
                {selectedFilters.industries && selectedFilters.industries.length > 0 && (
                  <div className="text-xs text-blue-700 bg-blue-50 px-2 rounded-md">
                    <strong>Industries:</strong> {selectedFilters.industries.join(', ')}
                  </div>
                )}
                {selectedFilters.regions && selectedFilters.regions.length > 0 && (
                  <div className="text-xs text-blue-700 bg-blue-50 px-2 rounded-md">
                    <strong>Regions:</strong> {selectedFilters.regions.join(', ')}
                  </div>
                )}
                {selectedFilters.companySizes && selectedFilters.companySizes.length > 0 && (
                  <div className="text-xs text-blue-700 bg-blue-50 px-2 rounded-md">
                    <strong>Company Size:</strong> {selectedFilters.companySizes.join(', ')}
                  </div>
                )}
                {selectedFilters.revenueRanges && selectedFilters.revenueRanges.length > 0 && (
                  <div className="text-xs text-blue-700 bg-blue-50 px-2 rounded-md">
                    <strong>Revenue:</strong> {selectedFilters.revenueRanges.join(', ')}
                  </div>
                )}
                {selectedFilters.seniorityLevels && selectedFilters.seniorityLevels.length > 0 && (
                  <div className="text-xs text-blue-700 bg-blue-50 px-2 rounded-md">
                    <strong>Seniority:</strong> {selectedFilters.seniorityLevels.join(', ')}
                  </div>
                )}
                {selectedFilters.yearsRanges && selectedFilters.yearsRanges.length > 0 && (
                  <div className="text-xs text-blue-700 bg-blue-50 px-2 rounded-md">
                    <strong>Years of Experience:</strong> {selectedFilters.yearsRanges.join(', ')}
                  </div>
                )}
                {selectedFilters.yearsAtCompany && selectedFilters.yearsAtCompany.length > 0 && (
                  <div className="text-xs text-blue-700 bg-blue-50 px-2 rounded-md">
                    <strong>Years at Company:</strong> {selectedFilters.yearsAtCompany.join(', ')}
                  </div>
                )}
                {selectedFilters.yearsInPosition && selectedFilters.yearsInPosition.length > 0 && (
                  <div className="text-xs text-blue-700 bg-blue-50 px-2 rounded-md">
                    <strong>Years in Position:</strong> {selectedFilters.yearsInPosition.join(', ')}
                  </div>
                )}
                {selectedFilters.growthRanges && selectedFilters.growthRanges.length > 0 && (
                  <div className="text-xs text-blue-700 bg-blue-50 px-2 rounded-md">
                    <strong>Company Growth:</strong> {selectedFilters.growthRanges.join(', ')}
                  </div>
                )}
                {selectedFilters.departments && selectedFilters.departments.length > 0 && (
                  <div className="text-xs text-blue-700 bg-blue-50 px-2 rounded-md">
                    <strong>Departments:</strong> {selectedFilters.departments.join(', ')}
                  </div>
                )}
                {selectedFilters.departmentSizes && selectedFilters.departmentSizes.length > 0 && (
                  <div className="text-xs text-blue-700 bg-blue-50 px-2 rounded-md">
                    <strong>Department Size:</strong> {selectedFilters.departmentSizes.join(', ')}
                  </div>
                )}
                {selectedFilters.specializations && selectedFilters.specializations.length > 0 && (
                  <div className="text-xs text-blue-700 bg-blue-50 px-2 rounded-md">
                    <strong>Specializations:</strong> {selectedFilters.specializations.join(', ')}
                  </div>
                )}
                {selectedFilters.currentCompany && (
                  <div className="text-xs text-blue-700 bg-blue-50 px-2 rounded-md">
                    <strong>Current Company:</strong> {selectedFilters.currentCompany}
                  </div>
                )}
                {selectedFilters.jobOpportunities && selectedFilters.jobOpportunities.length > 0 && (
                  <div className="text-xs text-blue-700 bg-blue-50 px-2 rounded-md">
                    <strong>Job Opportunities:</strong> {selectedFilters.jobOpportunities.join(', ')}
                  </div>
                )}
                {selectedFilters.recentlyChanged === true && (
                  <div className="text-xs text-blue-700 bg-blue-50 px-2 rounded-md">
                    <strong>Recently Changed Jobs:</strong> Yes
                  </div>
                )}
                {selectedFilters.linkedinPosted === true && (
                  <div className="text-xs text-blue-700 bg-blue-50 px-2 rounded-md">
                    <strong>Posted on LinkedIn:</strong> Yes
                  </div>
                )}
                {selectedFilters.inTheNews === true && (
                  <div className="text-xs text-blue-700 bg-blue-50 px-2 rounded-md">
                    <strong>In the News:</strong> Yes
                  </div>
                )}
                {selectedFilters.accountActivities && selectedFilters.accountActivities.length > 0 && (
                  <div className="text-xs text-blue-700 bg-blue-50 px-2 rounded-md">
                    <strong>Account Activities:</strong> {selectedFilters.accountActivities.join(', ')}
                  </div>
                )}
                {selectedFilters.departmentGrowthRanges && selectedFilters.departmentGrowthRanges.length > 0 && (
                  <div className="text-xs text-blue-700 bg-blue-50 px-2 rounded-md">
                    <strong>Department Growth:</strong> {selectedFilters.departmentGrowthRanges.join(', ')}%
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Filter Sections */}
        <div className="px-4 py-4 space-y-2">
          {/* Job Titles */}
          <FilterSection
            title="Job Titles"
            isExpanded={expandedSections.jobTitles}
            onToggle={() => toggleSection("jobTitles")}
            hasActiveFilters={
              selectedFilters.jobTitles && selectedFilters.jobTitles.length > 0
            }
          >
            <MultiSelectDropdown
              options={jobTitles}
              placeholder="Search job titles..."
              filterType="jobTitles"
            />
          </FilterSection>

          {/* Industries */}
          <FilterSection
            title="Industries"
            isExpanded={expandedSections.industries}
            onToggle={() => toggleSection("industries")}
            hasActiveFilters={
              selectedFilters.industries &&
              selectedFilters.industries.length > 0
            }
          >
            <MultiSelectDropdown
              options={industries}
              placeholder="Search industries..."
              filterType="industries"
            />
          </FilterSection>

          {/* Specializations/Tags */}
          <FilterSection
            title="Specializations"
            isExpanded={expandedSections.specializations}
            onToggle={() => toggleSection("specializations")}
            hasActiveFilters={
              selectedFilters.specializations &&
              selectedFilters.specializations.length > 0
            }
          >
            <div className="space-y-2">
              <MultiSelectDropdown
                options={specializationOptions}
                placeholder="Select specializations..."
                filterType="specializations"
              />
              <div className="flex flex-wrap gap-2">
                {selectedFilters.specializations &&
                  selectedFilters.specializations.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 tag"
                    >
                      {tag}
                      <button
                        className="ml-1 text-blue-600 hover:text-blue-800"
                        onClick={() => {
                          const newSpecializations =
                            selectedFilters.specializations.filter(
                              (_, i) => i !== index
                            );
                          handleFilterChange(
                            "specializations",
                            newSpecializations
                          );
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
              </div>
            </div>
          </FilterSection>

          {/* Regions */}
          <FilterSection
            title="Regions"
            isExpanded={expandedSections.regions}
            onToggle={() => toggleSection("regions")}
            hasActiveFilters={
              selectedFilters.regions && selectedFilters.regions.length > 0
            }
          >
            <MultiSelectDropdown
              options={regions}
              placeholder="Search regions..."
              filterType="regions"
            />
          </FilterSection>

          {/* Company Headcount */}
          <FilterSection
            title="Company Size"
            isExpanded={expandedSections.companySize}
            onToggle={() => toggleSection("companySize")}
            hasActiveFilters={
              selectedFilters.companySizes &&
              selectedFilters.companySizes.length > 0
            }
          >
            <MultiSelectDropdown
              options={companySizes}
              placeholder="Select company size..."
              filterType="companySizes"
            />
          </FilterSection>

          {/* Company Headcount Growth */}
          <FilterSection
            title="Company Growth"
            isExpanded={expandedSections.companyGrowth}
            onToggle={() => toggleSection("companyGrowth")}
            hasActiveFilters={
              selectedFilters.growthRanges &&
              selectedFilters.growthRanges.length > 0
            }
          >
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>200%</span>
              </div>
              <input
                type="range"
                min={0}
                max={200}
                step={5}
                value={(() => {
                  const growthRange = selectedFilters.growthRanges?.[0];
                  if (growthRange && growthRange.includes("-")) {
                    const min = growthRange.split("-")[0];
                    return parseInt(min) || 0;
                  }
                  return 0;
                })()}
                onChange={(e) => {
                  const min = parseInt(e.target.value);
                  const currentRange = selectedFilters.growthRanges?.[0];
                  let max = 50; // default max

                  if (currentRange && currentRange.includes("-")) {
                    const parts = currentRange.split("-");
                    max = parseInt(parts[1]) || min + 10;
                  } else {
                    max = min + 10;
                  }

                  if (max < min) max = min + 10;
                  handleFilterChange("growthRanges", [`${min}-${max}%`]);
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min %"
                  className="w-1/2 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max %"
                  className="w-1/2 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </FilterSection>

          {/* Annual Revenue */}
          <FilterSection
            title="Annual Revenue"
            isExpanded={expandedSections.revenue}
            onToggle={() => toggleSection("revenue")}
            hasActiveFilters={
              selectedFilters.revenueRanges &&
              selectedFilters.revenueRanges.length > 0
            }
          >
            <MultiSelectDropdown
              options={revenueRanges}
              placeholder="Select revenue range..."
              filterType="revenueRanges"
            />
          </FilterSection>

          {/* Department Headcount */}
          <FilterSection
            title="Department Size"
            isExpanded={expandedSections.departmentSize}
            onToggle={() => toggleSection("departmentSize")}
            hasActiveFilters={
              (selectedFilters.departments &&
                selectedFilters.departments.length > 0) ||
              (selectedFilters.departmentSizes &&
                selectedFilters.departmentSizes.length > 0)
            }
          >
            <div className="space-y-3">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                value={selectedFilters.departments?.[0] || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "departments",
                    e.target.value ? [e.target.value] : []
                  )
                }
              >
                <option value="">Select Department</option>
                {departments.map((dept, index) => (
                  <option key={index} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1</span>
                  <span>1000</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={1000}
                  step={1}
                  value={(() => {
                    const deptSize = selectedFilters.departmentSizes?.[0];
                    if (deptSize && deptSize.includes("-")) {
                      const min = deptSize.split("-")[0];
                      return parseInt(min) || 1;
                    }
                    return 1;
                  })()}
                  onChange={(e) => {
                    const min = parseInt(e.target.value);
                    const currentSize = selectedFilters.departmentSizes?.[0];
                    let max = 100;

                    if (currentSize && currentSize.includes("-")) {
                      const parts = currentSize.split("-");
                      max = parseInt(parts[1]) || min + 50;
                    } else {
                      max = min + 50;
                    }

                    if (max < min) max = min + 50;
                    handleFilterChange("departmentSizes", [`${min}-${max}`]);
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={(() => {
                      const deptSize = selectedFilters.departmentSizes?.[0];
                      if (deptSize && deptSize.includes("-")) {
                        return deptSize.split("-")[0];
                      }
                      return "";
                    })()}
                    onChange={(e) => {
                      const min = e.target.value;
                      const currentSize = selectedFilters.departmentSizes?.[0];
                      let max = 100;

                      if (currentSize && currentSize.includes("-")) {
                        const parts = currentSize.split("-");
                        max = parseInt(parts[1]) || parseInt(min) + 50;
                      } else {
                        max = parseInt(min) + 50;
                      }

                      if (min && !isNaN(parseInt(min))) {
                        if (max < parseInt(min)) max = parseInt(min) + 50;
                        handleFilterChange("departmentSizes", [
                          `${min}-${max}`,
                        ]);
                      } else {
                        handleFilterChange("departmentSizes", []);
                      }
                    }}
                    className="w-1/2 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={(() => {
                      const deptSize = selectedFilters.departmentSizes?.[0];
                      if (deptSize && deptSize.includes("-")) {
                        return deptSize.split("-")[1];
                      }
                      return "";
                    })()}
                    onChange={(e) => {
                      const max = e.target.value;
                      const currentSize = selectedFilters.departmentSizes?.[0];
                      let min = 1;

                      if (currentSize && currentSize.includes("-")) {
                        min = parseInt(currentSize.split("-")[0]) || 1;
                      }

                      if (max && !isNaN(parseInt(max))) {
                        if (parseInt(max) < min) min = parseInt(max) - 50;
                        handleFilterChange("departmentSizes", [
                          `${min}-${max}`,
                        ]);
                      } else {
                        handleFilterChange("departmentSizes", []);
                      }
                    }}
                    className="w-1/2 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </FilterSection>

          {/* Department Headcount Growth */}
          <FilterSection
            title="Department Growth"
            isExpanded={expandedSections.departmentGrowth}
            onToggle={() => toggleSection("departmentGrowth")}
            hasActiveFilters={
              (selectedFilters.departments && selectedFilters.departments.length > 0) ||
              (selectedFilters.departmentGrowthRanges && selectedFilters.departmentGrowthRanges.length > 0)
            }
          >
            <div className="space-y-4">
              {/* Department Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Department
                </label>
                <MultiSelectDropdown
                  options={[
                    "Accounting", "Administrative", "Arts and Design", "Business Development",
                    "Community and Social Services", "Consulting", "Education", "Engineering",
                    "Entrepreneurship", "Finance", "Healthcare Services", "Human Resources",
                    "Information Technology", "Legal", "Marketing", "Media and Communication",
                    "Military and Protective Services", "Operations", "Product Management",
                    "Program and Project Management", "Purchasing", "Quality Assurance",
                    "Real Estate", "Research", "Sales", "Customer Success and Support"
                  ]}
                  placeholder="Select departments..."
                  filterType="departments"
                />
              </div>

              {/* Growth Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Growth Range (%)
                </label>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0%</span>
                    <span>200%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    step={5}
                    value={selectedFilters.departmentGrowthRanges?.[0] || 0}
                    onChange={(e) => {
                      e.preventDefault();
                      const value = parseInt(e.target.value);
                      const currentRanges = selectedFilters.departmentGrowthRanges || [0];
                      handleFilterChange("departmentGrowthRanges", [value, currentRanges[1] || 200]);
                    }}
                    onFocus={(e) => e.target.blur()}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Min %"
                      value={selectedFilters.departmentGrowthRanges?.[0] || ""}
                      onChange={(e) => {
                        e.preventDefault();
                        const value = e.target.value ? parseInt(e.target.value) : 0;
                        const currentRanges = selectedFilters.departmentGrowthRanges || [0, 200];
                        handleFilterChange("departmentGrowthRanges", [value, currentRanges[1]]);
                      }}
                      onFocus={(e) => e.target.blur()}
                      className="w-1/2 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Max %"
                      value={selectedFilters.departmentGrowthRanges?.[1] || ""}
                      onChange={(e) => {
                        e.preventDefault();
                        const value = e.target.value ? parseInt(e.target.value) : 200;
                        const currentRanges = selectedFilters.departmentGrowthRanges || [0, 200];
                        handleFilterChange("departmentGrowthRanges", [currentRanges[0], value]);
                      }}
                      onFocus={(e) => e.target.blur()}
                      className="w-1/2 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </FilterSection>

          {/* Account Activities */}
          <FilterSection
            title="Account Activities"
            isExpanded={expandedSections.activities}
            onToggle={() => toggleSection("activities")}
            hasActiveFilters={
              selectedFilters.accountActivities &&
              selectedFilters.accountActivities.length > 0
            }
          >
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={
                    selectedFilters.accountActivities?.includes(
                      "Senior leadership changes in last 3 months"
                    ) || false
                  }
                  onChange={(e) => {
                    const currentActivities =
                      selectedFilters.accountActivities || [];
                    if (e.target.checked) {
                      handleFilterChange("accountActivities", [
                        ...currentActivities,
                        "Senior leadership changes in last 3 months",
                      ]);
                    } else {
                      handleFilterChange(
                        "accountActivities",
                        currentActivities.filter(
                          (activity) =>
                            activity !==
                            "Senior leadership changes in last 3 months"
                        )
                      );
                    }
                  }}
                />
                <span className="text-gray-700">
                  Senior leadership changes in last 3 months
                </span>
              </label>
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={
                    selectedFilters.accountActivities?.includes(
                      "Funding events in past 12 months"
                    ) || false
                  }
                  onChange={(e) => {
                    const currentActivities =
                      selectedFilters.accountActivities || [];
                    if (e.target.checked) {
                      handleFilterChange("accountActivities", [
                        ...currentActivities,
                        "Funding events in past 12 months",
                      ]);
                    } else {
                      handleFilterChange(
                        "accountActivities",
                        currentActivities.filter(
                          (activity) =>
                            activity !== "Funding events in past 12 months"
                        )
                      );
                    }
                  }}
                />
                <span className="text-gray-700">
                  Funding events in past 12 months
                </span>
              </label>
            </div>
          </FilterSection>

          {/* Job Opportunities */}
          <FilterSection
            title="Job Opportunities"
            isExpanded={expandedSections.jobOpportunities}
            onToggle={() => toggleSection("jobOpportunities")}
            hasActiveFilters={
              selectedFilters.jobOpportunities &&
              selectedFilters.jobOpportunities.length > 0
            }
          >
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={
                    selectedFilters.jobOpportunities?.includes(
                      "Hiring on Linkedin"
                    ) || false
                  }
                  onChange={(e) => {
                    const currentOpportunities =
                      selectedFilters.jobOpportunities || [];
                    if (e.target.checked) {
                      handleFilterChange("jobOpportunities", [
                        ...currentOpportunities,
                        "Hiring on Linkedin",
                      ]);
                    } else {
                      handleFilterChange(
                        "jobOpportunities",
                        currentOpportunities.filter(
                          (opportunity) => opportunity !== "Hiring on Linkedin"
                        )
                      );
                    }
                  }}
                />
                <span className="text-gray-700">Hiring on Linkedin</span>
              </label>
            </div>
          </FilterSection>

          {/* Keywords */}
          <FilterSection
            title="Keywords"
            isExpanded={expandedSections.keywords}
            onToggle={() => toggleSection("keywords")}
            hasActiveFilters={
              selectedFilters.specializations &&
              selectedFilters.specializations.length > 0
            }
          >
            <div className="space-y-2">
              <MultiSelectDropdown
                options={keywordOptions}
                placeholder="Select keywords..."
                filterType="specializations"
              />
              <div className="flex flex-wrap gap-2">
                {selectedFilters.specializations &&
                  selectedFilters.specializations.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 tag"
                    >
                      {keyword}
                      <button
                        className="ml-1 text-purple-600 hover:text-purple-800"
                        onClick={() => {
                          const newSpecializations =
                            selectedFilters.specializations.filter(
                              (_, i) => i !== index
                            );
                          handleFilterChange(
                            "specializations",
                            newSpecializations
                          );
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
              </div>
            </div>
          </FilterSection>

          {/* Current Company */}
          <FilterSection
            title="Current Company"
            isExpanded={expandedSections.currentCompany}
            onToggle={() => toggleSection("currentCompany")}
            hasActiveFilters={
              selectedFilters.currentCompany !== null &&
              selectedFilters.currentCompany !== undefined
            }
          >
            <MultiSelectDropdown
              options={companyOptions}
              placeholder="Search companies..."
              filterType="currentCompany"
            />
          </FilterSection>

          {/* Years of Experience */}
          <FilterSection
            title="Years of Experience"
            isExpanded={expandedSections.experience}
            onToggle={() => toggleSection("experience")}
            hasActiveFilters={
              selectedFilters.yearsRanges &&
              selectedFilters.yearsRanges.length > 0
            }
          >
            <MultiSelectDropdown
              options={yearsRanges}
              placeholder="Select experience range..."
              filterType="yearsRanges"
            />
          </FilterSection>

          {/* Years at Current Company */}
          <FilterSection
            title="Years at Company"
            isExpanded={expandedSections.yearsAtCompany}
            onToggle={() => toggleSection("yearsAtCompany")}
            hasActiveFilters={
              selectedFilters.yearsAtCompany &&
              selectedFilters.yearsAtCompany.length > 0
            }
          >
            <MultiSelectDropdown
              options={yearsRanges}
              placeholder="Select years range..."
              filterType="yearsAtCompany"
            />
          </FilterSection>

          {/* Years in Current Position */}
          <FilterSection
            title="Years in Position"
            isExpanded={expandedSections.yearsInPosition}
            onToggle={() => toggleSection("yearsInPosition")}
            hasActiveFilters={
              selectedFilters.yearsInPosition &&
              selectedFilters.yearsInPosition.length > 0
            }
          >
            <MultiSelectDropdown
              options={yearsRanges}
              placeholder="Select years range..."
              filterType="yearsInPosition"
            />
          </FilterSection>

          {/* Seniority Level */}
          <FilterSection
            title="Seniority Level"
            isExpanded={expandedSections.seniority}
            onToggle={() => toggleSection("seniority")}
            hasActiveFilters={
              selectedFilters.seniorityLevels &&
              selectedFilters.seniorityLevels.length > 0
            }
          >
            <MultiSelectDropdown
              options={seniorityLevels}
              placeholder="Select seniority level..."
              filterType="seniorityLevels"
            />
          </FilterSection>

          {/* Recently Changed Jobs */}
          <FilterSection
            title="Recently Changed Jobs"
            isExpanded={expandedSections.recentlyChanged}
            onToggle={() => toggleSection("recentlyChanged")}
            hasActiveFilters={
              selectedFilters.recentlyChanged !== null &&
              selectedFilters.recentlyChanged !== undefined
            }
          >
            <RadioGroup
              options={booleanOptions}
              name="recentlyChanged"
              filterType="recentlyChanged"
            />
          </FilterSection>

          {/* Posted on LinkedIn */}
          <FilterSection
            title="Posted on LinkedIn"
            isExpanded={expandedSections.linkedinPosted}
            onToggle={() => toggleSection("linkedinPosted")}
            hasActiveFilters={
              selectedFilters.linkedinPosted !== null &&
              selectedFilters.linkedinPosted !== undefined
            }
          >
            <RadioGroup
              options={booleanOptions}
              name="linkedinPosted"
              filterType="linkedinPosted"
            />
          </FilterSection>

          {/* In the News */}
          <FilterSection
            title="In the News"
            isExpanded={expandedSections.inTheNews}
            onToggle={() => toggleSection("inTheNews")}
            hasActiveFilters={
              selectedFilters.inTheNews !== null &&
              selectedFilters.inTheNews !== undefined
            }
          >
            <RadioGroup
              options={booleanOptions}
              name="inTheNews"
              filterType="inTheNews"
            />
          </FilterSection>
        </div>
      </div>

      {/* Sticky Action Buttons at Bottom */}
      <div className="p-4 border-t border-gray-200/50 bg-white/90 backdrop-blur-sm">
        <div className="flex space-x-3">
          <button 
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            onClick={applyFilters}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search</span>
            </div>
          </button>
          <button 
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold border border-gray-200 hover:border-gray-300"
            onClick={clearAllFilters}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Clear</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
