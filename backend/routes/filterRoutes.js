const express = require('express');
const router = express.Router();
const { industry_data } = require('../industry_data');

// Get all filter data
router.get('/filter-data', (req, res) => {
  try {
    // Use hardcoded regions instead of region_data
    const regions = [
      'United States', 'Canada', 'United Kingdom', 'Germany', 'France',
      'Australia', 'India', 'China', 'Japan', 'Brazil', 'Mexico',
      'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Finland',
      'Switzerland', 'Austria', 'Belgium', 'Italy', 'Spain',
      'Portugal', 'Ireland', 'New Zealand', 'Singapore', 'South Korea',
      'Israel', 'United Arab Emirates', 'Saudi Arabia', 'South Africa'
    ];
    
    // Get industries from industry_data
    const industries = Array.isArray(industry_data) ? industry_data.sort() : [
      'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail',
      'Education', 'Real Estate', 'Consulting', 'Media', 'Transportation',
      'Energy', 'Telecommunications', 'Biotechnology', 'Pharmaceuticals'
    ];
    
    // Define other filter options
    const jobTitles = [
      'CEO', 'CTO', 'CFO', 'COO', 'VP Engineering', 'VP Sales', 'VP Marketing',
      'Director of Product', 'Senior Manager', 'Manager', 'Lead Developer',
      'Software Engineer', 'Data Scientist', 'Product Manager', 'Sales Manager',
      'VP Operations', 'VP Technology', 'VP Business Development', 'VP Human Resources',
      'Chief Marketing Officer', 'Chief Technology Officer', 'Chief Financial Officer',
      'Chief Operating Officer', 'Chief Executive Officer', 'Chief Information Officer'
    ];

    const companySizes = [
      '1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000',
      '5001-10000', '10001+'
    ];

    const revenueRanges = [
      'Under $1M', '$1M-$10M', '$10M-$50M', '$50M-$100M', '$100M-$500M',
      '$500M-$1B', '$1B-$5B', '$5B+'
    ];

    const seniorityLevels = [
      'Entry Level', 'Junior', 'Mid-Level', 'Senior', 'Lead', 'Manager',
      'Director', 'VP', 'C-Level', 'Executive'
    ];

    const yearsRanges = [
      '0-1 years', '1-3 years', '3-5 years', '5-10 years', '10-15 years',
      '15-20 years', '20+ years'
    ];

    const growthRanges = [
      '0-10%', '10-25%', '25-50%', '50-100%', '100%+'
    ];

    const departments = [
      'Engineering', 'Sales', 'Marketing', 'Finance', 'HR', 'Operations',
      'Product', 'Design', 'Customer Success', 'Legal', 'IT', 'Research & Development'
    ];

    const booleanOptions = [
      { label: 'Yes', value: true },
      { label: 'No', value: false }
    ];

    const filterData = {
      jobTitles,
      industries,
      regions: regions, // Use the hardcoded regions
      companySizes,
      revenueRanges,
      seniorityLevels,
      yearsRanges,
      growthRanges,
      departments,
      booleanOptions
    };

    res.json({
      success: true,
      data: filterData
    });
  } catch (error) {
    console.error('Error fetching filter data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch filter data'
    });
  }
});

module.exports = router;
