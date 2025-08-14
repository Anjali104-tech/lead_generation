const express = require("express");
const router = express.Router();
const axios = require("axios");
const config = require("../config");
const { industry_data: industryData } = require("../industry_data.js");
const { region_data } = require("../region_data.js");
const { validateIndustries, validateRegions } = require('../utils/filterValidator');
const { fuzzyFindMatch, matchWithSynonyms } = require('../utils/fuzzyMatch');

/**
 * Parse natural language query into structured filters
 * POST /api/parse-query
 */
router.post("/parse-query", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    // System prompt to guide the AI response
    const systemPrompt = `You are an assistant that converts natural language queries into structured filters for lead generation.
IMPORTANT: Only extract information that is EXPLICITLY mentioned in the query. Do NOT infer or assume additional information.

Return valid JSON with the following keys: CURRENT_TITLE, CURRENT_COMPANY, YEARS_OF_EXPERIENCE, INDUSTRY, TAGS, REGION, COMPANY_HEADCOUNT, COMPANY_HEADCOUNT_GROWTH, ANNUAL_REVENUE, DEPARTMENT_HEADCOUNT, DEPARTMENT_HEADCOUNT_GROWTH, ACCOUNT_ACTIVITIES, JOB_OPPORTUNITIES, KEYWORD, YEARS_AT_CURRENT_COMPANY, YEARS_IN_CURRENT_POSITION, SENIORITY_LEVEL, RECENTLY_CHANGED_JOBS, POSTED_ON_LINKEDIN, IN_THE_NEWS.

EXTRACTION RULES:
1. CURRENT_TITLE: Extract job titles mentioned (e.g., "CFO", "CEO", "CTO", "VP", "Director")
   - Extract the actual job title, not the seniority level
   - "senior directors" → CURRENT_TITLE: ["Director"], SENIORITY_LEVEL: ["Senior"]
   - "entry level managers" → CURRENT_TITLE: ["Manager"], SENIORITY_LEVEL: ["Entry Level"]
   - "vice presidents" → CURRENT_TITLE: ["Vice President"]
   - Expand abbreviations: "C-level" → ["CEO", "CFO", "CTO", "COO"]
   - "CFO" → ["CFO"] or ["Chief Financial Officer"]

2. CURRENT_COMPANY: Extract company names mentioned (e.g., "Google", "Microsoft", "Apple")
   - Only extract if explicitly mentioned
   - Do NOT infer company from context
   - Clean company names: remove domains (.com, .org, .net) and extract just the company name
   - "coursera.org" → ["Coursera"]
   - "google.com" → ["Google"]
   - "microsoft.com" → ["Microsoft"]

3. YEARS_OF_EXPERIENCE: Extract experience ranges mentioned
   - "5-10 years" → ["3 to 5 years", "6 to 10 years"]
   - "10+ years" → ["More than 10 years"]
   - "1-3 years" → ["1 to 2 years", "3 to 5 years"]

4. INDUSTRY: Only extract if explicitly mentioned
   - "fintech companies" → ["Financial Services"]
   - "AI companies" → ["Artificial Intelligence"]
   - "SaaS companies" → ["Software Development"]
   - Do NOT infer industry from company names

5. REGION: Only extract if explicitly mentioned
   - "in San Francisco" → ["San Francisco Bay Area"]
   - "in New York" → ["New York City Metropolitan Area"]
   - Do NOT infer location from company headquarters

6. COMPANY_HEADCOUNT: Only extract if explicitly mentioned (for overall company size)
   - "startups" → ["1-10", "11-50"]
   - "large companies" → ["1,001-5,000", "5,001-10,000", "10,001+"]
   - "companies with 100-500 employees" → ["51-200", "201-500"]
   - Do NOT infer size from company names

7. COMPANY_HEADCOUNT_GROWTH: Extract if explicitly mentioned (for overall company growth)
   - "companies with headcount growth between 10% and 50%" → {"min": 10, "max": 50}
   - "companies growing 20% or more" → {"min": 20, "max": 100}
   - "companies with employee growth over 30%" → {"min": 30, "max": 100}

8. ANNUAL_REVENUE: Extract if explicitly mentioned
   - "companies with revenue between $10M and $100M" → {"min": 10, "max": 100}
   - "companies with revenue over $1B" → {"min": 1000, "max": 10000}
   - "companies with annual revenue $50M-$500M" → {"min": 50, "max": 500}

9. DEPARTMENT_HEADCOUNT: Extract if explicitly mentioned (for specific department size)
   - "companies with engineering department headcount between 50 and 200" → {"min": 50, "max": 200, "sub_filter": "Engineering"}
   - "companies with sales team between 10 and 50" → {"min": 10, "max": 50, "sub_filter": "Sales"}
   - "companies with marketing department size 20-100" → {"min": 20, "max": 100, "sub_filter": "Marketing"}
   - "engineering team between 50 and 200" → {"min": 50, "max": 200, "sub_filter": "Engineering"}

10. DEPARTMENT_HEADCOUNT_GROWTH: Extract if explicitly mentioned (for specific department growth)
    - "companies with engineering team growth between 15% and 40%" → {"min": 15, "max": 40, "sub_filter": "Engineering"}
    - "sales team growth over 20%" → {"min": 20, "max": 100, "sub_filter": "Sales"}
    - "marketing department growth 10-30%" → {"min": 10, "max": 30, "sub_filter": "Marketing"}

11. ACCOUNT_ACTIVITIES: Extract if explicitly mentioned
    - "companies with recent job postings" → ["Recent Job Postings"]
    - "companies actively hiring" → ["Active Hiring"]
    - "companies with job opportunities" → ["Job Opportunities"]

12. JOB_OPPORTUNITIES: Extract if explicitly mentioned
    - "companies with open positions" → ["Open Positions"]
    - "companies hiring" → ["Hiring"]
    - "companies with job openings" → ["Job Openings"]

13. KEYWORD: Extract if explicitly mentioned
    - "companies with 'AI' technology" → ["AI"]
    - "companies with 'blockchain'" → ["blockchain"]
    - "companies with 'machine learning'" → ["machine learning"]

14. TAGS: Extract additional descriptors
    - "startup" → ["startup"]
    - "enterprise" → ["enterprise"]
    - "B2B" → ["B2B"]

15. YEARS_AT_CURRENT_COMPANY: Extract if explicitly mentioned
    - "worked at company for 3 years" → ["3 to 5 years"]
    - "at company for 1 year" → ["1 to 2 years"]

16. YEARS_IN_CURRENT_POSITION: Extract if explicitly mentioned
    - "in role for 2 years" → ["1 to 2 years"]
    - "position for 7 years" → ["6 to 10 years"]

17. SENIORITY_LEVEL: Extract if explicitly mentioned
    - "senior" → ["Senior"]
    - "entry level" → ["Entry Level"]
    - "director" → ["Director"]
    - "vice president" → ["Vice President"]
    - "CEO" → ["CXO"]
    - "CFO" → ["CXO"]
    - "CTO" → ["CXO"]
    - "junior" → ["Entry Level"]
    - "experienced" → ["Experienced Manager"]

18. RECENTLY_CHANGED_JOBS: Extract if explicitly mentioned
    - "recently changed jobs" → true
    - "recently changed job" → true
    - "new job" → true
    - "recently hired" → true
    - "just changed jobs" → true
    - "recently switched jobs" → true

19. POSTED_ON_LINKEDIN: Extract if explicitly mentioned
    - "posted on LinkedIn" → true
    - "active on LinkedIn" → true
    - "LinkedIn posts" → true

20. IN_THE_NEWS: Extract if explicitly mentioned
    - "in the news" → true
    - "mentioned in news" → true
    - "news coverage" → true

EXAMPLE:
Query: "Find senior directors at Google who recently changed jobs"
Response: {
  "CURRENT_TITLE": ["Director"],
  "CURRENT_COMPANY": ["Google"],
  "YEARS_OF_EXPERIENCE": [],
  "INDUSTRY": [],
  "TAGS": [],
  "REGION": [],
  "COMPANY_HEADCOUNT": [],
  "COMPANY_HEADCOUNT_GROWTH": null,
  "ANNUAL_REVENUE": null,
  "DEPARTMENT_HEADCOUNT": null,
  "DEPARTMENT_HEADCOUNT_GROWTH": null,
  "ACCOUNT_ACTIVITIES": [],
  "JOB_OPPORTUNITIES": [],
  "KEYWORD": [],
  "YEARS_AT_CURRENT_COMPANY": [],
  "YEARS_IN_CURRENT_POSITION": [],
  "SENIORITY_LEVEL": ["Senior"],
  "RECENTLY_CHANGED_JOBS": true,
  "POSTED_ON_LINKEDIN": false,
  "IN_THE_NEWS": false
}

Query: "Find companies with engineering department headcount between 50 and 200"
Response: {
  "CURRENT_TITLE": [],
  "CURRENT_COMPANY": [],
  "YEARS_OF_EXPERIENCE": [],
  "INDUSTRY": [],
  "TAGS": [],
  "REGION": [],
  "COMPANY_HEADCOUNT": [],
  "COMPANY_HEADCOUNT_GROWTH": null,
  "ANNUAL_REVENUE": null,
  "DEPARTMENT_HEADCOUNT": {"min": 50, "max": 200, "sub_filter": "Engineering"},
  "DEPARTMENT_HEADCOUNT_GROWTH": null,
  "ACCOUNT_ACTIVITIES": [],
  "JOB_OPPORTUNITIES": [],
  "KEYWORD": [],
  "YEARS_AT_CURRENT_COMPANY": [],
  "YEARS_IN_CURRENT_POSITION": [],
  "SENIORITY_LEVEL": [],
  "RECENTLY_CHANGED_JOBS": false,
  "POSTED_ON_LINKEDIN": false,
  "IN_THE_NEWS": false
}

Query: "Find fintech companies in New York with revenue between $10M and $100M"
Response: {
  "CURRENT_TITLE": [],
  "CURRENT_COMPANY": [],
  "YEARS_OF_EXPERIENCE": [],
  "INDUSTRY": ["Financial Services"],
  "TAGS": [],
  "REGION": ["New York City Metropolitan Area"],
  "COMPANY_HEADCOUNT": [],
  "COMPANY_HEADCOUNT_GROWTH": null,
  "ANNUAL_REVENUE": {"min": 10, "max": 100},
  "DEPARTMENT_HEADCOUNT": null,
  "DEPARTMENT_HEADCOUNT_GROWTH": null,
  "ACCOUNT_ACTIVITIES": [],
  "JOB_OPPORTUNITIES": [],
  "KEYWORD": [],
  "YEARS_AT_CURRENT_COMPANY": [],
  "YEARS_IN_CURRENT_POSITION": [],
  "SENIORITY_LEVEL": [],
  "RECENTLY_CHANGED_JOBS": false,
  "POSTED_ON_LINKEDIN": false,
  "IN_THE_NEWS": false
}

Each filter should be an array even if there's only one value.`;

    // User prompt with the query
    const userPrompt = `Query: ${query}\n\nConvert this to structured filters.`;

    // Call OpenAI API
    const openaiResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${config.openaiApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Extract the response content
    const content = openaiResponse.data.choices[0].message.content;

    // Log the raw AI response for debugging
    console.log("Raw AI response:", content);

    // Parse the response as JSON
    let parsedFilters;
    try {
      parsedFilters = JSON.parse(content);
      console.log("Parsed filters from AI:", parsedFilters);
      console.log("RECENTLY_CHANGED_JOBS from AI:", parsedFilters.RECENTLY_CHANGED_JOBS);
      console.log("POSTED_ON_LINKEDIN from AI:", parsedFilters.POSTED_ON_LINKEDIN);
      console.log("IN_THE_NEWS from AI:", parsedFilters.IN_THE_NEWS);
    } catch (error) {
      console.error("Failed to parse OpenAI response as JSON:", content);
      return res.status(500).json({
        error: "Failed to parse response",
        rawResponse: content,
      });
    }

    // Match industries with fuzzy matching from industry_data.js
    const matchedIndustries = [];
    if (parsedFilters.INDUSTRY && Array.isArray(parsedFilters.INDUSTRY)) {
      parsedFilters.INDUSTRY.forEach(industry => {
        // First try exact match
        const exactMatch = industryData.find(
          ind => ind.toLowerCase() === industry.toLowerCase()
        );
        
        if (exactMatch) {
          // Prefer exact matches if available
          matchedIndustries.push(exactMatch);
        } else {
          // Try synonym mapping + fuzzy match if no exact match
          const matchedIndustry = matchWithSynonyms(industry, industryData, 0.4);
          if (matchedIndustry) {
            matchedIndustries.push(matchedIndustry);
            console.log(`Fuzzy matched industry: "${industry}" → "${matchedIndustry}"`);
          } else {
            console.log(`No match found for industry: "${industry}"`);
          }
        }
      });
    }

    // Match regions with fuzzy matching from region_data.js
    const matchedRegions = [];
    const regionIds = [];
    if (parsedFilters.REGION && Array.isArray(parsedFilters.REGION)) {
      parsedFilters.REGION.forEach(region => {
        let matchFound = false;
        
        // First, try to find exact matches in region_data
        for (let i = 0; i < region_data.length && !matchFound; i++) {
          const regionObject = region_data[i];
          const regionNames = Object.keys(regionObject);
          
          // Try exact match first
          const exactMatchName = regionNames.find(name => 
            name.toLowerCase() === region.toLowerCase()
          );
          
          if (exactMatchName) {
            // Exact match found
            if (!matchedRegions.includes(exactMatchName)) {
              matchedRegions.push(exactMatchName);
              regionIds.push(regionObject[exactMatchName].id);
              matchFound = true;
              console.log(`Exact matched region: "${region}" → "${exactMatchName}"`);
            }
          }
        }
        
        // If no exact match, try fuzzy matching
        if (!matchFound) {
          for (let i = 0; i < region_data.length && !matchFound; i++) {
            const regionObject = region_data[i];
            const regionNames = Object.keys(regionObject);
            
            // Try synonym + fuzzy matching with a more conservative threshold for regions
            const matchedRegionName = matchWithSynonyms(region, regionNames, 0.3);
            
            if (matchedRegionName && !matchedRegions.includes(matchedRegionName)) {
              matchedRegions.push(matchedRegionName);
              regionIds.push(regionObject[matchedRegionName].id);
              matchFound = true;
              console.log(`Fuzzy matched region: "${region}" → "${matchedRegionName}"`);
            }
          }
          
          if (!matchFound) {
            console.log(`No match found for region: "${region}"`);
          }
        }
      });
    }

    // Helper function to clean company names (remove domains)
    const cleanCompanyNames = (companies) => {
      if (!companies || !Array.isArray(companies)) return [];
      return companies.map(company => {
        // Remove common domain extensions
        return company.replace(/\.(com|org|net|edu|gov|mil|int|io|ai|co|uk|de|fr|jp|cn|in|br|au|ca|mx|es|it|nl|se|no|dk|fi|pl|ru|kr|sg|hk|tw|th|vn|my|id|ph|tr|ae|sa|il|za|ng|ke|gh|ug|tz|mw|zm|bw|na|sz|ls|st|ao|mz|zw|bw|na|sz|ls|st|ao|mz|zw)$/i, '');
      });
    };

    // Create the filtered response
    const filteredResponse = {
      CURRENT_TITLE: parsedFilters.CURRENT_TITLE || [],
      CURRENT_COMPANY: cleanCompanyNames(parsedFilters.CURRENT_COMPANY),
      YEARS_OF_EXPERIENCE: parsedFilters.YEARS_OF_EXPERIENCE || [],
      INDUSTRY: matchedIndustries,
      TAGS: parsedFilters.TAGS || [],
      REGION: matchedRegions,
      REGION_IDS: regionIds,
      COMPANY_HEADCOUNT: parsedFilters.COMPANY_HEADCOUNT || [],
      COMPANY_HEADCOUNT_GROWTH: parsedFilters.COMPANY_HEADCOUNT_GROWTH || null,
      ANNUAL_REVENUE: parsedFilters.ANNUAL_REVENUE || null,
      DEPARTMENT_HEADCOUNT: parsedFilters.DEPARTMENT_HEADCOUNT || null,
      DEPARTMENT_HEADCOUNT_GROWTH: parsedFilters.DEPARTMENT_HEADCOUNT_GROWTH || null,
      ACCOUNT_ACTIVITIES: parsedFilters.ACCOUNT_ACTIVITIES || [],
      JOB_OPPORTUNITIES: parsedFilters.JOB_OPPORTUNITIES || [],
      KEYWORD: parsedFilters.KEYWORD || [],
      YEARS_AT_CURRENT_COMPANY: parsedFilters.YEARS_AT_CURRENT_COMPANY || [],
      YEARS_IN_CURRENT_POSITION: parsedFilters.YEARS_IN_CURRENT_POSITION || [],
      SENIORITY_LEVEL: parsedFilters.SENIORITY_LEVEL || [],
      RECENTLY_CHANGED_JOBS: parsedFilters.RECENTLY_CHANGED_JOBS,
      POSTED_ON_LINKEDIN: parsedFilters.POSTED_ON_LINKEDIN,
      IN_THE_NEWS: parsedFilters.IN_THE_NEWS
    };

    // Validation: Check for over-inferred filters
    const queryLower = query.toLowerCase();
    const warnings = [];

    // Helper function to check if industry was mentioned (including synonyms)
    const checkIndustryMention = (industry, query) => {
      // Direct match
      if (query.includes(industry.toLowerCase().replace(/[^a-z]/g, ' '))) {
        return true;
      }
      
      // Check for common synonyms
      const industrySynonyms = {
        'financial services': ['fintech', 'banking', 'finance', 'financial'],
        'artificial intelligence': ['ai', 'machine learning', 'ml'],
        'software development': ['saas', 'software', 'tech', 'technology'],
        'healthcare': ['health', 'medical', 'pharma'],
        'manufacturing': ['manufacturing', 'industrial', 'production']
      };
      
      const industryLower = industry.toLowerCase();
      const synonyms = industrySynonyms[industryLower] || [];
      
      return synonyms.some(synonym => query.includes(synonym));
    };

    // Check if industry was inferred without explicit mention
    if (filteredResponse.INDUSTRY.length > 0) {
      const hasExplicitIndustry = filteredResponse.INDUSTRY.some(industry => 
        checkIndustryMention(industry, queryLower)
      );
      if (!hasExplicitIndustry) {
        console.warn('Industry was inferred but not explicitly mentioned:', filteredResponse.INDUSTRY);
        warnings.push('Industry was inferred but not explicitly mentioned');
      }
    }

    // Check if region was inferred without explicit mention
    if (filteredResponse.REGION.length > 0) {
      const hasExplicitRegion = filteredResponse.REGION.some(region => 
        queryLower.includes(region.toLowerCase().replace(/[^a-z]/g, ' '))
      );
      if (!hasExplicitRegion) {
        console.warn('Region was inferred but not explicitly mentioned:', filteredResponse.REGION);
        warnings.push('Region was inferred but not explicitly mentioned');
      }
    }

    // Check if company headcount was inferred without explicit mention
    if (filteredResponse.COMPANY_HEADCOUNT.length > 0) {
      const hasExplicitHeadcount = filteredResponse.COMPANY_HEADCOUNT.some(headcount => 
        queryLower.includes(headcount.toLowerCase())
      );
      if (!hasExplicitHeadcount) {
        console.warn('Company headcount was inferred but not explicitly mentioned:', filteredResponse.COMPANY_HEADCOUNT);
        warnings.push('Company headcount was inferred but not explicitly mentioned');
      }
    }

    // Log warnings if any
    if (warnings.length > 0) {
      console.warn('Query parsing warnings:', warnings);
      console.warn('Original query:', query);
    }

    console.log("Parsed filters from AI:", JSON.stringify(parsedFilters, null, 2));
    console.log("Filtered response:", JSON.stringify(filteredResponse, null, 2));

    // Return the structured filters with matched values
    return res.json(filteredResponse);
  } catch (error) {
    console.error("Error parsing query:", error);

    // Check if it's an OpenAI API error
    if (error.response && error.response.data) {
      return res.status(error.response.status).json({
        error: "Error from OpenAI API",
        details: error.response.data,
      });
    }

    return res.status(500).json({ error: "Server error parsing query" });
  }
});

module.exports = router;
