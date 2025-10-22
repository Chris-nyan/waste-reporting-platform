/**
 * @desc    Calls the Google Gemini API to generate content based on a prompt.
 * @param   {string} prompt The detailed prompt for the AI model.
 * @returns {Promise<string>} The generated text content from the AI.
 */
async function generateAiContent(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("Gemini API key is missing. Please add GEMINI_API_KEY to your .env file.");
    // For development, we return a placeholder to avoid crashing if the key is missing.
    return "AI service is not configured. [Placeholder Answer 1]\nAI service is not configured. [Placeholder Answer 2]";
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.5,
      topK: 1,
      topP: 1,
      maxOutputTokens: 8192,
    },
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error("Gemini API Error:", errorBody);
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.candidates && result.candidates.length > 0 && result.candidates[0].content.parts.length > 0) {
      return result.candidates[0].content.parts[0].text;
    } else {
      throw new Error("Invalid response structure from Gemini API.");
    }

  } catch (error) {
    console.error("Failed to generate AI content:", error);
    throw new Error("The AI service failed to generate a response.");
  }
}

module.exports = {
  generateAiContent,
};

