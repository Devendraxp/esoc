'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import Sidebar from '../../components/Sidebar';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Card from '../../components/Card';
import ThemeToggle from '../../components/ThemeToggle';

export default function CreatePost() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const userId = isLoaded && isSignedIn ? user.id : null;
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Fix for hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // State for user role
  const [userRole, setUserRole] = useState('normal');
  
  // Theme-aware style classes
  const bgClass = theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50';
  const textClass = theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800';
  const secondaryTextClass = theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600';
  const tertiaryTextClass = theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500';
  const headerBgClass = theme === 'dark' ? 'bg-zinc-900' : 'bg-white';
  const headerBorderClass = theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200';
  const inputBgClass = theme === 'dark' ? 'bg-zinc-800' : 'bg-white';
  const inputBorderClass = theme === 'dark' ? 'border-zinc-700' : 'border-zinc-300';
  const previewBgClass = theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100';
  const placeholderBgClass = theme === 'dark' ? 'bg-zinc-700' : 'bg-gray-200';
  const buttonHoverClass = theme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-200';
  
  // State for location suggestions
  const [location, setLocation] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  // Handle location input and fetch suggestions from API
  const handleLocationChange = (e) => {
    const inputValue = e.target.value;
    setLocation(inputValue);
    
    if (inputValue.length > 1) {
      // Debounce the API call to avoid too many requests
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
      // Using the GeoDB Cities API from RapidAPI
      // You can replace this with any location API of your choice
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
  
  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUserRole(userData.role);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };
    
    fetchUserRole();
  }, []);
  
  // State for form data
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setMediaFiles(prevFiles => [...prevFiles, ...files]);
    
    // Create preview URLs for images
    const newPreviewUrls = files.map(file => {
      const fileType = file.type.split('/')[0];
      if (fileType === 'image') {
        return {
          type: 'image',
          url: URL.createObjectURL(file),
          name: file.name
        };
      } else if (fileType === 'video') {
        return {
          type: 'video',
          url: URL.createObjectURL(file),
          name: file.name
        };
      } else if (fileType === 'audio') {
        return {
          type: 'audio',
          url: URL.createObjectURL(file),
          name: file.name
        };
      } else {
        return {
          type: 'document',
          url: '#',
          name: file.name
        };
      }
    });
    
    setPreviewUrls(prevUrls => [...prevUrls, ...newPreviewUrls]);
  };
  
  // Remove a file from the selection
  const removeFile = (index) => {
    const newMediaFiles = [...mediaFiles];
    const newPreviewUrls = [...previewUrls];
    
    // Revoke the URL to avoid memory leaks
    if (newPreviewUrls[index].url !== '#') {
      URL.revokeObjectURL(newPreviewUrls[index].url);
    }
    
    newMediaFiles.splice(index, 1);
    newPreviewUrls.splice(index, 1);
    
    setMediaFiles(newMediaFiles);
    setPreviewUrls(newPreviewUrls);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Post content is required');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Create FormData to upload files
      const formData = new FormData();
      formData.append('content', content);
      formData.append('location', location);
      mediaFiles.forEach(file => formData.append('media', file));
      
      const response = await fetch('/api/posts', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create post');
      }
      
      // Clear form after successful submission
      setContent('');
      setLocation('');
      setMediaFiles([]);
      
      // Revoke all object URLs to avoid memory leaks
      previewUrls.forEach(item => {
        if (item.url !== '#') {
          URL.revokeObjectURL(item.url);
        }
      });
      setPreviewUrls([]);
      
      // Redirect to home page
      router.push('/');
      router.refresh();
      
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render file previews
  const renderPreviews = () => {
    return previewUrls.map((item, index) => (
      <div key={index} className={`relative mb-4 p-2 ${previewBgClass} rounded-lg`}>
        <div className="flex items-center">
          {item.type === 'image' ? (
            <img src={item.url} alt={item.name} className="w-16 h-16 object-cover rounded mr-2" />
          ) : (
            <div className={`w-16 h-16 flex items-center justify-center ${placeholderBgClass} rounded mr-2`}>
              {item.type === 'video' ? '🎬' : item.type === 'audio' ? '🔊' : '📄'}
            </div>
          )}
          <div className="flex-1 truncate">{item.name}</div>
          <button 
            type="button" 
            onClick={() => removeFile(index)}
            className="ml-2 text-red-500 hover:text-red-400"
          >
            ✕
          </button>
        </div>
      </div>
    ));
  };
  
  if (!mounted) {
    return null; // Prevent hydration issues
  }
  
  return (
    <div className={`flex min-h-screen ${bgClass} ${textClass}`}>
      <Sidebar userRole={userRole} />
      
      {/* Main content */}
      <div className="flex-1 md:ml-64 w-full">
        <header className={`sticky top-0 z-10 ${headerBgClass} border-b ${headerBorderClass} p-4 flex justify-between items-center`}>
          <h1 className={`text-xl md:text-2xl font-bold ${textClass} text-center flex-1 pl-8 md:pl-0`}>Create Post</h1>
          <ThemeToggle />
        </header>

        <main className="p-4 md:p-8 pb-20 md:pb-8">
          <div className="py-6">
            <Card className="max-w-2xl mx-auto">
              <SignedIn>
                {error && (
                  <div className="mb-4 p-3 bg-red-900/20 border border-red-900 rounded-lg text-red-400">
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <label htmlFor="content" className={`block mb-2 text-sm font-medium ${textClass}`}>
                      Post Content
                    </label>
                    <textarea
                      id="content"
                      rows="6"
                      className={`w-full p-3 ${inputBgClass} border ${inputBorderClass} rounded-lg ${textClass} focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="Share information, updates, or resources..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="location" className={`block mb-2 text-sm font-medium ${textClass}`}>
                      Location (Optional)
                    </label>
                    <div className="relative">
                      <input
                        id="location"
                        type="text"
                        className={`w-full p-3 ${inputBgClass} border ${inputBorderClass} rounded-lg ${textClass} focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="Enter a location..."
                        value={location}
                        onChange={handleLocationChange}
                      />
                      {showSuggestions && (
                        <ul className={`absolute z-10 mt-1 w-full ${inputBgClass} border ${inputBorderClass} rounded-lg ${textClass}`}>
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
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className={`block mb-2 text-sm font-medium ${textClass}`}>
                      Add Media (Optional)
                    </label>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => document.getElementById('file-upload').click()}
                        className={`flex items-center justify-center p-3 ${inputBgClass} border ${inputBorderClass} rounded-lg ${buttonHoverClass} transition-colors duration-200`}
                      >
                        <span className={`${textClass} mr-2`}>Add Files</span>
                      </button>
                      <span className={`ml-4 text-sm ${secondaryTextClass}`}>{mediaFiles.length} file(s) selected</span>
                    </div>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                    />
                    {/* Preview of selected files */}
                    {mediaFiles.length > 0 && (
                      <div className="mt-4">
                        <h4 className={`text-sm font-medium ${secondaryTextClass} mb-2`}>Selected Files:</h4>
                        <div className="space-y-2">{renderPreviews()}</div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      color="primary"
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-green-600 hover:bg-green-500"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="mr-2 animate-spin h-4 w-4 border-t-2 border-white rounded-full"></div>
                          Posting...
                        </>
                      ) : (
                        'Post'
                      )}
                    </Button>
                  </div>
                </form>
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}