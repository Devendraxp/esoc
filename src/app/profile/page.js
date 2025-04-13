'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useUser, useClerk } from '@clerk/nextjs';

import Container from '../../components/Container';
import Sidebar from '../../components/Sidebar';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import ThemeToggle from '../../components/ThemeToggle';

export default function ProfilePage() {
  const router = useRouter();
  const { isSignedIn, user, isLoaded } = useUser();
  const { openUserProfile } = useClerk();
  
  // Profile form state
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    profile_location: '',
    bio: ''
  });
  
  // State for user data and loading
  const [dbUser, setDbUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [userRole, setUserRole] = useState('normal');

  // Load user data when component mounts
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/');
      return;
    }

    if (isLoaded && isSignedIn) {
      // Set initial form data from Clerk user
      setFormData({
        username: user.username || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        profile_location: '',
        bio: ''
      });
      
      // Fetch additional user data from our database
      fetchUserData();
    }
  }, [isLoaded, isSignedIn, user]);

  // Fetch user data from our database
  const fetchUserData = async () => {
    try {
      const response = await fetch(`/api/users/${user.id}`);
      if (response.ok) {
        const userData = await response.json();
        setDbUser(userData);
        setUserRole(userData.role || 'normal'); // Set user role
        
        // Update form with data from our database
        setFormData(prevData => ({
          ...prevData,
          profile_location: userData.profile_location || '',
          bio: userData.bio || ''
        }));
      }
      
      // Fetch user role from auth/me endpoint as backup
      try {
        const authResponse = await fetch('/api/auth/me');
        if (authResponse.ok) {
          const authData = await authResponse.json();
          setUserRole(authData.role);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
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

  // Handle profile image update
  const handleProfileImageUpdate = () => {
    openUserProfile({
      appearance: {
        elements: {
          rootBox: "w-full h-full",
          card: "mx-auto my-8 bg-zinc-900 border-zinc-800 text-white",
          navbar: "hidden",
          navbarMobileMenuButton: "hidden",
          headerTitle: "text-white",
          headerSubtitle: "text-zinc-400",
          formButtonPrimary: "bg-primary hover:bg-primary/80",
          formButtonReset: "text-white",
          formFieldLabel: "text-white",
          formFieldInput: "bg-zinc-800 border-zinc-700 text-white",
          footerActionLink: "text-primary",
          avatarBox: "border-2 border-primary",
          avatarImageActionsUpload: "text-primary",
        }
      }
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Update user data in our database
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          profileImageUrl: user.imageUrl
        })
      });
      
      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: 'Profile updated successfully!' 
        });
        fetchUserData();
      } else {
        setMessage({ 
          type: 'error', 
          text: 'Failed to update profile. Please try again.' 
        });
      }
      
      // Update Clerk user data (name and username)
      try {
        await user.update({
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username
        });
      } catch (clerkError) {
        console.error('Error updating Clerk user:', clerkError);
        setMessage({ 
          type: 'warning', 
          text: 'Profile partially updated. Some changes could not be saved.' 
        });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ 
        type: 'error', 
        text: 'An error occurred. Please try again.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0a] text-[#ededed]">
        <Sidebar userRole={userRole} />
        <div className="flex-1 ml-64 p-8">
          <Container>
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ededed]"></div>
            </div>
          </Container>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0a] text-[#ededed]">
        <Sidebar userRole={userRole} />
        <div className="flex-1 ml-64 p-8">
          <Container>
            <Card className="bg-red-900/20 text-red-300 border border-red-800">
              <p className="text-lg">You need to be signed in to view your profile.</p>
              <Button 
                className="mt-6" 
                onClick={() => router.push('/')}
              >
                Return to Home
              </Button>
            </Card>
          </Container>
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
          <h1 className="text-2xl font-bold text-[#ededed]">Your Profile</h1>
          <ThemeToggle />
        </header>

        <main className="p-8">
          <Container className="py-6">
            <Card className="mb-8">
              <div className="flex flex-col md:flex-row md:gap-8 items-center md:items-start">
                {/* Profile image section */}
                <div className="mb-6 md:mb-0 flex flex-col items-center">
                  <div className="relative h-32 w-32 rounded-full overflow-hidden border-2 border-primary mb-4">
                    {user.imageUrl ? (
                      <Image
                        src={user.imageUrl}
                        alt={user.fullName || "Profile"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    onClick={handleProfileImageUpdate}
                    className="text-sm mb-2"
                  >
                    Change Picture
                  </Button>
                  
                  <p className="text-xs text-zinc-400">
                    Member since: {dbUser?.joinedAt 
                      ? new Date(dbUser.joinedAt).toLocaleDateString() 
                      : new Date(user.createdAt).toLocaleDateString()
                    }
                  </p>
                </div>
                
                {/* Profile form section */}
                <div className="flex-1 w-full">
                  {message.text && (
                    <div className={`mb-6 p-3 rounded-md text-sm ${
                      message.type === 'success' ? 'bg-green-900/20 text-green-300 border border-green-800' :
                      message.type === 'error' ? 'bg-red-900/20 text-red-300 border border-red-800' :
                      'bg-yellow-900/20 text-yellow-300 border border-yellow-800'
                    }`}>
                      {message.text}
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                          First Name
                        </label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          placeholder="First Name"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                          Last Name
                        </label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          placeholder="Last Name"
                        />
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="username" className="block text-sm font-medium mb-1">
                        Username
                      </label>
                      <Input
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Username"
                      />
                      <p className="mt-1 text-xs text-zinc-400">
                        This will be used to identify you on the platform.
                      </p>
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="profile_location" className="block text-sm font-medium mb-1">
                        Location
                      </label>
                      <Input
                        id="profile_location"
                        name="profile_location"
                        value={formData.profile_location}
                        onChange={handleChange}
                        placeholder="Your location (city, region, etc.)"
                      />
                      <p className="mt-1 text-xs text-zinc-400">
                        This helps others know your general location for emergency coordination.
                      </p>
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="bio" className="block text-sm font-medium mb-1">
                        Bio
                      </label>
                      <textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Tell others a bit about yourself..."
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        maxLength={160}
                      />
                      <p className="mt-1 text-xs text-zinc-400">
                        Maximum 160 characters.
                      </p>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={isSaving}
                        className="w-full md:w-auto"
                      >
                        {isSaving ? 'Saving...' : 'Save Profile'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </Card>
            
            <Card className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-[#ededed]">Account Information</h2>
              
              <div className="mb-4">
                <p className="text-sm font-medium mb-1 text-zinc-400">Email Address</p>
                <p className="text-[#ededed]">{user.primaryEmailAddress?.emailAddress || 'No email address'}</p>
              </div>
              
              <div className="mb-6">
                <p className="text-sm font-medium mb-1 text-zinc-400">Account ID</p>
                <p className="text-[#ededed] text-sm font-mono">{user.id}</p>
              </div>
              
              <div className="border-t border-zinc-800 pt-6">
                <Button 
                  onClick={() => openUserProfile()}
                  className="bg-zinc-800 hover:bg-zinc-700 transition"
                >
                  Manage Account Settings
                </Button>
              </div>
            </Card>
          </Container>
        </main>
      </div>
    </div>
  );
}