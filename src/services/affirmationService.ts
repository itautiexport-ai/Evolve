/**
 * Affirmation Video Generation Service
 * 
 * Modular service layer for fetching or generating daily affirmation videos.
 * Designed to plug into AI video generation APIs (Synthesia, HeyGen, D-ID, etc.)
 * when credentials are configured via environment variables.
 * 
 * Falls back to a local sample asset when no API is connected.
 */

export interface AffirmationVideo {
  url: string;
  posterUrl: string;
  title: string;
  transcript: string[];
  duration: number; // seconds
  locale: string;
}

// Environment variables (set in .env file, prefixed with VITE_ for Vite)
const API_KEY = import.meta.env.VITE_AFFIRMATION_API_KEY || '';
const API_URL = import.meta.env.VITE_AFFIRMATION_API_URL || '';

/**
 * Default affirmation dialogue in Hindi
 */
const DEFAULT_TRANSCRIPT = [
  'मेरे साथ दोहराएँ…',
  'मैं स्वस्थ हूँ।',
  'मैं मस्त हूँ।',
  'मैं जबरदस्त हूँ!',
];

/**
 * Check whether an AI video generation API is configured
 */
function isApiConfigured(): boolean {
  return Boolean(API_KEY && API_URL);
}

/**
 * Generate a video via the configured AI video generation API.
 * This is a placeholder implementation — replace the fetch logic
 * with the specific API's SDK or REST calls when ready.
 */
async function generateFromApi(): Promise<AffirmationVideo> {
  if (!isApiConfigured()) {
    throw new Error('Affirmation API is not configured.');
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      script: DEFAULT_TRANSCRIPT.join('\n'),
      language: 'hi-IN',
      avatar: 'indian-female-warm',
      style: 'hand-painted-anime',
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return {
    url: data.video_url,
    posterUrl: '/affirmation-poster.png',
    title: 'Daily Affirmation',
    transcript: DEFAULT_TRANSCRIPT,
    duration: data.duration || 10,
    locale: 'hi-IN',
  };
}

/**
 * Return the local fallback video asset for development / demo purposes.
 */
function getLocalFallback(): AffirmationVideo {
  return {
    url: '/affirmation-sample.mp4',
    posterUrl: '/affirmation-poster.png',
    title: 'Daily Affirmation',
    transcript: DEFAULT_TRANSCRIPT,
    duration: 10,
    locale: 'hi-IN',
  };
}

/**
 * Primary entry point — returns an affirmation video.
 * Tries the AI API first; falls back to local sample.
 */
export async function getAffirmationVideo(): Promise<AffirmationVideo> {
  if (isApiConfigured()) {
    try {
      return await generateFromApi();
    } catch (err) {
      console.warn('[AffirmationService] API call failed, using local fallback:', err);
      return getLocalFallback();
    }
  }

  return getLocalFallback();
}
