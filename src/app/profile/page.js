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
  
  // State for location suggestions
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  // State for profile navigation
  const [activeSection, setActiveSection] = useState('profile');
  
  // State for aid requests, posts, and comments
  const [aidRequests, setAidRequests] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [userComments, setUserComments] = useState([]);
  const [isLoadingAidRequests, setIsLoadingAidRequests] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  
  // State for user data and loading
  const [dbUser, setDbUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [userRole, setUserRole] = useState('normal');

  // State for editing posts and comments
  const [editModal, setEditModal] = useState({ isOpen: false, type: null, data: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, id: null });
  const [editContent, setEditContent] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

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
      
      // Log user data for debugging
      console.log('Clerk user data:', {
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl
      });
      
      // Fetch additional user data from our database
      fetchUserData();
      
      // Fetch user's aid requests, posts, and comments
      fetchUserAidRequests();
      fetchUserPosts();
      fetchUserComments();
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

  // Fetch user's aid requests
  const fetchUserAidRequests = async () => {
    setIsLoadingAidRequests(true);
    try {
      const response = await fetch('/api/aid-requests?user=true');
      if (response.ok) {
        const data = await response.json();
        setAidRequests(data);
      }
    } catch (error) {
      console.error('Error fetching aid requests:', error);
    } finally {
      setIsLoadingAidRequests(false);
    }
  };
  
  // Fetch user's posts
  const fetchUserPosts = async () => {
    setIsLoadingPosts(true);
    try {
      const response = await fetch(`/api/posts?user=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        // Ensure userPosts is always an array
        setUserPosts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
      // Set to empty array on error
      setUserPosts([]);
    } finally {
      setIsLoadingPosts(false);
    }
  };
  
  // Fetch user's comments
  const fetchUserComments = async () => {
    setIsLoadingComments(true);
    try {
      const response = await fetch(`/api/posts/comments?user=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setUserComments(data);
      }
    } catch (error) {
      console.error('Error fetching user comments:', error);
    } finally {
      setIsLoadingComments(false);
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

  // Handle location input and fetch suggestions
  const handleLocationChange = (e) => {
    const { value } = e.target;
    
    // Update form data
    setFormData(prevData => ({
      ...prevData,
      profile_location: value
    }));
    
    // Fetch suggestions if the input has at least 2 characters
    if (value.length > 1) {
      setIsLoadingSuggestions(true);
      fetchLocationSuggestions(value);
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
    setFormData(prevData => ({
      ...prevData,
      profile_location: suggestion
    }));
    setShowSuggestions(false);
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
    
    // Log the form data being submitted for debugging
    console.log('Submitting form data:', formData);
    
    // Validate required fields before submission
    if (!formData.firstName || !formData.lastName || !formData.username) {
      setMessage({ 
        type: 'error', 
        text: 'Please fill in all required fields: First Name, Last Name, and Username.' 
      });
      setIsSaving(false);
      return;
    }
    
    try {
      // Update user data in our database with all form data
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
        // Try to get more error details
        const errorData = await response.json().catch(() => ({}));
        setMessage({ 
          type: 'error', 
          text: errorData.message || 'Failed to update profile. Please try again.' 
        });
      }
      
      // Update Clerk user data only if we have values
      if (formData.firstName || formData.lastName || formData.username) {
        try {
          await user.update({
            firstName: formData.firstName || user.firstName,
            lastName: formData.lastName || user.lastName,
            username: formData.username || user.username
          });
        } catch (clerkError) {
          console.error('Error updating Clerk user:', clerkError);
          setMessage({ 
            type: 'warning', 
            text: 'Profile partially updated. Some changes could not be saved to Clerk.' 
          });
        }
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

  // Handle edit post
  const handleEditPost = (post) => {
    setEditContent(post.content);
    setEditModal({ isOpen: true, type: 'post', data: post });
  };
  
  // Handle edit comment
  const handleEditComment = (comment) => {
    setEditContent(comment.content);
    setEditModal({ isOpen: true, type: 'comment', data: comment });
  };
  
  // Handle delete post
  const handleDeletePost = (postId) => {
    setDeleteModal({ isOpen: true, type: 'post', id: postId });
  };
  
  // Handle delete comment
  const handleDeleteComment = (commentId) => {
    setDeleteModal({ isOpen: true, type: 'comment', id: commentId });
  };
  
  // Save edited content
  const saveEdit = async () => {
    setIsSubmittingEdit(true);
    
    try {
      if (editModal.type === 'post') {
        // Save edited post
        const response = await fetch(`/api/posts/${editModal.data._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: editContent }),
        });
        
        if (response.ok) {
          // Refresh posts
          fetchUserPosts();
        }
      } else if (editModal.type === 'comment') {
        // Save edited comment
        const response = await fetch(`/api/posts/comments/${editModal.data._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: editContent }),
        });
        
        if (response.ok) {
          // Refresh comments
          fetchUserComments();
        }
      }
    } catch (error) {
      console.error('Error saving edit:', error);
    } finally {
      setIsSubmittingEdit(false);
      closeEditModal();
    }
  };
  
  // Confirm delete
  const confirmDelete = async () => {
    try {
      if (deleteModal.type === 'post') {
        // Delete post
        const response = await fetch(`/api/posts/${deleteModal.id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          // Refresh posts
          fetchUserPosts();
        }
      } else if (deleteModal.type === 'comment') {
        // Delete comment
        const response = await fetch(`/api/posts/comments/${deleteModal.id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          // Refresh comments
          fetchUserComments();
        }
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      closeDeleteModal();
    }
  };
  
  // Close edit modal
  const closeEditModal = () => {
    setEditModal({ isOpen: false, type: null, data: null });
    setEditContent('');
  };
  
  // Close delete modal
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, type: null, id: null });
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
            {/* Profile navigation menu */}
            <div className="mb-6 flex bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
              <button 
                className={`flex-1 py-3 px-4 text-center transition ${
                  activeSection === 'profile' 
                    ? 'bg-blue-900/20 text-blue-400 border-b-2 border-blue-500' 
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
                }`}
                onClick={() => setActiveSection('profile')}
              >
                Profile
              </button>
              <button 
                className={`flex-1 py-3 px-4 text-center transition ${
                  activeSection === 'aid' 
                    ? 'bg-blue-900/20 text-blue-400 border-b-2 border-blue-500' 
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
                }`}
                onClick={() => setActiveSection('aid')}
              >
                Aid Requests
              </button>
              <button 
                className={`flex-1 py-3 px-4 text-center transition ${
                  activeSection === 'content' 
                    ? 'bg-blue-900/20 text-blue-400 border-b-2 border-blue-500' 
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
                }`}
                onClick={() => setActiveSection('content')}
              >
                Your Content
              </button>
            </div>

            {/* Edit Modal */}
            {editModal.isOpen && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                <div className="bg-zinc-900 rounded-lg w-full max-w-lg p-6 relative">
                  <button 
                    onClick={closeEditModal}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <h2 className="text-xl font-semibold mb-4 text-[#ededed]">
                    Edit {editModal.type === 'post' ? 'Post' : 'Reply'}
                  </h2>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={5}
                    className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-[#ededed] focus:ring-blue-500 focus:border-blue-500 mb-4"
                    placeholder={`Write your ${editModal.type === 'post' ? 'post' : 'reply'} content...`}
                  />
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={closeEditModal}
                      className="px-4 py-2 border border-zinc-700 rounded-md bg-zinc-800 text-[#ededed] hover:bg-zinc-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveEdit}
                      disabled={isSubmittingEdit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                    >
                      {isSubmittingEdit ? (
                        <>
                          <div className="h-4 w-4 mr-2 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
                          Saving...
                        </>
                      ) : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                <div className="bg-zinc-900 rounded-lg w-full max-w-md p-6">
                  <h2 className="text-xl font-semibold mb-2 text-[#ededed]">Confirm Deletion</h2>
                  <p className="text-zinc-400 mb-6">
                    Are you sure you want to delete this {deleteModal.type === 'post' ? 'post' : 'reply'}? This action cannot be undone.
                  </p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={closeDeleteModal}
                      className="px-4 py-2 border border-zinc-700 rounded-md bg-zinc-800 text-[#ededed] hover:bg-zinc-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Profile Section */}
            {activeSection === 'profile' && (
              <>
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
                            onChange={handleLocationChange}
                            placeholder="Your location (city, region, etc.)"
                          />
                          {showSuggestions && (
                            <ul className="mt-2 bg-zinc-900 border border-zinc-700 rounded-md">
                              {locationSuggestions.map((suggestion, index) => (
                                <li 
                                  key={index} 
                                  className="p-2 hover:bg-zinc-800 cursor-pointer"
                                  onClick={() => selectSuggestion(suggestion)}
                                >
                                  {suggestion}
                                </li>
                              ))}
                            </ul>
                          )}
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
                            className="w-full md:w-auto px-6 py-2 bg-green-900/20 text-green-400 border border-green-700 hover:bg-green-800/30 rounded-md transition"
                          >
                            {isSaving ? (
                              <div className="flex items-center">
                                <div className="h-4 w-4 mr-2 rounded-full border-2 border-t-transparent border-green-300 animate-spin"></div>
                                Saving...
                              </div>
                            ) : 'Save Profile'}
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
                  
                  {dbUser && (
                    <div className="mb-6">
                      <p className="text-sm font-medium mb-1 text-zinc-400">Role</p>
                      <p className="text-[#ededed]">{dbUser.role || 'Normal User'}</p>
                    </div>
                  )}
                  
                  <div className="border-t border-zinc-800 pt-6 flex flex-col md:flex-row justify-between">
                    <Button 
                      onClick={() => openUserProfile()}
                      className="bg-zinc-800 hover:bg-zinc-700 transition px-6 py-2 rounded-md mb-4 md:mb-0"
                    >
                      Manage Account Settings
                    </Button>

                    {userRole === 'normal' && (
                      <Button 
                        onClick={() => router.push('/profile/request-upgrade')}
                        className="bg-blue-900/20 text-blue-400 border border-blue-700 hover:bg-blue-800/30 transition px-6 py-2 rounded-md"
                      >
                        Request Special User Access
                      </Button>
                    )}
                  </div>
                </Card>
              </>
            )}
            
            {/* Aid Requests Section */}
            {activeSection === 'aid' && (
              <Card className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-[#ededed]">Your Aid Requests</h2>
                
                {isLoadingAidRequests ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#ededed]"></div>
                  </div>
                ) : aidRequests.length === 0 ? (
                  <div className="bg-blue-900/20 text-blue-300 p-4 rounded-md">
                    <p>You haven't made any aid requests yet.</p>
                    <Button 
                      className="mt-4 bg-blue-900/30 text-blue-300 border border-blue-700 hover:bg-blue-800/30 px-4 py-2 rounded-md transition"
                      onClick={() => router.push('/apply-aid')}
                    >
                      Request Aid
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {aidRequests.map((request) => (
                      <div 
                        key={request._id} 
                        className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-[#ededed]">Request for {request.region}</h3>
                          <span className={`px-3 py-1 text-xs rounded-full ${
                            request.status === 'approved' ? 'bg-green-900/20 text-green-400 border border-green-800' :
                            request.status === 'denied' ? 'bg-red-900/20 text-red-400 border border-red-800' :
                            request.status === 'shipped' ? 'bg-blue-900/20 text-blue-400 border border-blue-800' :
                            request.status === 'delivered' ? 'bg-purple-900/20 text-purple-400 border border-purple-800' :
                            'bg-yellow-900/20 text-yellow-400 border border-yellow-800'
                          }`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400 mb-2">
                          Requested on {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                        {request.adminNote && (
                          <div className="mt-2 p-2 bg-zinc-800 rounded border border-zinc-700">
                            <p className="text-sm text-zinc-300">
                              <span className="font-medium">Admin note:</span> {request.adminNote}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
            
            {/* Posts and Comments Section */}
            {activeSection === 'content' && (
              <Card className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-[#ededed]">Your Content</h2>
                
                {/* Tabs for Posts and Comments */}
                <div className="flex border-b border-zinc-800 mb-4">
                  <button
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === 'posts' 
                        ? 'text-[#ededed] border-b-2 border-blue-500' 
                        : 'text-zinc-400 hover:text-zinc-300'
                    }`}
                    onClick={() => setActiveTab('posts')}
                  >
                    Posts
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === 'comments' 
                        ? 'text-[#ededed] border-b-2 border-blue-500' 
                        : 'text-zinc-400 hover:text-zinc-300'
                    }`}
                    onClick={() => setActiveTab('comments')}
                  >
                    Replies
                  </button>
                </div>
                
                {/* Posts Tab Content */}
                {activeTab === 'posts' && (
                  <>
                    {isLoadingPosts ? (
                      <div className="flex justify-center py-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#ededed]"></div>
                      </div>
                    ) : userPosts.length === 0 ? (
                      <div className="bg-blue-900/20 text-blue-300 p-4 rounded-md">
                        <p>You haven't created any posts yet.</p>
                        <Button 
                          className="mt-4 bg-blue-900/30 text-blue-300 border border-blue-700 hover:bg-blue-800/30 px-4 py-2 rounded-md transition"
                          onClick={() => router.push('/create-post')}
                        >
                          Create Post
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {userPosts.map((post) => (
                          <div 
                            key={post._id} 
                            className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1 mr-4">
                                <p className="text-sm text-zinc-400 mb-1">
                                  {new Date(post.createdAt).toLocaleDateString()} 
                                  {post.location && ` • ${post.location}`}
                                </p>
                                <p className="text-[#ededed] line-clamp-2">{post.content}</p>
                                <div className="mt-2 flex text-xs text-zinc-500 space-x-4">
                                  <span className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                    </svg>
                                    {post.likes?.length || 0}
                                  </span>
                                  <span className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                                    </svg>
                                    {/* This would need to be updated to show actual comment count */}
                                    0
                                  </span>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => router.push(`/posts/${post._id}`)}
                                  className="p-2 text-zinc-400 hover:text-[#ededed] transition"
                                  title="View"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                <button 
                                  onClick={() => handleEditPost(post)}
                                  className="p-2 text-zinc-400 hover:text-blue-400 transition"
                                  title="Edit"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button 
                                  onClick={() => handleDeletePost(post._id)}
                                  className="p-2 text-zinc-400 hover:text-red-400 transition"
                                  title="Delete"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                
                {/* Comments Tab Content */}
                {activeTab === 'comments' && (
                  <>
                    {isLoadingComments ? (
                      <div className="flex justify-center py-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#ededed]"></div>
                      </div>
                    ) : userComments.length === 0 ? (
                      <div className="bg-blue-900/20 text-blue-300 p-4 rounded-md">
                        <p>You haven't replied to any posts yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {userComments.map((comment) => (
                          <div 
                            key={comment._id} 
                            className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1 mr-4">
                                <p className="text-sm text-zinc-400 mb-1">
                                  {new Date(comment.createdAt).toLocaleDateString()}
                                  {comment.postTitle && ` • On: ${comment.postTitle}`}
                                </p>
                                <p className="text-[#ededed]">{comment.content}</p>
                              </div>
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => router.push(`/posts/${comment.postId}`)}
                                  className="p-2 text-zinc-400 hover:text-[#ededed] transition"
                                  title="View"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                <button 
                                  onClick={() => handleEditComment(comment)}
                                  className="p-2 text-zinc-400 hover:text-blue-400 transition"
                                  title="Edit"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button 
                                  onClick={() => handleDeleteComment(comment._id)}
                                  className="p-2 text-zinc-400 hover:text-red-400 transition"
                                  title="Delete"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </Card>
            )}
          </Container>
        </main>
      </div>
    </div>
  );
}