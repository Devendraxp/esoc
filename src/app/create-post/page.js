'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from '@clerk/nextjs';
import Container from '../../components/Container';
import Sidebar from '../../components/Sidebar';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Card from '../../components/Card';
import ThemeToggle from '../../components/ThemeToggle';

export default function CreatePost() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const userId = isLoaded && isSignedIn ? user.id : null;
  
  // State for user role
  const [userRole, setUserRole] = useState('normal');
  
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
      <div key={index} className="relative mb-4 p-2 bg-zinc-800 rounded-lg">
        <div className="flex items-center">
          {item.type === 'image' ? (
            <img src={item.url} alt={item.name} className="w-16 h-16 object-cover rounded mr-2" />
          ) : (
            <div className="w-16 h-16 flex items-center justify-center bg-zinc-700 rounded mr-2">
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
  
  return (
    <Container noPadding={true} fullWidth={true} className="p-0 overflow-hidden rounded-none border-0">
      <div className="flex">
        <Sidebar userRole={userRole} />
        
        <main className="flex-1 pl-64 py-8 pr-4 sm:pr-6 lg:pr-8">
          <SignedIn>
            <div className="mb-6 flex justify-between items-center px-4 sm:px-6 lg:px-8">
              <h1 className="text-2xl font-semibold text-[#ededed]">Create Post</h1>
              <ThemeToggle />
            </div>
            
            <Card className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
              {error && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-900 rounded-lg text-red-400">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label htmlFor="content" className="block mb-2 text-sm font-medium text-[#ededed]">
                    Post Content
                  </label>
                  <textarea
                    id="content"
                    rows="6"
                    className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-[#ededed] focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Share information, updates, or resources..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label htmlFor="location" className="block mb-2 text-sm font-medium text-[#ededed]">
                    Location (Optional)
                  </label>
                  <div className="relative">
                    <input
                      id="location"
                      type="text"
                      className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-[#ededed] focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter a location..."
                      value={location}
                      onChange={handleLocationChange}
                    />
                    {showSuggestions && (
                      <ul className="absolute z-10 mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg text-[#ededed]">
                        {locationSuggestions.map((suggestion, index) => (
                          <li 
                            key={index} 
                            className="p-2 hover:bg-zinc-700 cursor-pointer"
                            onClick={() => selectSuggestion(suggestion)}
                          >
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block mb-2 text-sm font-medium text-[#ededed]">
                    Add Media (Optional)
                  </label>
                  <div className="flex items-center">
                    <label className="flex items-center px-4 py-2 bg-zinc-700 text-[#ededed] rounded-lg cursor-pointer hover:bg-zinc-600 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Add Files
                      <input 
                        type="file" 
                        multiple 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                      />
                    </label>
                    <span className="ml-4 text-sm text-[#a1a1aa]">
                      {mediaFiles.length} file{mediaFiles.length !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                  
                  <div className="mt-4">
                    {renderPreviews()}
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className={`px-6 py-2 border rounded-md transition ${
                      isSubmitting 
                        ? 'bg-blue-900/30 text-blue-300 border-blue-700' 
                        : 'bg-green-900/20 text-green-400 border-green-700 hover:bg-green-800/30'
                    }`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="h-4 w-4 mr-2 rounded-full border-2 border-t-transparent border-blue-300 animate-spin"></div>
                        Posting...
                      </div>
                    ) : 'Post'}
                  </Button>
                </div>
              </form>
            </Card>
          </SignedIn>
          
          <SignedOut>
            <RedirectToSignIn />
          </SignedOut>
        </main>
      </div>
    </Container>
  );
}