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
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
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
                          onChange={(e) => setRegion(e.target.value)}
                          placeholder="Enter your region or specific location"
                          required
                        />
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
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit Request'}
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