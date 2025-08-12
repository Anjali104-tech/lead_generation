const express = require("express");
const router = express.Router();
const axios = require("axios");
const config = require("../config");

/**
 * Find contacts from selected companies and job titles using Crustdata's Person Search API
 * POST /api/find-contacts
 */
router.post("/find-contacts", async (req, res) => {
  // Declare requestBody at the top level so it's accessible in the catch block
  let requestBody = {};
  
  try {
    const { companies, job_titles, page = 1 } = req.body;
    const pageNum = parseInt(page);

    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      return res.status(400).json({ error: "Company information is required." });
    }

    // Extract company domains or LinkedIn IDs from the company objects
    const companyIdentifiers = companies.map(company => {
      // Prefer domain if available, as it's more reliable for person search
      if (company.domain) return company.domain;
      if (company.website) {
       
        try {
          const url = new URL(company.website);
          return url.hostname.replace('www.', '');
        } catch (e) {
          // If URL parsing fails, return the website as is
          return company.website;
        }
      }
      // Fall back to LinkedIn URL if available
      if (company.linkedin_url) return company.linkedin_url;
      
      // Last resort: company name
      return company.name;
    });

    const filters = [
      {
        filter_type: "CURRENT_COMPANY",
        type: "in",
        value: companyIdentifiers
      }
    ];

    if (job_titles && job_titles.length > 0) {
      filters.push({
        filter_type: "CURRENT_TITLE",
        type: "in",
        value: job_titles
      });
    }

    // Make title matching less strict to get more results
    const post_processing = job_titles && job_titles.length > 0 ? {
      strict_title_and_company_match: false
    } : undefined;

    // Set the items per page to 20 as requested
    let requestBody = {
      filters,
      page: pageNum,
      limit: 20,
      post_processing
    };

    console.log('Sending request to Crustdata Person Search API:', JSON.stringify(requestBody, null, 2));
    
    const response = await axios.post(
      "https://api.crustdata.com/screener/person/search",
      requestBody, 
      {
        headers: {
          'Authorization': `Bearer ${config.crustdataApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Check if we need to handle pagination
    const totalResults = parseInt(response.data.total_display_count) || 0;
    const profiles = response.data.profiles || [];
    
    console.log(`Retrieved ${profiles.length} profiles out of ${totalResults} total matches`);
    
    // Calculate total pages (max 50 pages for up to 1000 results)
    const itemsPerPage = 20;
    const totalPages = Math.min(Math.ceil(totalResults / itemsPerPage), 50);
    
    res.json({
      profiles,
      total_count: totalResults,
      current_page: pageNum || 1,
      total_pages: totalPages,
      items_per_page: itemsPerPage
    });
  } catch (error) {
    console.error('Error from Crustdata Person Search API:', error.response?.data || error.message);
    
    // Make a clean copy of the request body for logging
    const safeRequestBody = { ...requestBody };
    
    if (error.response && error.response.data) {
      return res.status(error.response.status).json({
        error: 'Error from Crustdata Person Search API',
        details: error.response.data,
        sentRequest: safeRequestBody
      });
    }

    return res.status(500).json({ 
      error: 'Server error finding contacts', 
      message: error.message,
      sentRequest: safeRequestBody
    });
  }
});

module.exports = router;