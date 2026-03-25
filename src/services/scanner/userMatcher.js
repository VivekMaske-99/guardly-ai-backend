/**
 * User Matcher Module
 * Matches detected entities against the logged-in user's profile
 * Implements fuzzy matching and partial match logic
 */

class UserMatcher {
  /**
   * Match entities against user profile
   * @param {Object} entities - Detected entities from EntityDetector
   * @param {Object} userProfile - User's verified profile data
   * @param {string} pageText - Full text of the document for context extraction
   * @returns {Object} Matching results with matched data and snippets
   */
  static matchEntities(entities, userProfile, pageText) {
    if (!entities || !userProfile) {
      return {
        matchedData: {
          name: false,
          email: false,
          phone: false,
          location: false,
        },
        snippets: [],
      };
    }

    const results = {
      matchedData: {
        name: false,
        email: false,
        phone: false,
        location: false,
      },
      snippets: [],
    };

    // Match names
    if (entities.names && entities.names.length > 0) {
      const nameMatches = this._matchNames(
        entities.names,
        userProfile.fullName,
        pageText,
      );
      if (nameMatches.matched) {
        results.matchedData.name = true;
        results.snippets.push(...nameMatches.snippets);
      }
    }

    // Match emails
    if (entities.emails && entities.emails.length > 0) {
      const emailMatches = this._matchEmails(
        entities.emails,
        userProfile.email,
        pageText,
      );
      if (emailMatches.matched) {
        results.matchedData.email = true;
        results.snippets.push(...emailMatches.snippets);
      }
    }

    // Match phones
    if (entities.phones && entities.phones.length > 0) {
      const phoneMatches = this._matchPhones(
        entities.phones,
        userProfile.phone,
        pageText,
      );
      if (phoneMatches.matched) {
        results.matchedData.phone = true;
        results.snippets.push(...phoneMatches.snippets);
      }
    }

    // Match locations
    if (entities.locations && entities.locations.length > 0) {
      const locationMatches = this._matchLocations(
        entities.locations,
        userProfile.location,
        pageText,
      );
      if (locationMatches.matched) {
        results.matchedData.location = true;
        results.snippets.push(...locationMatches.snippets);
      }
    }

    return results;
  }

  /**
   * Match names with fuzzy matching
   * @param {Array} detectedNames - Names found in document
   * @param {string} userFullName - User's full name
   * @param {string} pageText - Full text for snippet extraction
   * @returns {Object} { matched: boolean, snippets: Array }
   */
  static _matchNames(detectedNames, userFullName, pageText) {
    if (!userFullName) return { matched: false, snippets: [] };

    const userNameParts = userFullName.toLowerCase().split(/\s+/);
    const snippets = [];

    for (const detectedName of detectedNames) {
      const detectedLower = detectedName.value.toLowerCase();
      const detectedParts = detectedLower.split(/\s+/);

      // Exact match
      if (detectedLower === userFullName.toLowerCase()) {
        snippets.push(
          this._extractSnippet(pageText, detectedName.value, "name"),
        );
        continue;
      }

      // Partial match: check if detected name contains user's first or last name
      const firstNameMatch = userNameParts[0]
        ? detectedLower.includes(userNameParts[0])
        : false;
      const lastNameMatch =
        userNameParts.length > 1 && userNameParts[userNameParts.length - 1]
          ? detectedLower.includes(userNameParts[userNameParts.length - 1])
          : false;

      // Initials match (e.g., "T. P." for "Tanashvi Pujari")
      const initialsMatch = this._matchInitials(
        detectedName.value,
        userFullName,
      );

      if (firstNameMatch || lastNameMatch || initialsMatch) {
        snippets.push(
          this._extractSnippet(pageText, detectedName.value, "name"),
        );
      }
    }

    return {
      matched: snippets.length > 0,
      snippets,
    };
  }

  /**
   * Match emails
   * @param {Array} detectedEmails - Emails found in document
   * @param {string} userEmail - User's email
   * @param {string} pageText - Full text for snippet extraction
   * @returns {Object} { matched: boolean, snippets: Array }
   */
  static _matchEmails(detectedEmails, userEmail, pageText) {
    if (!userEmail) return { matched: false, snippets: [] };

    const userEmailLower = userEmail.toLowerCase();
    const snippets = [];

    for (const detectedEmail of detectedEmails) {
      const detectedLower = detectedEmail.value.toLowerCase();

      // Exact match
      if (detectedLower === userEmailLower) {
        snippets.push(
          this._extractSnippet(pageText, detectedEmail.value, "email"),
        );
      }
    }

    return {
      matched: snippets.length > 0,
      snippets,
    };
  }

