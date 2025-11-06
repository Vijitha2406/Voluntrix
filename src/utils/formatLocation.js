// Utility functions for formatting event data

/**
 * Formats a location object into a readable string
 * @param {Object} location - Location object with address, city, state, country, venue, isRemote properties
 * @returns {string} - Formatted location string
 */
export const formatLocation = (location) => {
  if (!location) return 'Location TBD';
  
  // Handle string locations (backward compatibility)
  if (typeof location === 'string') {
    return location;
  }
  
  // Handle remote events
  if (location.isRemote) {
    return 'Remote/Online Event';
  }
  
  // Build location string from object properties
  const parts = [];
  
  if (location.venue) {
    parts.push(location.venue);
  }
  
  if (location.address) {
    parts.push(location.address);
  }
  
  if (location.city) {
    parts.push(location.city);
  }
  
  if (location.state) {
    parts.push(location.state);
  }
  
  if (location.country && location.country !== 'USA') {
    parts.push(location.country);
  }
  
  return parts.length > 0 ? parts.join(', ') : 'Location TBD';
};

/**
 * Formats a location object into a short string (for compact displays)
 * @param {Object} location - Location object
 * @returns {string} - Short formatted location string
 */
export const formatLocationShort = (location) => {
  if (!location) return 'Location TBD';
  
  // Handle string locations (backward compatibility)
  if (typeof location === 'string') {
    return location;
  }
  
  // Handle remote events
  if (location.isRemote) {
    return 'Remote';
  }
  
  // Build short location string
  if (location.venue) {
    return location.venue;
  }
  
  if (location.city && location.state) {
    return `${location.city}, ${location.state}`;
  }
  
  if (location.city) {
    return location.city;
  }
  
  if (location.address) {
    return location.address;
  }
  
  return 'Location TBD';
};

/**
 * Gets the full address for mapping/navigation purposes
 * @param {Object} location - Location object
 * @returns {string} - Full address string suitable for maps
 */
export const getFullAddress = (location) => {
  if (!location || location.isRemote) return '';
  
  if (typeof location === 'string') {
    return location;
  }
  
  const parts = [];
  
  if (location.address) parts.push(location.address);
  if (location.city) parts.push(location.city);
  if (location.state) parts.push(location.state);
  if (location.country) parts.push(location.country);
  
  return parts.join(', ');
};

/**
 * Determines if an event is remote
 * @param {Object} location - Location object
 * @returns {boolean} - True if the event is remote
 */
export const isRemoteEvent = (location) => {
  if (!location) return false;
  if (typeof location === 'string') return location.toLowerCase().includes('remote') || location.toLowerCase().includes('online');
  return Boolean(location.isRemote);
};