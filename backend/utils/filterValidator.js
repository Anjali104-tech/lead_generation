/**
 * Utility functions for validating industry and region filters
 * Used by the query parser to ensure filters match expected values
 */

/**
 * Validates that industry names match known industries
 * @param {Array<string>} industries - Array of industry names to validate
 * @param {Array<string>} validIndustries - Array of valid industry names
 * @return {Array<string>} - Array of valid industries
 */
function validateIndustries(industries, validIndustries) {
  if (!industries || !Array.isArray(industries) || industries.length === 0) {
    return [];
  }

  if (!validIndustries || !Array.isArray(validIndustries)) {
    return industries; // Return original if no validation list
  }

  // Case insensitive matching
  const lowerCaseValid = validIndustries.map(i => i.toLowerCase());
  
  return industries.filter(industry => {
    if (!industry) return false;
    return lowerCaseValid.includes(industry.toLowerCase());
  });
}

/**
 * Validates that region names match known regions
 * @param {Array<string>} regions - Array of region names to validate
 * @param {Object} validRegionsMap - Object mapping region names to region data
 * @return {Array<string>} - Array of valid regions
 */
function validateRegions(regions, validRegionsMap) {
  if (!regions || !Array.isArray(regions) || regions.length === 0) {
    return [];
  }

  if (!validRegionsMap || typeof validRegionsMap !== 'object') {
    return regions; // Return original if no validation map
  }

  // Get lowercase keys for case-insensitive matching
  const lowerCaseKeys = {};
  Object.keys(validRegionsMap).forEach(key => {
    lowerCaseKeys[key.toLowerCase()] = key;
  });
  
  return regions.filter(region => {
    if (!region) return false;
    return !!lowerCaseKeys[region.toLowerCase()];
  });
}

module.exports = {
  validateIndustries,
  validateRegions
};