  /**
   * Match phone numbers
   * @param {Array} detectedPhones - Phones found in document
   * @param {string} userPhone - User's phone
   * @param {string} pageText - Full text for snippet extraction
   * @returns {Object} { matched: boolean, snippets: Array }
   */
  static _matchPhones(detectedPhones, userPhone, pageText) {
    if (!userPhone) return { matched: false, snippets: [] };

    const userPhoneDigits = userPhone.replace(/\D/g, "");
    const snippets = [];

    for (const detectedPhone of detectedPhones) {
      const detectedDigits = detectedPhone.value.replace(/\D/g, "");

      // Exact numeric match
      if (detectedDigits === userPhoneDigits) {
        snippets.push(
          this._extractSnippet(pageText, detectedPhone.originalValue, "phone"),
        );
      }

      // Partial match (last 10 digits for masked phones)
      if (detectedDigits.length >= 10 && userPhoneDigits.length >= 10) {
        const lastTenDetected = detectedDigits.slice(-10);
        const lastTenUser = userPhoneDigits.slice(-10);

        if (lastTenDetected === lastTenUser) {
          snippets.push(
            this._extractSnippet(
              pageText,
              detectedPhone.originalValue,
              "phone",
            ),
          );
        }
      }
    }

    return {
      matched: snippets.length > 0,
      snippets,
    };
  }

  /**
   * Match locations (city or state level)
   * @param {Array} detectedLocations - Locations found in document
   * @param {string} userLocation - User's location
   * @param {string} pageText - Full text for snippet extraction
   * @returns {Object} { matched: boolean, snippets: Array }
   */
  static _matchLocations(detectedLocations, userLocation, pageText) {
    if (!userLocation) return { matched: false, snippets: [] };

    const userLocationParts = userLocation.toLowerCase().split(/,\s*/);
    const snippets = [];

    for (const detectedLocation of detectedLocations) {
      const detectedLower = detectedLocation.value.toLowerCase();

      // Check if detected location matches any part of user's location
      for (const part of userLocationParts) {
        const cleanPart = part.trim();
        if (
          cleanPart.length > 0 &&
          detectedLower.includes(cleanPart) &&
          cleanPart === detectedLower
        ) {
          snippets.push(
            this._extractSnippet(pageText, detectedLocation.value, "location"),
          );
          break;
        }
      }
    }

    return {
      matched: snippets.length > 0,
      snippets,
    };
  }

  /**
   * Check if initials match (e.g., "T. P." matches "Tanashvi Pujari")
   * @param {string} detected - Detected text that might be initials
   * @param {string} userFullName - User's full name
   * @returns {boolean}
   */
  static _matchInitials(detected, userFullName) {
    const parts = userFullName.split(/\s+/);
    if (parts.length < 2) return false;

    const initials = parts.map((p) => p.charAt(0)).join(". ") + ".";
    const initialsAlt = parts.map((p) => p.charAt(0)).join(".");

    const detectedClean = detected.replace(/[.\s]/g, "");
    const initialsClean = initials.replace(/[.\s]/g, "");

    return (
      detectedClean.toLowerCase() === initialsClean.toLowerCase() ||
      detected.toLowerCase() === initials.toLowerCase() ||
      detected.toLowerCase() === initialsAlt.toLowerCase()
    );
  }

  /**
   * Extract text snippet around matched entity
   * @param {string} pageText - Full page text
   * @param {string} matchedText - The matched text
   * @param {string} type - Type of entity (name, email, phone, location)
   * @returns {Object} { type, matchedText, snippet, context }
   */
  static _extractSnippet(pageText, matchedText, type) {
    const index = pageText.toLowerCase().indexOf(matchedText.toLowerCase());

    if (index === -1) {
      return {
        type,
        matchedText,
        snippet: matchedText,
        context: "",
      };
    }

    // Extract 100 characters before and after for context
    const contextBefore = Math.max(0, index - 100);
    const contextAfter = Math.min(
      pageText.length,
      index + matchedText.length + 100,
    );

    const snippet = pageText.substring(contextBefore, contextAfter).trim();

    return {
      type,
      matchedText,
      snippet,
      context: `...${snippet}...`,
    };
  }
}

module.exports = UserMatcher;
