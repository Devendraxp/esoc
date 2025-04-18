'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

import Sidebar from '../../../components/Sidebar';
import Button from '../../../components/Button';
import Card from '../../../components/Card';
import Input from '../../../components/Input';
import ThemeToggle from '../../../components/ThemeToggle';

export default function RequestUpgradePage() {
  const router = useRouter();
  const { isSignedIn, user, isLoaded } = useUser();
  
  // Form state
  const [formData, setFormData] = useState({
    organization: '',
    reason: ''
  });
  
  // State for loading and messages
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [existingRequest, setExistingRequest] = useState(null);

  // Check if user is authenticated and their role
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/');
      return;
    }

    if (isLoaded && isSignedIn) {
      checkUserRole();
      checkExistingRequest();
    }
  }, [isLoaded, isSignedIn, user]);

  // Check user role and existing request
  const checkUserRole = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUserRole(data.role);
        
        // If user is already a special user or admin, redirect to profile
        if (data.role === 'special' || data.role === 'admin') {
          setMessage({
            type: 'info',
            text: 'Your account already has elevated privileges.'
          });
          setTimeout(() => {
            router.push('/profile');
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check if user already has a pending upgrade request
  const checkExistingRequest = async () => {
    try {
      const response = await fetch('/api/users/upgrade-request');
      if (response.ok) {
        const data = await response.json();
        if (data.upgradeRequest) {
          setExistingRequest(data.upgradeRequest);
        }
      }
    } catch (error) {
      console.error('Error checking existing upgrade request:', error);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    
    // Validate form data
    if (!formData.organization.trim()) {
      setMessage({
        type: 'error',
        text: 'Organization name is required'
      });
      setIsSubmitting(false);
      return;
    }
    
    try {
      const response = await fetch('/api/users/upgrade-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessage({
          type: 'success',
          text: 'Your upgrade request has been submitted successfully! An admin will review your request.'
        });
        setExistingRequest(data.upgradeRequest);
      } else {
        const errorData = await response.json();
        setMessage({
          type: 'error',
          text: errorData.message || 'Failed to submit upgrade request. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error submitting upgrade request:', error);
      setMessage({
        type: 'error',
        text: 'An error occurred. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0a] text-[#ededed]">
        <Sidebar userRole={userRole} />
        <div className="flex-1 ml-64 p-8">
          <div>
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ededed]"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0a] text-[#ededed]">
        <Sidebar userRole={userRole} />
        <div className="flex-1 ml-64 p-8">
          <div>
            <Card className="bg-red-900/20 text-red-300 border border-red-800">
              <p className="text-lg">You need to be signed in to request an account upgrade.</p>
              <Button 
                className="mt-6" 
                onClick={() => router.push('/')}
              >
                Return to Home
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-[#ededed]">
      {/* Sidebar */}
      <Sidebar userRole={userRole} />

      {/* Main content */}
      <div className="flex-1 ml-64">
        <header className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center">
          <button 
            onClick={() => router.back()}
            className="text-[#ededed] hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-[#ededed]">Request Special Access</h1>
          <ThemeToggle />
        </header>

        <main className="p-8">
          <div className="py-6">
            {message.text && (
              <Card className={`mb-6 ${
                message.type === 'success' ? 'bg-green-900/20 text-green-300 border border-green-800' :
                message.type === 'error' ? 'bg-red-900/20 text-red-300 border border-red-800' :
                'bg-blue-900/20 text-blue-300 border border-blue-800'
              }`}>
                <p>{message.text}</p>
                {message.type === 'success' && (
                  <Button 
                    className="mt-4 bg-green-900/30 text-green-300 border border-green-700 hover:bg-green-800/30"
                    onClick={() => router.push('/profile')}
                  >
                    Return to Profile
                  </Button>
                )}
              </Card>
            )}
            
            {existingRequest ? (
              <Card>
                <h2 className="text-xl font-semibold mb-4 text-[#ededed]">Existing Upgrade Request</h2>
                <div className="mb-4">
                  <p className="text-sm font-medium mb-1 text-zinc-400">Status</p>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm ${
                    existingRequest.status === 'approved' ? 'bg-green-900/20 text-green-400 border border-green-800' :
                    existingRequest.status === 'rejected' ? 'bg-red-900/20 text-red-400 border border-red-800' :
                    'bg-yellow-900/20 text-yellow-400 border border-yellow-800'
                  }`}>
                    {existingRequest.status.charAt(0).toUpperCase() + existingRequest.status.slice(1)}
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm font-medium mb-1 text-zinc-400">Organization</p>
                  <p className="text-[#ededed]">{existingRequest.organization}</p>
                </div>
                
                {existingRequest.reason && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-1 text-zinc-400">Reason</p>
                    <p className="text-[#ededed]">{existingRequest.reason}</p>
                  </div>
                )}
                
                <div className="mb-6">
                  <p className="text-sm font-medium mb-1 text-zinc-400">Requested On</p>
                  <p className="text-[#ededed]">{new Date(existingRequest.requestedAt).toLocaleDateString()}</p>
                </div>
                
                {existingRequest.status === 'pending' ? (
                  <div className="bg-blue-900/20 text-blue-300 p-4 rounded-md mb-4">
                    <p>Your request is currently being reviewed by an administrator. You'll be notified once a decision has been made.</p>
                  </div>
                ) : existingRequest.status === 'approved' ? (
                  <div className="bg-green-900/20 text-green-300 p-4 rounded-md mb-4">
                    <p>Congratulations! Your request has been approved. You now have special user privileges.</p>
                  </div>
                ) : (
                  <div className="bg-red-900/20 text-red-300 p-4 rounded-md mb-4">
                    <p>Unfortunately, your request was not approved. You can submit a new request with additional information if needed.</p>
                  </div>
                )}
                
                <Button 
                  onClick={() => router.push('/profile')}
                  className="bg-zinc-800 hover:bg-zinc-700 transition"
                >
                  Return to Profile
                </Button>
              </Card>
            ) : (
              <Card>
                <h2 className="text-xl font-semibold mb-4 text-[#ededed]">Request Special User Access</h2>
                <p className="text-zinc-400 mb-6">
                  Special users have enhanced capabilities to help during emergencies, including approving and processing aid requests from other users.
                </p>
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <label htmlFor="organization" className="block text-sm font-medium mb-1">
                      Organization <span className="text-red-400">*</span>
                    </label>
                    <Input
                      id="organization"
                      name="organization"
                      value={formData.organization}
                      onChange={handleChange}
                      placeholder="Enter your organization or institution name"
                      required
                    />
                    <p className="mt-1 text-xs text-zinc-400">
                      Name of the organization, NGO, government agency, or community group you represent.
                    </p>
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="reason" className="block text-sm font-medium mb-1">
                      Reason for Request
                    </label>
                    <textarea
                      id="reason"
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Explain why you need special user access and how you plan to help..."
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                    <p className="mt-1 text-xs text-zinc-400">
                      Please provide details about your role and how you intend to help during emergencies.
                    </p>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      type="button" 
                      onClick={() => router.push('/profile')}
                      className="bg-zinc-800 hover:bg-zinc-700 transition mr-4"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="bg-blue-900/20 text-blue-400 border border-blue-700 hover:bg-blue-800/30"
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
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}