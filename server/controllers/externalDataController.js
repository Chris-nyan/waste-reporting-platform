const axios = require('axios');

let co2Cache = {
    data: null,
    timestamp: 0,
};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const getCO2ByCountry = async (req, res) => {
    const now = Date.now();

    // 1. Check cache
    if (co2Cache.data && (now - co2Cache.timestamp < CACHE_DURATION)) {
        return res.json(co2Cache.data);
    }

    try {
        // --- THIS IS THE MODIFIED URL ---
        // We've changed the date from 2020 to 2019, as 2020 data may be archived.
        const response = await axios.get(
            'http://api.worldbank.org/v2/country/all/indicator/EN.ATM.CO2E.KT?format=json&per_page=300&date=2019'
        );
        // --- END MODIFICATION ---

        // 2. Check for valid data
        if (!response.data || !Array.isArray(response.data) || response.data.length < 2 || !response.data[1]) {
            console.error("World Bank API returned an unexpected data format. Full response:");
            console.error(JSON.stringify(response.data, null, 2)); 
            return res.json([]); // Return empty array so frontend doesn't crash
        }

        // 3. Format the data (this part is safe now)
        const rawData = response.data[1];

        const formattedData = rawData
            .filter(item => item.value !== null && item.country.value.includes('aggregate') === false)
            .map(item => ({
                name: item.country.value,
                value: parseFloat(item.value.toFixed(2))
            }))
            .sort((a, b) => b.value - a.value); // Sort descending

        // 4. Update the cache
        co2Cache = {
            data: formattedData,
            timestamp: now,
        };

        res.json(formattedData);

    } catch (error) {
        console.error("Error in getCO2ByCountry:", error.message);
        if (error.response) {
            console.error("API Response Data:", error.response.data);
            console.error("API Response Status:", error.response.status);
        }
        res.status(500).json({ message: 'Failed to fetch external CO2 data' });
    }
};

module.exports = {
    getCO2ByCountry,
};