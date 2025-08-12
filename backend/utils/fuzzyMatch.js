const Fuse = require("fuse.js");

/**
 * Finds the best fuzzy match for an input string in a dataset
 *
 * @param {string} input - The string to match
 * @param {Array|Object} dataset - The dataset to search in
 * @param {number} threshold - Lower values require closer matches (0-1)
 * @param {Object} options - Additional Fuse.js options
 * @returns {any|null} - The best matching item or null if no match found
 */
function fuzzyFindMatch(input, dataset, threshold = 0.3, options = {}) {
  if (!input || !dataset) return null;

  // For objects, we need to extract the keys to search through
  const searchData = Array.isArray(dataset) ? dataset : Object.keys(dataset);

  const fuseOptions = {
    includeScore: true,
    threshold,
    ...options,
  };

  const fuse = new Fuse(searchData, fuseOptions);
  const result = fuse.search(input);

  if (result.length && result[0].score <= threshold) {
    return result[0].item;
  }

  return null;
}

/**
 * Common abbreviations and alternate names for regions and industries
 * to improve matching before fuzzy search
 */
const synonymMap = {
  // Region synonyms - be more specific and conservative
  nyc: "New York City Metropolitan Area",
  "new york": "New York City Metropolitan Area",
  "new york city": "New York City Metropolitan Area",
  sf: "San Francisco Bay Area",
  "san francisco": "San Francisco Bay Area",
  "silicon valley": "San Francisco Bay Area",
  la: "Greater Los Angeles Area",
  "los angeles": "Greater Los Angeles Area",
  bangalore: "Bengaluru Area, India",
  bombay: "Mumbai Area, India",
  boston: "Greater Boston",
  "greater boston": "Greater Boston",
  "mountain view": "Mountain View Metropolitan Area",
  "palo alto": "Palo Alto Metropolitan Area",
  "seattle": "Seattle Metropolitan Area",
  "austin": "Austin Metropolitan Area",

  // Industry synonyms
  fintech: "Financial Services",
  ai: "Artificial Intelligence",
  "artificial intelligence": "Artificial Intelligence",
  ml: "Machine Learning",
  "machine learning": "Machine Learning",
  saas: "Software Development",
  "software as a service": "Software Development",
  sw: "Software Development",
  "sw dev": "Software Development",
  tech: "Technology, Information and Internet",
  "technology": "Technology, Information and Internet",
};

/**
 * Attempts to match input with synonyms before trying fuzzy matching
 */
function matchWithSynonyms(input, dataset, threshold = 0.3) {
  if (!input) return null;

  const lowerInput = input.toLowerCase();

  // Check for direct synonym first
  if (synonymMap[lowerInput]) {
    // If there's a direct synonym, check if it exists in the dataset
    const synonym = synonymMap[lowerInput];

    if (Array.isArray(dataset)) {
      const exactMatch = dataset.find(
        (item) =>
          typeof item === "string" &&
          item.toLowerCase() === synonym.toLowerCase()
      );
      if (exactMatch) return exactMatch;
    } else if (dataset[synonym]) {
      return synonym;
    }
  }

  // If no synonym match, try fuzzy matching
  return fuzzyFindMatch(input, dataset, threshold);
}

module.exports = {
  fuzzyFindMatch,
  matchWithSynonyms,
};
