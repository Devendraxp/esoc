import axios from 'axios';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function getGeminiResponse(prompt, systemInstruction) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

  const maxRetries = 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios({
        method: 'post',
        url: `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        data: {
          systemInstruction: systemInstruction
            ? { parts: [{ text: systemInstruction }] }
            : undefined,
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 800, topP: 0.8, topK: 40 }
        },
        headers: { 'Content-Type': 'application/json' }
      });

      const candidates = response.data?.candidates;
      if (candidates?.[0]?.content?.parts?.[0]?.text) {
        return candidates[0].content.parts[0].text;
      }

      throw new Error('Unexpected Gemini response structure');
    } catch (err) {
      const status = err.response?.status;
      if ((status === 429 || status === 503) && attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
}
