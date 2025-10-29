/*
 * SCRIPT TO AUTO-TRANSLATE LANGUAGE FILES
 *
 * This script reads your source language file (e.g., en/translation.json),
 * sends all its string values to the Google Translate API, and
 * automatically creates the new language files (e.g., es/translation.json).
 *
 * How to run:
 * node scripts/translateJsonFiles.js <targetLanguageCode>
 *
 * Example:
 * node scripts/translateJsonFiles.js es
 */

const { TranslationServiceClient } = require('@google-cloud/translate').v3beta1;
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const translationClient = new TranslationServiceClient();

// --- Configuration ---
const SOURCE_LANGUAGE = 'en';
// This path assumes your client folder is a sibling to your server folder
// e.g., /project-root/client and /project-root/server
const SOURCE_FILE_PATH = path.resolve(__dirname, '../../client/public/locales/en/translation.json');
const TARGET_DIR = path.resolve(__dirname, '../../client/public/locales');
const GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID;
// ---------------------

// Helper function to flatten the JSON for the API
function flattenObject(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, flattenObject(obj[k], pre + k));
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
}

// Helper function to un-flatten the object from API response
function unflattenObject(obj) {
  return Object.keys(obj).reduce((acc, k) => {
    const keys = k.split('.');
    let current = acc;
    keys.forEach((key, index) => {
      if (index === keys.length - 1) {
        current[key] = obj[k];
      } else {
        current[key] = current[key] || {};
        current = current[key];
      }
    });
    return acc;
  }, {});
}

async function translateFile(targetLang) {
  if (!GOOGLE_PROJECT_ID) {
    console.error('Error: GOOGLE_PROJECT_ID is not set in your .env file.');
    return;
  }
  if (!targetLang) {
    console.error('Error: No target language code provided.');
    console.log('Usage: node scripts/translateJsonFiles.js <languageCode>');
    console.log('Example: node scripts/translateJsonFiles.js es');
    return;
  }

  console.log(`--- Starting translation for [${targetLang}] ---`);

  // 1. Read and parse the source English file
  let sourceContent;
  try {
    sourceContent = JSON.parse(fs.readFileSync(SOURCE_FILE_PATH, 'utf8'));
  } catch (e) {
    console.error(`Error reading source file at ${SOURCE_FILE_PATH}`);
    return;
  }

  // 2. Flatten the JSON and extract strings to translate
  const flatSource = flattenObject(sourceContent);
  const sourceTexts = Object.values(flatSource);
  const sourceKeys = Object.keys(flatSource);

  if (sourceTexts.length === 0) {
    console.error('No text found to translate.');
    return;
  }

  console.log(`Found ${sourceTexts.length} strings to translate...`);

  // 3. Send to Google Translate API
  const request = {
    parent: `projects/${GOOGLE_PROJECT_ID}/locations/global`,
    contents: sourceTexts,
    mimeType: 'text/plain',
    sourceLanguageCode: SOURCE_LANGUAGE,
    targetLanguageCode: targetLang,
  };

  let translatedTexts;
  try {
    const [response] = await translationClient.translateText(request);
    translatedTexts = response.translations.map(t => t.translatedText);
  } catch (error) {
    console.error('Error calling Google Translate API:', error.message);
    return;
  }

  // 4. Reconstruct the JSON
  const flatTranslated = {};
  sourceKeys.forEach((key, index) => {
    flatTranslated[key] = translatedTexts[index];
  });

  const translatedContent = unflattenObject(flatTranslated);

  // 5. Write the new JSON file
  const targetPath = path.resolve(TARGET_DIR, targetLang);
  const targetFilePath = path.resolve(targetPath, 'translation.json');

  try {
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }
    fs.writeFileSync(targetFilePath, JSON.stringify(translatedContent, null, 2));
    console.log(`✅ Success! File created at ${targetFilePath}`);
  } catch (error) {
    console.error('Error writing translated file:', error);
  }
}

// Get the target language from the command line arguments
const targetLang = process.argv[2];
translateFile(targetLang);