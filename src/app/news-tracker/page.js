'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';
import Card from '../../components/Card';
// Removed Container import
import ThemeToggle from '../../components/ThemeToggle';
import Input from '../../components/Input';
import Button from '../../components/Button';

export default function NewsTracker() {
  const { isSignedIn, user } = useUser();
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [responseSource, setResponseSource] = useState('');
  const [isMobileView, setIsMobileView] = useState(false);

  // Fix for hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Theme-aware style classes
  const bgClass = theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50';
  const textClass = theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800';
  const headerBgClass = theme === 'dark' ? 'bg-zinc-900' : 'bg-white';
  const headerBorderClass = theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200';
  const secondaryTextClass = theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600';
  const tertiaryTextClass = theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500';
  const cardBorderClass = theme === 'dark' ? 'border-zinc-700' : 'border-zinc-300';
  const cardBgClass = theme === 'dark' ? 'bg-zinc-900' : 'bg-white';
  const dividerClass = theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200';
  const inputBgClass = theme === 'dark' ? 'bg-zinc-800' : 'bg-white';
  const inputBorderClass = theme === 'dark' ? 'border-zinc-700' : 'border-zinc-300';
  const buttonHoverClass = theme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-200';
  
  // Check if we're in a mobile view on component mount and window resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    // Check on mount
    checkIfMobile();
    
    // Check on resize
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Handle location input and fetch suggestions from API
  const handleLocationChange = (e) => {
    const inputValue = e.target.value;
    setLocation(inputValue);
    
    if (inputValue.length > 1) {
      // Fetch location suggestions
      setIsLoadingSuggestions(true);
      fetchLocationSuggestions(inputValue);
    } else {
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  };
  
  // Fetch location suggestions from API
  const fetchLocationSuggestions = async (query) => {
    if (!query || query.length < 2) return;
    
    try {
      const response = await fetch(`/api/location-suggestions?query=${encodeURIComponent(query)}`);
      
      if (response.ok) {
        const data = await response.json();
        setLocationSuggestions(data);
        setShowSuggestions(data.length > 0);
      } else {
        console.error('Failed to fetch location suggestions');
        setLocationSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setLocationSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };
  
  // Select a suggestion
  const selectSuggestion = (suggestion) => {
    setLocation(suggestion);
    setShowSuggestions(false);
  };
  
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

  if (!mounted) {
    return null; // Prevent hydration issues
  }
  
  return (
    <div className={`flex min-h-screen ${bgClass} ${textClass}`}>
      <Sidebar userRole={userRole} />
      
      <div className="flex-1 md:ml-64 w-full">
        <header className={`sticky top-0 z-10 ${headerBgClass} border-b ${headerBorderClass} p-4 md:p-8 flex justify-between items-center`}>
          <h1 className={`text-xl md:text-2xl font-bold ${textClass} pl-14 md:pl-0`}>Eko AI News</h1>
          <ThemeToggle />
        </header>
        
        <main className="p-4 md:p-8 pb-20 md:pb-8">
          <Card className="mb-6 md:mb-8">
            <h2 className={`text-lg md:text-xl font-semibold mb-3 md:mb-4 ${textClass}`}>Search Location News</h2>
            <p className={`${secondaryTextClass} mb-4 md:mb-6 text-sm md:text-base`}>
              Get real-time news and information about specific locations. Ask questions or just specify a location 
              to get the latest updates.
            </p>
            
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label htmlFor="location" className={`block text-sm font-medium mb-2 ${textClass}`}>
                  Location <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="location"
                    value={location}
                    onChange={handleLocationChange}
                    placeholder="e.g., New York"
                    className="w-full"
                    required
                  />
                  {showSuggestions && (
                    <ul className={`absolute z-10 mt-1 w-full ${inputBgClass} border ${inputBorderClass} rounded-lg ${textClass} max-h-60 overflow-auto`}>
                      {locationSuggestions.map((suggestion, index) => (
                        <li 
                          key={index} 
                          className={`p-2 ${buttonHoverClass} cursor-pointer`}
                          onClick={() => selectSuggestion(suggestion)}
                        >
                          {suggestion}
                        </li>
                      ))}
                      {isLoadingSuggestions && (
                        <li className="p-2 text-center">
                          <div className={`animate-spin inline-block h-4 w-4 border-t-2 border-current rounded-full`}></div>
                        </li>
                      )}
                      {!isLoadingSuggestions && locationSuggestions.length === 0 && (
                        <li className={`p-2 ${tertiaryTextClass}`}>No suggestions found</li>
                      )}
                    </ul>
                  )}
                  <p className={`text-xs ${tertiaryTextClass} mt-1`}>
                    Required: Enter a city, country or specific location
                  </p>
                </div>
              </div>
              
              <div>
                <label htmlFor="query" className={`block text-sm font-medium mb-2 ${textClass}`}>
                  Your Question (Optional)
                </label>
                <Input
                  id="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., What's happening with the power outages?"
                  className="w-full"
                />
                <p className={`text-xs ${tertiaryTextClass} mt-1`}>
                  Leave empty to get general news about the location
                </p>
              </div>
              
              <Button
                type="submit"
                disabled={isLoading || !isSignedIn}
                className={`w-full px-4 py-2 ${
                  isLoading
                    ? 'bg-blue-900/30 text-blue-300'
                    : theme === 'dark' 
                      ? 'bg-blue-900/20 text-blue-400 border border-blue-700 hover:bg-blue-800/30'
                      : 'bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200'
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
            <Card className="mb-6 md:mb-8 bg-red-900/20 border-red-800">
              <p className="text-red-300">{error}</p>
            </Card>
          )}
          
          {results && (
            <div className="space-y-4 md:space-y-6">
              {/* Direct Answer Card */}
              {results.directAnswer && (
                <Card className={`mb-3 md:mb-4 ${
                  theme === 'dark' 
                    ? 'bg-purple-900/20 border border-purple-800/50' 
                    : 'bg-purple-50 border border-purple-200'
                }`}>
                  <div className="flex items-center mb-3 md:mb-4">
                    <img 
                      src={getModelIcon()}
                      alt={getModelDisplayName()} 
                      className="h-6 w-6 md:h-8 md:w-8 mr-2 md:mr-3" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/favicon.ico";
                      }}
                    />
                    <div>
                      <h3 className={`text-base md:text-lg font-medium ${theme === 'dark' ? 'text-purple-400' : 'text-purple-700'}`}>
                        Eko AI Response
                      </h3>
                      <p className={`text-xs ${tertiaryTextClass}`}>For: {location} {query ? `- "${query}"` : ''}</p>
                    </div>
                  </div>
                  <div className={`prose ${theme === 'dark' ? 'prose-invert' : ''} max-w-none text-sm md:text-base ${textClass}`}>
                    <p className="whitespace-pre-line">{results.directAnswer}</p>
                  </div>
                  {results.serviceStatus && (
                    <div className={`mt-3 pt-3 border-t ${theme === 'dark' ? 'border-zinc-700/50' : 'border-zinc-200'}`}>
                      <p className="text-xs text-amber-400">{results.serviceStatus}</p>
                    </div>
                  )}
                </Card>
              )}
              
              {/* Community Info Card */}
              {results.communityInfo && results.communityInfo !== "No relevant posts found in the community data." && 
               results.communityInfo !== `No relevant posts found for ${location} in the community data.` && (
                <Card className={`mb-3 md:mb-4 ${
                  theme === 'dark' 
                    ? 'bg-blue-900/20 border border-blue-800/50' 
                    : 'bg-blue-50 border border-blue-200'
                }`}>
                  <h3 className={`text-base md:text-lg font-medium mb-2 md:mb-3 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>
                    Community Information
                  </h3>
                  <div className={`prose ${theme === 'dark' ? 'prose-invert' : ''} max-w-none text-sm md:text-base ${textClass}`}>
                    <p className="whitespace-pre-line">{results.communityInfo}</p>
                  </div>
                  
                  {/* Community Posts Links */}
                  {results.communityPosts && results.communityPosts.length > 0 && (
                    <div className={`mt-3 md:mt-4 pt-3 md:pt-4 border-t ${theme === 'dark' ? 'border-blue-800/30' : 'border-blue-200'}`}>
                      <h4 className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>
                        Related Community Posts
                      </h4>
                      <ul className="space-y-2">
                        {results.communityPosts.map(post => (
                          <li key={post.id} className="text-xs md:text-sm">
                            <Link 
                              href={`/posts/${post.id}`}
                              className={`${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} hover:underline flex items-start`}
                            >
                              <span className={`inline-block w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 mt-0.5 ${theme === 'dark' ? 'text-blue-500' : 'text-blue-600'}`}>•</span>
                              <span>
                                <span className="line-clamp-1">{post.content}</span>
                                <span className={`text-2xs md:text-xs ${theme === 'dark' ? 'text-blue-600' : 'text-blue-700'}`}>{post.date}</span>
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
              <Card className={`${cardBgClass} border ${cardBorderClass}`}>
                <div className="flex items-center mb-3 md:mb-4">
                  <h3 className={`text-base md:text-lg font-medium ${secondaryTextClass}`}>Latest News for {location}</h3>
                </div>
                
                {results.newsArticles && results.newsArticles.length > 0 ? (
                  <ul className="space-y-3">
                    {results.newsArticles.map((article, index) => (
                      <li key={index} className={`border-b ${dividerClass} last:border-b-0 pb-3 last:pb-0`}>
                        <a 
                          href={article.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={`${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} hover:underline text-sm md:text-base`}
                        >
                          {article.title}
                        </a>
                        <div className={`flex justify-between text-2xs md:text-xs ${tertiaryTextClass} mt-1`}>
                          <span>{article.source?.name || 'News Source'}</span>
                          <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className={`${secondaryTextClass} text-sm md:text-base`}>
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
        </main>
      </div>
    </div>
  );
}