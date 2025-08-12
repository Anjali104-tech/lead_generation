/**
 * Mapping of common keyword/tag terms to Crustdata's exact keyword values.
 * This helps ensure the API search works properly by translating NLP parsed
 * values to the exact terms used by Crustdata.
 */
const keywordMapping = {
  // Funding status
  "seed-funded": "seed funding",
  "seed funded": "seed funding",
  "seed": "seed funding",
  "series a": "series a funding",
  "series b": "series b funding",
  "series c": "series c funding",
  "bootstrap": "bootstrapped",
  "bootstrapped": "bootstrapped",
  "vc funded": "venture capital",
  "venture funded": "venture capital",
  "venture capital": "venture capital",
  "angel invested": "angel investors",
  "angel funding": "angel investors",
  
  // Company size
  "startup": "startup",
  "small business": "small business",
  "smb": "small business",
  "enterprise": "enterprise",
  "midsize": "midsize company",
  "mid-size": "midsize company",
  "large company": "large company",
  
  // Business focus
  "b2b": "b2b",
  "b2c": "b2c",
  "d2c": "direct to consumer",
  "direct to consumer": "direct to consumer",
  "marketplace": "marketplace",
  "platform": "platform",
  
  // Technology
  "cloud-based": "cloud technology",
  "cloud based": "cloud technology",
  "saas": "saas",
  "mobile-first": "mobile first",
  "ai-powered": "artificial intelligence",
  "ai driven": "artificial intelligence",
  "data-driven": "data driven",
  
  // Growth & Status
  "high-growth": "high growth",
  "fast-growing": "high growth",
  "growing": "growth stage",
  "profitable": "profitable",
  "unicorn": "unicorn",
  "ipo": "ipo",
  "public company": "public company",
  "private company": "private company",
  
  // Industry-specific tags
  "fintech": "financial technology",
  "healthtech": "health technology",
  "medtech": "medical technology",
  "edtech": "education technology",
  "proptech": "property technology",
  "insurtech": "insurance technology",
  "cleantech": "clean technology"
};

/**
 * Maps a given keyword/tag to the Crustdata equivalent
 * @param {string} keyword - The keyword/tag to map
 * @return {string} - The mapped keyword or the original if no mapping exists
 */
function mapKeyword(keyword) {
  if (!keyword) return null;
  
  const term = keyword.toLowerCase().trim();
  return keywordMapping[term] || keyword;
}

/**
 * Maps an array of keywords/tags to their Crustdata equivalents
 * @param {Array<string>} keywords - Array of keywords/tags
 * @return {Array<string>} - Array of mapped keywords
 */
function mapKeywords(keywords) {
  if (!keywords || !Array.isArray(keywords)) return [];
  
  return keywords.map(keyword => mapKeyword(keyword));
}

module.exports = {
  keywordMapping,
  mapKeyword,
  mapKeywords
};