import { NextResponse } from 'next/server';

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');
  
  if (!query || query.length < 2) {
    return NextResponse.json([], { status: 400 });
  }
  
  try {
    // Using Open-Meteo Geocoding API - a free service with no API key required
    // This provides global city data with good coverage
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch location suggestions');
    }
    
    const data = await response.json();
    
    // Format the results for display
    const suggestions = data.results?.map(place => {
      // Create a nicely formatted location string
      const parts = [];
      
      if (place.name) parts.push(place.name);
      if (place.admin1) parts.push(place.admin1); // State/province
      if (place.country) parts.push(place.country);
      
      return parts.join(', ');
    }) || [];
    
    return NextResponse.json(suggestions);
    
  } catch (error) {
    console.error('Error fetching location suggestions:', error);
    return NextResponse.json([], { status: 500 });
  }
}