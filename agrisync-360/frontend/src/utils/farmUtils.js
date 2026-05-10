/**
 * Utility functions for farm-related operations
 */

import { farmersAPI } from '../api/farmers';

/**
 * Check if user has a farmer profile
 * @returns {Promise<boolean>} True if farmer profile exists
 */
export const hasFarmerProfile = async () => {
  try {
    const response = await farmersAPI.getFarms();
    return true; // If no error, profile exists
  } catch (error) {
    if (error?.status === 404) {
      return false; // No farmer profile
    }
    throw error; // Other error
  }
};

/**
 * Get user's farms with error handling
 * @returns {Promise<Array>} Array of farms or empty array if no profile
 */
export const getUserFarms = async () => {
  try {
    const response = await farmersAPI.getFarms();
    return response.data?.data || [];
  } catch (error) {
    if (error?.status === 404) {
      return []; // No farmer profile
    }
    throw error; // Other error
  }
};

/**
 * Check if user has any farms
 * @returns {Promise<boolean>} True if user has at least one farm
 */
export const hasAnyFarms = async () => {
  const farms = await getUserFarms();
  return farms.length > 0;
};
