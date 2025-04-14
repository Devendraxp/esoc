import axios from 'axios';

/**
 * Generate a factual response using Gemini API
 * @param {string} query - The user's question
 * @param {string} modelContext - Context from our memory model
 * @returns {string} - Gemini's response
 */
export async function getGeminiResponse(query, modelContext) {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      console.error('Gemini API key is missing');
      throw new Error('API key not configured');
    }
    
    // Using the standard Gemini Pro model endpoint
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';
    
    // Format the context and query in a way that's clear for Gemini
    const combinedPrompt = `
CONTEXT FROM LOCAL KNOWLEDGE BASE:
${modelContext}

USER QUESTION:
${query}

Please answer the user's question based on the context provided and your knowledge. If the context doesn't contain enough information, use your knowledge to provide a helpful response.`;

    // Simplified payload structure according to Google's documentation
    const payload = {
      contents: [
        {
          parts: [
            { text: combinedPrompt }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
        topP: 0.8,
        topK: 40
      }
    };
    
    console.log('Sending request to Gemini API with key:', GEMINI_API_KEY.substring(0, 5) + '...');
    
    const response = await axios({
      method: 'post',
      url: `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      data: payload,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Gemini API response status:', response.status);

    // Response extraction
    if (response.data && 
        response.data.candidates && 
        response.data.candidates.length > 0 && 
        response.data.candidates[0].content && 
        response.data.candidates[0].content.parts && 
        response.data.candidates[0].content.parts.length > 0) {
      
      return response.data.candidates[0].content.parts[0].text;
    } else {
      console.error('Unexpected API response structure:', JSON.stringify(response.data, null, 2));
      throw new Error("Unexpected response structure");
    }
  } catch (error) {
    // Detailed error logging
    console.error('Error in Gemini API call:', error.message);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      
      if (error.response.data && error.response.data.error) {
        return `I'm sorry, but there was an error: ${error.response.data.error.message || 'Unknown API error'}`;
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from API');
    }
    
    return "I'm sorry, but I'm having trouble accessing the Gemini API right now. Please try again later.";
  }
}

export default {
  getGeminiResponse,
};