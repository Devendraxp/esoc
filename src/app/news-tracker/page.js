'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';
import Card from '../../components/Card';
import Container from '../../components/Container';
import ThemeToggle from '../../components/ThemeToggle';
import Input from '../../components/Input';
import Button from '../../components/Button';

export default function NewsTracker() {
  const { isSignedIn, user } = useUser();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [responseSource, setResponseSource] = useState('');
  
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!location.trim()) {
      setError('Please enter a location');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/news-tracker/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, location }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search');
      }
      
      const data = await response.json();
      setResults(data);
      setResponseSource(data.source || 'AI');
    } catch (err) {
      setError(err.message || 'An error occurred while searching');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Determine user's role for sidebar
  const userRole = user?.publicMetadata?.role || 'normal';

  // Helper function to get the model name display text
  const getModelDisplayName = () => {
    if (responseSource === 'gemini') return 'Gemini AI';
    if (responseSource === 'huggingface-llama') return 'Llama AI';
    if (responseSource === 'huggingface') return 'AI Assistant';
    if (responseSource === 'openai-fallback' || responseSource === 'openai') return 'OpenAI';
    if (responseSource === 'openai-simplified') return 'OpenAI';
    if (responseSource === 'static-fallback') return 'News Service';
    return 'Eko AI';
  };
  
  // Helper function to get the model icon
  const getModelIcon = () => {
    if (responseSource === 'gemini') return '/Eko.png';
    if (responseSource === 'openai' || responseSource === 'openai-fallback' || responseSource === 'openai-simplified') return '/openai-icon.png';
    return '/Eko.png';
  };
  
  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-[#ededed]">
      <Sidebar userRole={userRole} />
      
      <div className="flex-1 ml-64">
        <header className="flex justify-between items-center p-8 border-b border-zinc-800">
          <h1 className="text-2xl font-bold text-[#ededed]">News Tracker</h1>
          <ThemeToggle />
        </header>
        
        <main className="p-8">
          <Container className="py-6">
            <Card className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Search Location News</h2>
              <p className="text-zinc-400 mb-6">
                Get real-time news and information about specific locations. Ask questions or just specify a location 
                to get the latest updates.
              </p>
              
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium mb-2">
                    Location <span className="text-red-400">*</span>
                  </label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., New York"
                    className="w-full"
                    required
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Required: Enter a city, country or specific location
                  </p>
                </div>
                
                <div>
                  <label htmlFor="query" className="block text-sm font-medium mb-2">
                    Your Question (Optional)
                  </label>
                  <Input
                    id="query"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., What's happening with the power outages?"
                    className="w-full"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Leave empty to get general news about the location
                  </p>
                </div>
                
                <Button
                  type="submit"
                  disabled={isLoading || !isSignedIn}
                  className={`w-full px-4 py-2 ${
                    isLoading
                      ? 'bg-blue-900/30 text-blue-300'
                      : 'bg-blue-900/20 text-blue-400 border border-blue-700 hover:bg-blue-800/30'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="h-5 w-5 mr-2 rounded-full border-2 border-t-transparent border-blue-300 animate-spin"></div>
                      Searching...
                    </div>
                  ) : (
                    'Get News'
                  )}
                </Button>
                
                {!isSignedIn && (
                  <p className="text-yellow-400 text-sm mt-2">
                    You need to sign in to use the News Tracker.
                  </p>
                )}
              </form>
            </Card>
            
            {error && (
              <Card className="mb-8 bg-red-900/20 border-red-800">
                <p className="text-red-300">{error}</p>
              </Card>
            )}
            
            {results && (
              <div className="space-y-6">
                {/* Direct Answer Card */}
                {results.directAnswer && (
                  <Card className="mb-4 bg-purple-900/20 border border-purple-800/50">
                    <div className="flex items-center mb-4">
                      <img 
                        src={getModelIcon()}
                        alt={getModelDisplayName()} 
                        className="h-8 w-8 mr-3" 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/favicon.ico";
                        }}
                      />
                      <div>
                        <h3 className="text-lg font-medium text-purple-400">{getModelDisplayName()} Response</h3>
                        <p className="text-xs text-zinc-500">For: {location} {query ? `- "${query}"` : ''}</p>
                      </div>
                    </div>
                    <div className="prose prose-invert max-w-none">
                      <p className="whitespace-pre-line">{results.directAnswer}</p>
                    </div>
                    {results.serviceStatus && (
                      <div className="mt-3 pt-3 border-t border-zinc-700/50">
                        <p className="text-xs text-amber-400">{results.serviceStatus}</p>
                      </div>
                    )}
                  </Card>
                )}
                
                {/* Community Info Card */}
                {results.communityInfo && results.communityInfo !== "No relevant posts found in the community data." && 
                 results.communityInfo !== `No relevant posts found for ${location} in the community data.` && (
                  <Card className="mb-4 bg-blue-900/20 border border-blue-800/50">
                    <h3 className="text-lg font-medium mb-3 text-blue-400">Community Information</h3>
                    <div className="prose prose-invert max-w-none">
                      <p className="whitespace-pre-line">{results.communityInfo}</p>
                    </div>
                    
                    {/* Community Posts Links */}
                    {results.communityPosts && results.communityPosts.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-blue-800/30">
                        <h4 className="text-sm font-medium mb-2 text-blue-400">Related Community Posts</h4>
                        <ul className="space-y-2">
                          {results.communityPosts.map(post => (
                            <li key={post.id} className="text-sm">
                              <Link 
                                href={`/posts/${post.id}`}
                                className="text-blue-400 hover:text-blue-300 hover:underline flex items-start"
                              >
                                <span className="inline-block w-4 h-4 mr-2 mt-0.5 text-blue-500">•</span>
                                <span>
                                  <span className="line-clamp-1">{post.content}</span>
                                  <span className="text-xs text-blue-600">{post.date}</span>
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                )}
                
                {/* Latest News Card */}
                <Card className="bg-zinc-900 border border-zinc-700">
                  <div className="flex items-center mb-4">
                    <h3 className="text-lg font-medium text-zinc-400">Latest News for {location}</h3>
                  </div>
                  
                  {results.newsArticles && results.newsArticles.length > 0 ? (
                    <ul className="space-y-3">
                      {results.newsArticles.map((article, index) => (
                        <li key={index} className="border-b border-zinc-800 last:border-b-0 pb-3 last:pb-0">
                          <a 
                            href={article.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 hover:underline"
                          >
                            {article.title}
                          </a>
                          <div className="flex justify-between text-xs text-zinc-500 mt-1">
                            <span>{article.source?.name || 'News Source'}</span>
                            <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-zinc-400">
                      {results.grokResponse ? (
                        <p className="whitespace-pre-line">{results.grokResponse}</p>
                      ) : (
                        <p>No recent news found for this location.</p>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            )}
          </Container>
        </main>
      </div>
    </div>
  );
}