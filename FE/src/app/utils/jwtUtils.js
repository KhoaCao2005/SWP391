/**
 * Utility functions for working with JWT tokens in the frontend
 */

/**
 * Decode JWT token and extract the payload
 * Note: This only decodes the token, it does not verify the signature.
 * Signature verification is done on the backend.
 * @param {string} token - JWT token
 * @returns {Object|null} - Decoded payload or null if invalid
 */
export const decodeJWT = (token) => {
  if (!token) {
    return null;
  }

  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT token format');
      return null;
    }

    // Decode the payload (second part)
    // Base64URL decoding (JWT uses base64url, not standard base64)
    const payload = parts[1];
    
    // Convert base64url to base64
    let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    
    // Decode base64 to string
    const jsonPayload = atob(base64);
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};

/**
 * Extract user ID from JWT token
 * @param {string} token - JWT token (can be obtained from localStorage.getItem('token'))
 * @returns {number|null} - User ID or null if not found
 */
export const extractUserIdFromToken = (token) => {
  const payload = decodeJWT(token);
  if (!payload) {
    return null;
  }

  // Backend stores userId in the 'userId' claim
  const userId = payload.userId;
  
  if (userId === undefined || userId === null) {
    console.warn('JWT token does not contain userId claim');
    return null;
  }

  // Convert to number if it's a string
  const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
  
  if (isNaN(userIdNum)) {
    console.warn('Invalid userId in JWT token:', userId);
    return null;
  }

  return userIdNum;
};

/**
 * Get user ID from the stored JWT token in localStorage
 * @returns {number|null} - User ID or null if not found
 */
export const getUserIdFromStoredToken = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('No token found in localStorage');
    return null;
  }

  return extractUserIdFromToken(token);
};

