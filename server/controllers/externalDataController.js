const axios = require('axios');
const iso3ToNumeric = require('i18n-iso-countries');
iso3ToNumeric.registerLocale(require("i18n-iso-countries/langs/en.json")); // register English locale


let globalCache = {
    data: null,
    timestamp: 0,
};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const fetchWorldBankData = async (indicator, dateRange = "2000:2022") => {
    const url = `https://api.worldbank.org/v2/country/WLD/indicator/${indicator}?format=json&per_page=500&date=${dateRange}`;
    const response = await axios.get(url);

    if (!response.data || !Array.isArray(response.data) || !response.data[1]) {
        console.warn(`⚠️ No data returned for indicator ${indicator}`);
        return [];
    }

    const raw = response.data[1];
    return raw
        .filter(i => i.value !== null)
        .map(i => ({
            year: i.date,
            value: i.value,
        }))
        .sort((a, b) => parseInt(a.year) - parseInt(b.year));
};
const fetchCountryCO2Data = async (year = "2022") => {
    const url = `https://api.worldbank.org/v2/country/all/indicator/EN.ATM.CO2E.PC?format=json&per_page=500&date=${year}`;
    const response = await axios.get(url);
    const raw = response.data[1] || [];

    return raw
        .filter(i => i.value !== null && i.country.id !== "WLD")
        .map(i => {
            // Convert 3-letter ISO code to numeric ISO code (string)
            let numericCode = iso3ToNumeric.alpha3ToNumeric(i.country.id);
            if (!numericCode) numericCode = null;
            return {
                country: i.country.value,
                countryCode: numericCode, // numeric ISO code
                value: i.value,
            };
        })
        .filter(d => d.countryCode !== null);
};


const getGlobalSustainabilityDashboard = async (req, res) => {
    const now = Date.now();
    if (globalCache.data && now - globalCache.timestamp < CACHE_DURATION) {
        return res.json(globalCache.data);
    }

    try {
        console.log("🌍 Fetching World Bank sustainability data...");

        // 1️⃣ CO2 emissions (metric tons per capita)
        const co2Data = await fetchWorldBankData("EN.ATM.CO2E.PC");

        // 2️⃣ Renewable energy consumption (% of total final energy consumption)
        const renewableData = await fetchWorldBankData("EG.FEC.RNEW.ZS");

        // 3️⃣ Access to electricity (% of population)
        const electricityData = await fetchWorldBankData("EG.ELC.ACCS.ZS");

        // 4️⃣ Urban population (% of total population)
        const urbanPopulation = await fetchWorldBankData("SP.URB.TOTL.IN.ZS");

        const countryCO2Data = await fetchCountryCO2Data("2022");

        // Format response for charts
        const response = {
            charts: {
                globalCO2Trend: co2Data.map(d => ({ name: d.year, value: d.value })),
                renewableEnergyTrend: renewableData.map(d => ({ name: d.year, value: d.value })),
                electricityAccessTrend: electricityData.map(d => ({ name: d.year, value: d.value })),
                urbanPopulationTrend: urbanPopulation.map(d => ({ name: d.year, value: d.value })),
                globalCO2Heatmap: countryCO2Data,
            },
            lastUpdated: new Date().toISOString(),
        };

        globalCache = { data: response, timestamp: now };
        res.json(response);

    } catch (error) {
        console.error("❌ Error fetching global sustainability data:", error.message);
        res.status(500).json({ message: "Failed to fetch World Bank data" });
    }
};

module.exports = { getGlobalSustainabilityDashboard };