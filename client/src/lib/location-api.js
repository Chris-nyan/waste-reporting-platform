import axios from 'axios';

// The base URL for the free location API
const API_URL = 'https://countriesnow.space/api/v0.1/countries';

/**
 * Fetches a list of all countries.
 * @returns {Promise<Array<string>>} A list of country names.
 */
export const fetchCountries = async () => {
  try {
    const response = await axios.get(`${API_URL}/positions`);
    // The API returns a list of objects, we just need the 'name' property
    return response.data.data.map(country => country.name).sort();
  } catch (error) {
    console.error("Error fetching countries:", error);
    return []; // Return an empty array on error
  }
};

/**
 * Fetches a list of states/provinces for a given country.
 * @param {string} country - The name of the country.
 * @returns {Promise<Array<string>>} A list of state names.
 */
export const fetchStates = async (country) => {
  if (!country) return [];
  try {
    const response = await axios.post(`${API_URL}/states`, { country });
    return response.data.data.states.map(state => state.name).sort();
  } catch (error) {
    console.error(`Error fetching states for ${country}:`, error);
    return [];
  }
};

/**
 * Fetches a list of cities/districts for a given country and state.
 * @param {string} country - The name of the country.
 * @param {string} state - The name of the state/province.
 * @returns {Promise<Array<string>>} A list of city names.
 */
export const fetchCities = async (country, state) => {
  if (!country || !state) return [];
  try {
    const response = await axios.post(`${API_URL}/state/cities`, { country, state });
    return response.data.data.sort();
  } catch (error) {
    console.error(`Error fetching cities for ${state}, ${country}:`, error);
    return [];
  }
};
