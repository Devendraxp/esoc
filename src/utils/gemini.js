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
    
    // Free tier uses "gemini-1.5-flash" model
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    
    // Add instructions to prevent incomplete responses with trailing numbers
    const enhancedContext = `${modelContext}\n\nIMPORTANT INSTRUCTIONS FOR RESPONSE FORMAT:
1. Provide your answer as a complete, well-formed paragraph.
2. Do not use bullet points or numbered lists unless absolutely necessary.
3. If you use numbered points, ensure your response is complete and doesn't end with a hanging number.
4. Do not use markdown formatting like asterisks.
5. Write in plain text only.`;
    
    // Format the context and query in a way that's clear for Gemini
    const combinedPrompt = `
CONTEXT FROM LOCAL KNOWLEDGE BASE:
${enhancedContext}

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
    
    console.log('Sending request to Gemini API using model: gemini-1.5-flash');
    
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
      
      let responseText = response.data.candidates[0].content.parts[0].text;
      
      // Clean up the response to remove trailing enumerations
      responseText = responseText.replace(/\s+\d+\.\s*$/g, '');
      if (responseText.match(/\n\s*\d+\.\s*$/)) {
        responseText = responseText.replace(/\n\s*\d+\.\s*$/g, '');
      }
      
      return responseText;
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
      
      // Try alternative models if the first one fails
      if (error.response.data && error.response.data.error && 
          error.response.data.error.message && 
          error.response.data.error.message.includes('not found for API version')) {
        console.log('First model attempt failed. Trying alternative model...');
        return tryAlternativeModel(query, modelContext);
      }
      
      if (error.response.data && error.response.data.error) {
        return `I'm sorry, but there was an error accessing the AI service: ${error.response.data.error.message}`;
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from API');
    }
    
    return "I'm sorry, but I'm having trouble accessing the Gemini API right now. Please try again later.";
  }
}

/**
 * Try alternative Gemini models if the first one fails
 */
async function tryAlternativeModel(query, modelContext) {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    // Try with gemini-pro model (may work with some API keys)
    const ALTERNATIVE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    
    const combinedPrompt = `
CONTEXT FROM LOCAL KNOWLEDGE BASE:
${modelContext}

USER QUESTION:
${query}

Please answer the user's question based on the context provided and your knowledge.`;

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
    
    console.log('Trying alternative model: gemini-pro');
    
    const response = await axios({
      method: 'post',
      url: `${ALTERNATIVE_URL}?key=${GEMINI_API_KEY}`,
      data: payload,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && 
        response.data.candidates && 
        response.data.candidates.length > 0 && 
        response.data.candidates[0].content && 
        response.data.candidates[0].content.parts && 
        response.data.candidates[0].content.parts.length > 0) {
      
      return response.data.candidates[0].content.parts[0].text;
    } else {
      throw new Error("Unexpected response structure from alternative model");
    }
  } catch (error) {
    console.error('Alternative model request failed:', error.message);
    return useFallbackResponse(query, modelContext);
  }
}

/**
 * Use a fallback text-based response when API calls fail
 */
function useFallbackResponse(query, modelContext) {
  // Extract keywords from the query
  const queryLower = query.toLowerCase();
  let response = "I don't have specific information about that topic from reliable sources. ";
  
  // Generate a generic, helpful response based on query keywords
  if (queryLower.includes("weather") || queryLower.includes("flood") || queryLower.includes("storm") || queryLower.includes("rain")) {
    response += "For the most up-to-date weather information and natural disaster reports, I recommend checking official meteorological services or reliable news sources.";
  } 
  else if (queryLower.includes("earthquake") || queryLower.includes("disaster")) {
    response += "For information about recent natural disasters, please check official emergency management agencies or reliable international news sources.";
  }
  else if (queryLower.includes("conflict") || queryLower.includes("war") || queryLower.includes("attack")) {
    response += "For information about ongoing conflicts, I recommend consulting reliable international news organizations that provide verified reporting from conflict zones.";
  }
  else if (queryLower.includes("aid") || queryLower.includes("help") || queryLower.includes("support")) {
    response += "For information about humanitarian aid and support services, I recommend contacting local aid organizations or checking with international humanitarian agencies like the Red Cross/Red Crescent.";
  }
  else {
    response += "I recommend checking verified news sources for the most accurate and up-to-date information on this topic.";
  }
  
  return response;
}

export default {
  getGeminiResponse,
};