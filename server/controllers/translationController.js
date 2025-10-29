const { TranslationServiceClient } = require('@google-cloud/translate').v3beta1;
const translationClient = new TranslationServiceClient();

/**
 * @desc    Translate a batch of text
 * @route   POST /api/translate
 * @access  Private
 */
const translateText = async (req, res) => {
  const { texts, targetLang } = req.body;
  const projectId = process.env.GOOGLE_PROJECT_ID;
  const location = 'global';

  if (!texts || !Array.isArray(texts) || !targetLang || !projectId) {
    return res.status(400).json({ message: 'Invalid request. "texts" (array), "targetLang", and "projectId" are required.' });
  }

  try {
    const request = {
      parent: `projects/${projectId}/locations/global`,
      contents: texts,
      mimeType: 'text/plain',
      targetLanguageCode: targetLang,
    };

    const [response] = await translationClient.translateText(request);
    const translatedTexts = response.translations.map(t => t.translatedText);
    res.status(200).json({ translatedTexts });

  } catch (error) {
    console.error('Error translating text:', error);
    res.status(500).json({ message: 'Translation failed', error: error.message });
  }
};

module.exports = {
  translateText,
};