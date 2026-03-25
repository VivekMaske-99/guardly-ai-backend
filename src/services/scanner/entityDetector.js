/**
 * Entity Detector Module
 * Detects sensitive data patterns in extracted text
 * Uses regex patterns and keyword matching for NLP-based detection
 */

class EntityDetector {
  /**
   * Detect all entities in text
   * @param {string} text - Document text to analyze
   * @returns {Object} Detected entities with their positions
   */
  static detectEntities(text) {
    if (!text) return {};
    return {
      names: this._detectNames(text),
      emails: this._detectEmails(text),
      phones: this._detectPhones(text),
      locations: this._detectLocations(text),
    };
  }

  /**
   * Detect email addresses
   * @param {string} text - Text to search
   * @returns {Array} Array of {value, positions: []}
   */
  static _detectEmails(text) {
    const emailRegex = /([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
    const emails = [];
    let match;

    while ((match = emailRegex.exec(text)) !== null) {
      emails.push({
        value: match[0].toLowerCase(),
        position: match.index,
      });
    }

    return emails;
  }

  /**
   * Detect phone numbers (multiple formats)
   * @param {string} text - Text to search
   * @returns {Array} Array of {value, positions: []}
   */
  static _detectPhones(text) {
    const phonePatterns = [
      /\+?91[\s]?[6-9]\d{9}/gi, // India format
      /\+?1[\s]?\(?[0-9]{3}\)?[\s]?[0-9]{3}[-\s]?[0-9]{4}/gi, // US/Canada
      /\+?[1-9]\d{1,14}/gi, // E.164 international format
      /\(?[0-9]{3}\)?[\s]?[0-9]{3}[-\s]?[0-9]{4}/gi, // US local
    ];

    const phones = [];
    phonePatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const cleanedPhone = match[0].replace(/[\s\-()]/g, "");
        phones.push({
          value: cleanedPhone,
          originalValue: match[0],
          position: match.index,
        });
      }
    });

    // Remove duplicates
    return this._deduplicateByValue(phones);
  }

  /**
   * Detect names (basic NLP approach)
   * @param {string} text - Text to search
   * @returns {Array} Array of {value, positions: []}
   */
  static _detectNames(text) {
    // Pattern: Capitalized word followed by capitalized word (e.g., "John Smith")
    const nameRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]*)*)\b/g;
    const names = [];
    let match;

    // Exclude common non-name capitalized words
    const excludeWords = [
      "the",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "by",
      "from",
      "with",
      "as",
      "is",
      "was",
      "are",
      "been",
      "be",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "should",
      "could",
      "may",
      "might",
      "must",
      "can",
      "email",
      "phone",
      "document",
      "page",
      "report",
      "confidential",
      "private",
      "subject",
      "date",
      "re",
      "fax",
      "tel",
      "mob",
      "cell",
      "name",
      "address",
      "city",
      "state",
      "country",
      "zip",
      "postal",
      "code",
    ];

    while ((match = nameRegex.exec(text)) !== null) {
      const name = match[0];

      // Filter out excluded words and single characters
      if (
        !excludeWords.includes(name.toLowerCase()) &&
        name.length > 1 &&
        !/^\d+$/.test(name)
      ) {
        names.push({
          value: name,
          position: match.index,
        });
      }
    }

    return this._deduplicateByValue(names);
  }

  /**
   * Detect locations (cities, states)
   * @param {string} text - Text to search
   * @returns {Array} Array of {value, positions: []}
   */
  static _detectLocations(text) {
    // Common Indian cities and states
    const indianLocations = [
      "mumbai",
      "delhi",
      "bangalore",
      "hyderabad",
      "pune",
      "kolkata",
      "ahmedabad",
      "jaipur",
      "lucknow",
      "chandigarh",
      "goa",
      "kerala",
      "maharashtra",
      "karnataka",
      "tamil nadu",
      "telangana",
      "gujarati",
      "rajasthan",
      "uttar pradesh",
      "west bengal",
      "haryana",
      "andhra pradesh",
      "jammu",
      "kashmir",
    ];

    // US States
    const usStates = [
      "alabama",
      "alaska",
      "arizona",
      "arkansas",
      "california",
      "colorado",
      "connecticut",
      "delaware",
      "florida",
      "georgia",
      "hawaii",
      "idaho",
      "illinois",
      "indiana",
      "iowa",
      "kansas",
      "kentucky",
      "louisiana",
      "maine",
      "maryland",
      "massachusetts",
      "michigan",
      "minnesota",
      "mississippi",
      "missouri",
      "montana",
      "nebraska",
      "nevada",
      "hampshire",
      "jersey",
      "mexico",
      "york",
      "carolina",
      "dakota",
      "ohio",
      "oklahoma",
      "oregon",
      "pennsylvania",
      "island",
      "tennessee",
      "texas",
      "utah",
      "vermont",
      "virginia",
      "washington",
      "wisconsin",
      "wyoming",
    ];

    const allLocations = [...indianLocations, ...usStates];
    const locations = [];

    allLocations.forEach((location) => {
      const regex = new RegExp(`\\b${location}\\b`, "gi");
      let match;

      while ((match = regex.exec(text)) !== null) {
        locations.push({
          value: match[0],
          position: match.index,
        });
      }
    });

    return this._deduplicateByValue(locations);
  }

  /**
   * Remove duplicate entries based on value
   * @param {Array} items - Items to deduplicate
   * @returns {Array} Deduplicated items
   */
  static _deduplicateByValue(items) {
    const seen = new Set();
    const unique = [];

    items.forEach((item) => {
      const key = item.value.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    });

    return unique;
  }
}

module.exports = EntityDetector;
