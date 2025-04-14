import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - You must be logged in to use this feature' },
        { status: 401 }
      );
    }
    
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'No prompt provided' },
        { status: 400 }
      );
    }
    
    const GROK_API_KEY = process.env.GROK_API_KEY;
    
    if (!GROK_API_KEY) {
      return NextResponse.json(
        { error: 'Grok API key is not configured' },
        { status: 500 }
      );
    }
    
    // Call Grok API
    const response = await fetch('https://api.grok.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'grok-1',
        messages: [
          { role: 'system', content: 'You are a helpful assistant providing accurate information about current events.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Grok API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to get response from Grok' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      answer: data.choices[0].message.content
    });
    
  } catch (error) {
    console.error('Error in Grok API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
