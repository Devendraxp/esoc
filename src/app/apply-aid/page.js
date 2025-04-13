'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';
import Container from '../../components/Container';
import Sidebar from '../../components/Sidebar';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Card from '../../components/Card';
import ThemeToggle from '../../components/ThemeToggle';

export default function ApplyForAid() {
  const router = useRouter();
  
  // State for form data
  const [region, setRegion] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Handle location input and fetch suggestions
  const handleLocationChange = (e) => {
    const inputValue = e.target.value;
    setRegion(inputValue);
    
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
    setRegion(suggestion);
    setShowSuggestions(false);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!region.trim()) {
      setError('Region is required');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const response = await fetch('/api/aid-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          region,
          additionalInfo: additionalInfo.trim() || undefined,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit aid request');
      }
      
      // Clear form after successful submission
      setRegion('');
      setAdditionalInfo('');
      
      // Show success message
      setSuccessMessage('Your aid request has been submitted successfully. It will be reviewed by administrators shortly.');
      
    } catch (error) {
      setError(error.message || 'Failed to submit aid request. Please try again.');
      console.error('Error submitting aid request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <SignedIn>
        <div className="flex min-h-screen bg-[#0a0a0a] text-[#ededed]">
          {/* Sidebar */}
          <Sidebar />

          {/* Main content */}
          <div className="flex-1 ml-64">
            <header className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-[#ededed]">Apply for Aid</h1>
              <ThemeToggle />
            </header>

            <main className="p-8">
              <Container className="py-6">
                <Card className="mb-6">
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-[#ededed] mb-3">Request Emergency Aid</h2>
                    <p className="text-zinc-400">
                      Use this form to request emergency assistance for your region. Once submitted, 
                      your request will be reviewed by our team and processed accordingly.
                    </p>
                  </div>
                  
                  {successMessage ? (
                    <div className="bg-green-900/20 text-green-300 p-6 rounded-md mb-6">
                      <p className="font-medium">{successMessage}</p>
                      <Button 
                        className="mt-6"
                        onClick={() => router.push('/')}
                      >
                        Return to Home
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit}>
                      <div className="mb-6">
                        <label htmlFor="region" className="block text-sm font-medium text-[#ededed] mb-2">
                          Region/Location *
                        </label>
                        <Input
                          id="region"
                          value={region}
                          onChange={handleLocationChange}
                          placeholder="Enter your region or specific location"
                          required
                        />
                        {showSuggestions && (
                          <ul className="mt-2 bg-zinc-800 border border-zinc-700 rounded-md text-[#ededed]">
                            {locationSuggestions.map((suggestion, index) => (
                              <li 
                                key={index} 
                                className="px-3 py-2 cursor-pointer hover:bg-zinc-700"
                                onClick={() => selectSuggestion(suggestion)}
                              >
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        )}
                        {isLoadingSuggestions && (
                          <p className="mt-2 text-xs text-zinc-400">Loading suggestions...</p>
                        )}
                        <p className="mt-2 text-xs text-zinc-400">
                          Be as specific as possible (e.g., "East District, Building 4")
                        </p>
                      </div>
                      
                      <div className="mb-8">
                        <label htmlFor="additionalInfo" className="block text-sm font-medium text-[#ededed] mb-2">
                          Additional Information
                        </label>
                        <textarea
                          id="additionalInfo"
                          value={additionalInfo}
                          onChange={(e) => setAdditionalInfo(e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-800 text-[#ededed] focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Describe your situation and specific needs (optional)"
                        />
                      </div>
                      
                      {error && (
                        <div className="mb-6 bg-red-900/20 text-red-300 p-4 rounded-md text-sm">
                          {error}
                        </div>
                      )}
                      
                      <div className="flex justify-end space-x-4 mt-8">
                        <Button
                          variant="secondary"
                          type="button"
                          onClick={() => router.push('/')}
                          className="px-6 py-2 border border-zinc-700 rounded-md bg-zinc-800/60 hover:bg-zinc-700/60 transition"
                        >
                          Cancel
                        </Button>
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
                              Submitting...
                            </div>
                          ) : 'Submit Request'}
                        </Button>
                      </div>
                    </form>
                  )}
                </Card>
              </Container>
            </main>
          </div>
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}