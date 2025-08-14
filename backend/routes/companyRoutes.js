const express = require("express");
const router = express.Router();
const axios = require("axios");
const config = require("../config");
const { industry_data } = require("../industry_data");
const { region_data } = require("../region_data");
const { mapKeywords } = require("../utils/keywordsMap");

/**
 * Find companies based on structured filters
 * POST /api/find-companies
 */
router.post("/find-companies", async (req, res) => {
  // Declare requestBody at the top level so it's accessible in both try and catch blocks
  let requestBody = {};

  try {
    const { filters, page = 1 } = req.body;

    if (!filters || !Array.isArray(filters) || filters.length === 0) {
      return res.status(400).json({ error: "At least one filter is required" });
    }
    
    // No pre-processing of filters needed

    // Map industry and keyword values to their Crustdata equivalents
    const mappedFilters = filters.map((filter) => {
      const mappedFilter = { ...filter };

      // Apply appropriate mapping based on filter type
      if (filter.filter_type === "INDUSTRY" && Array.isArray(filter.value)) {
        // Match industries directly from industry_data.js
        mappedFilter.value = filter.value.map(industry => {
          if (!industry) return industry;
          
          // Find exact match (case-insensitive)
          const exactMatch = industry_data.find(ind => 
            ind.toLowerCase() === industry.toLowerCase()
          );
          
          if (exactMatch) {
            console.log(`Found exact industry match: "${industry}" → "${exactMatch}"`);
            return exactMatch;
          }
          
          // If no exact match, find partial match
          const partialMatch = industry_data.find(ind => 
            ind.toLowerCase().includes(industry.toLowerCase())
          );
          
          if (partialMatch) {
            console.log(`Found partial industry match: "${industry}" → "${partialMatch}"`);
            return partialMatch;
          }
          
          console.log(`No industry match found for: "${industry}", using as is`);
          return industry;
        });
      } else if (
        filter.filter_type === "KEYWORD" &&
        Array.isArray(filter.value)
      ) {
        const mappedValues = mapKeywords(filter.value);
        // Crustdata only allows one keyword, so take just the first one
        if (mappedValues.length > 0) {
          mappedFilter.value = [mappedValues[0]];
          console.log(
            `Keyword mapping (limited to first): ${JSON.stringify(
              filter.value
            )} → ${JSON.stringify(mappedFilter.value)}`
          );
        } else {
          mappedFilter.value = [];
          console.log(`Keyword mapping: No valid keywords found`);
        }
      } else if (
        filter.filter_type === "REGION" &&
        Array.isArray(filter.value)
      ) {
        // Use the regionNames if available, as they should be in the correct format
        if (req.body.regionNames && req.body.regionNames.length > 0) {
          mappedFilter.value = req.body.regionNames;
          console.log('Using regionNames for REGION filter:', req.body.regionNames);
        } else {
          // If no regionNames, use the filter value directly
          mappedFilter.value = filter.value;
          console.log('Using direct filter value for REGION:', filter.value);
        }
      }

      return mappedFilter;
    });

    // Filter out people-specific filters that are not valid for company search
    const validCompanyFilters = mappedFilters.filter(filter => {
      const validCompanyFilterTypes = [
        'COMPANY_HEADCOUNT',
        'REGION', 
        'INDUSTRY',
        'NUM_OF_FOLLOWERS',
        'DEPARTMENT_HEADCOUNT_GROWTH',
        'FORTUNE',
        'TECHNOLOGIES_USED',
        'COMPANY_HEADCOUNT_GROWTH',
        'ANNUAL_REVENUE',
        'DEPARTMENT_HEADCOUNT',
        'ACCOUNT_ACTIVITIES',
        'JOB_OPPORTUNITIES',
        'KEYWORD'
      ];
      
      const isValid = validCompanyFilterTypes.includes(filter.filter_type);
      if (!isValid) {
        console.log(`Filtering out people-specific filter: ${filter.filter_type} (not valid for company search)`);
      } else {
        console.log(`Using company filter: ${filter.filter_type}`);
      }
      return isValid;
    });

    console.log(`Total filters received: ${mappedFilters.length}, Valid company filters: ${validCompanyFilters.length}`);

    // Prepare request body
    requestBody = {
      filters: validCompanyFilters,
      page,
      page_size: 10, // Specify page size to ensure consistent pagination
    };
    
    // No additional region mapping needed

    console.log(
      "Sending request to Crustdata API:",
      JSON.stringify(requestBody, null, 2)
    );

    // Call Crustdata API with retry logic
    let response;
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        response = await axios.post(
          "https://api.crustdata.com/screener/company/search",
          requestBody,
          {
            headers: {
              Authorization: `Bearer ${config.crustdataApiKey}`,
              "Content-Type": "application/json",
            },
            timeout: 30000,
          }
        );
        break; // Success, exit the retry loop
      } catch (apiError) {
        retryCount++;
        if (retryCount > maxRetries) {
          throw apiError; // Max retries reached, rethrow the error
        }
        console.log(
          `API call failed, retrying (${retryCount}/${maxRetries})...`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retry
      }
    }

    // Extract companies and total count
    const companies = response.data.companies || response.data.results || [];
    const total_count =
      response.data.total_count ||
      response.data.total_display_count ||
      companies.length;

    // Return the companies data with pagination info
    res.json({
      companies: companies,
      total_count: total_count,
      page: page,
    });
  } catch (error) {
    console.error(
      "Error from Crustdata:",
      error.response?.data || error.message
    );

    // Make a clean copy of the request body for logging
    const safeRequestBody = { ...requestBody };

    // Handle specific error cases
    if (error.response?.data?.error === "Failed to parse search query") {
      // This often happens with pagination when there are no more results
      return res.json({
        companies: [],
        total_count: 0,
        page: req.body.page || 1,
        error: "No more results available",
      });
    }

    // Handle other API errors
    if (error.response && error.response.data) {
      return res.status(error.response.status || 500).json({
        error: "Error from Crustdata API",
        details: error.response.data,
        sentRequest: safeRequestBody,
      });
    }

    return res.status(500).json({
      error: "Server error finding companies",
      message: error.message,
      sentRequest: safeRequestBody,
    });
  }
});

module.exports = router;
