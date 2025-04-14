import React, { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Button from './Button';
import Input from './Input';
import Card from './Card';

export default function NewsQueryForm({ onQueryComplete }) {
  const { isSignedIn } = useAuth();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [response, setResponse] = useState(null);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isSignedIn) {
      setError('You must be signed in to use the news tracker');
      return;
    }
    
    if (!query.trim()) {
      setError('Please enter a question');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setResponse(null);
    
    try {
      const res = await fetch('/api/news-tracker/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          location: location.trim()
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to process query');
      }
      
      const data = await res.json();
      setResponse(data);
      
      if (onQueryComplete) {
        onQueryComplete(data);
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="mb-8">
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label htmlFor="query" className="block mb-2 text-sm font-medium text-zinc-300">
            Ask about news or events
          </label>
          <textarea
            id="query"
            rows="3"
            className="w-full px-4 py-2 bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ask about news or events from this community."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="location" className="block mb-2 text-sm font-medium text-zinc-300">
            Location (Optional)
          </label>
          <Input
            id="location"
            type="text"
            placeholder="Filter by location (e.g., 'Mumbai')"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting || !query.trim()}
          >
            {isSubmitting ? 'Processing...' : 'Ask Question'}
          </Button>
        </div>
      </form>
      
      {error && (
        <Card className="mb-6">
          <p className="text-red-300">{error}</p>
        </Card>
      )}
      
      {response && (
        <div className="mb-6">
          <Card className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Community Knowledge</h3>
            <p>{response.localModelResponse}</p>
          </Card>
          
          <Card>
            <h3 className="text-lg font-semibold mb-2">Gemini Response</h3>
            <p>{response.grokResponse}</p>
          </Card>
        </div>
      )}
    </div>
  );
}