const axios = require('axios');

// @desc    Calculate distance between two addresses
// @route   POST /api/logistics/calculate-distance
// @access  Private
const calculateDistance = async (req, res) => {
  const { origin, destination } = req.body;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  console.log("🔍 Incoming request to calculate distance:");
  console.log(`   Origin: ${origin}`);
  console.log(`   Destination: ${destination}`);

  if (!origin || !destination) {
    return res.status(400).json({ message: 'Origin and destination addresses are required.' });
  }

  // If no API key → return mock distance (development fallback)
  if (!apiKey) {
    const mockDistance = (Math.random() * (100 - 10) + 10).toFixed(2);
    console.warn("⚠️ Google Maps API key missing. Returning MOCK distance:", mockDistance, "km");
    return res.json({ distanceKm: parseFloat(mockDistance), mock: true });
  }

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&units=metric&key=${apiKey}`;

  try {
    console.log("🌍 Sending request to Google Distance Matrix API...");
    const response = await axios.get(url);
    const data = response.data;

    console.log("📦 Raw Google API Response:", JSON.stringify(data, null, 2));

    if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
      const distanceInMeters = data.rows[0].elements[0].distance.value;
      const distanceInKm = parseFloat((distanceInMeters / 1000).toFixed(2));
      console.log(`✅ Calculated distance: ${distanceInKm} km`);
      res.json({ distanceKm: distanceInKm, mock: false });
    } else {
      console.error("❌ Google API error:", data.error_message || 'Could not calculate distance.');
      // Fallback to mock in case of API error
      const mockDistance = (Math.random() * (100 - 10) + 10).toFixed(2);
      console.warn("⚠️ Falling back to MOCK distance:", mockDistance, "km");
      res.json({ distanceKm: parseFloat(mockDistance), mock: true });
    }
  } catch (error) {
    console.error("🚨 Distance Matrix API error:", error.message);
    // Fallback to mock on error
    const mockDistance = (Math.random() * (100 - 10) + 10).toFixed(2);
    console.warn("⚠️ Falling back to MOCK distance due to error:", mockDistance, "km");
    res.json({ distanceKm: parseFloat(mockDistance), mock: true });
  }
};

module.exports = {
  calculateDistance,
};