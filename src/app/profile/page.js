'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useUser, useClerk } from '@clerk/nextjs';
import { useTheme } from 'next-themes';

import Sidebar from '../../components/Sidebar';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import ThemeToggle from '../../components/ThemeToggle';

export default function ProfilePage() {
  const router = useRouter();
  const { isSignedIn, user, isLoaded } = useUser();
  const { openUserProfile } = useClerk();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Fix for hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // State for mobile detection
  const [isMobileView, setIsMobileView] = useState(false);

  // Detect mobile view
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

      // Fetch user's aid requests, posts, and comments
      fetchUserAidRequests();
      fetchUserPosts();
      fetchUserComments();
    }
  }, [isLoaded, isSignedIn, user]);

  // Theme-aware style classes
  const bgClass = theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50';
  const textClass = theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800';
  const secondaryTextClass = theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600';
  const headerBgClass = theme === 'dark' ? 'bg-zinc-900' : 'bg-white';
  const borderClass = theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200';
  const navBgClass = theme === 'dark' ? 'bg-zinc-900' : 'bg-white';
  const navItemClass = theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300' : 'text-zinc-500 hover:bg-gray-100 hover:text-zinc-700';
  const activeNavBgClass = theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50';
  const activeNavTextClass = theme === 'dark' ? 'text-blue-400' : 'text-blue-600';
  const activeNavBorderClass = theme === 'dark' ? 'border-blue-500' : 'border-blue-600';
  const cardBgClass = theme === 'dark' ? 'bg-zinc-900' : 'bg-white';
  const modalBgClass = theme === 'dark' ? 'bg-zinc-900' : 'bg-white';
  const inputBgClass = theme === 'dark' ? 'bg-zinc-800' : 'bg-white';
  const inputBorderClass = theme === 'dark' ? 'border-zinc-700' : 'border-zinc-300';
  const tabHoverClass = theme === 'dark' ? 'hover:text-zinc-300' : 'hover:text-zinc-700';
  const spinnerClass = theme === 'dark' ? 'border-zinc-200' : 'border-zinc-700';
  const deleteButtonClass = theme === 'dark' ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600';

  // The rest of your functions remain the same
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

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

  const selectSuggestion = (suggestion) => {
    setFormData(prevData => ({
      ...prevData,
      profile_location: suggestion
    }));
    setShowSuggestions(false);
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });

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

  const handleEditPost = (post) => {
    setEditContent(post.content);
    setEditModal({ isOpen: true, type: 'post', data: post });
  };

  const handleEditComment = (comment) => {
    setEditContent(comment.content);
    setEditModal({ isOpen: true, type: 'comment', data: comment });
  };

  const handleDeletePost = (postId) => {
    setDeleteModal({ isOpen: true, type: 'post', id: postId });
  };

  const handleDeleteComment = (commentId) => {
    setDeleteModal({ isOpen: true, type: 'comment', id: commentId });
  };

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

  const closeEditModal = () => {
    setEditModal({ isOpen: false, type: null, data: null });
    setEditContent('');
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, type: null, id: null });
  };

  if (!mounted) {
    return null; // Return nothing during server-side rendering to prevent hydration errors
  }

  if (!isLoaded || isLoading) {
    return (
      <div className={`flex min-h-screen ${bgClass} ${textClass}`}>
        <Sidebar userRole={userRole} />
        <div className="flex-1 md:ml-64 p-4 md:p-8">
          <div className="flex justify-center items-center h-40">
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${spinnerClass}`}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className={`flex min-h-screen ${bgClass} ${textClass}`}>
        <Sidebar userRole={userRole} />
        <div className="flex-1 md:ml-64 p-4 md:p-8">
          <Card className="bg-red-900/20 text-red-300 border border-red-800">
            <p className="text-base md:text-lg">You need to be signed in to view your profile.</p>
            <Button 
              className="mt-6" 
              onClick={() => router.push('/')}
            >
              Return to Home
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen ${bgClass}`}>
      {/* Sidebar */}
      <Sidebar userRole={userRole} />

      {/* Main content */}
      <div className="flex-1 md:ml-64 w-full">
        <header className={`sticky top-0 z-10 ${headerBgClass} border-b ${borderClass} p-4 flex justify-between items-center`}>
          <button 
            onClick={() => router.back()}
            className={`${textClass} hover:opacity-75`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className={`text-xl md:text-2xl font-bold ${textClass} pl-8 md:pl-0`}>Your Profile</h1>
          <ThemeToggle />
        </header>

        <main className="p-4 md:p-8 pb-20 md:pb-8">
          {/* Profile navigation menu */}
          <div className={`mb-6 flex ${navBgClass} rounded-lg border ${borderClass} overflow-hidden overflow-x-auto`}>
            <button 
              className={`px-3 py-2 md:py-3 md:px-4 text-center transition whitespace-nowrap ${
                activeSection === 'profile' 
                  ? `${activeNavBgClass} ${activeNavTextClass} border-b-2 ${activeNavBorderClass}` 
                  : navItemClass
              }`}
              onClick={() => setActiveSection('profile')}
            >
              Profile
            </button>
            <button 
              className={`px-3 py-2 md:py-3 md:px-4 text-center transition whitespace-nowrap ${
                activeSection === 'aid' 
                  ? `${activeNavBgClass} ${activeNavTextClass} border-b-2 ${activeNavBorderClass}` 
                  : navItemClass
              }`}
              onClick={() => setActiveSection('aid')}
            >
              Aid Requests
            </button>
            <button 
              className={`px-3 py-2 md:py-3 md:px-4 text-center transition whitespace-nowrap ${
                activeSection === 'content' 
                  ? `${activeNavBgClass} ${activeNavTextClass} border-b-2 ${activeNavBorderClass}` 
                  : navItemClass
              }`}
              onClick={() => setActiveSection('content')}
            >
              Your Content
            </button>
          </div>

          {/* Edit Modal */}
          {editModal.isOpen && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
              <div className={`${modalBgClass} rounded-lg w-full max-w-lg p-4 md:p-6 relative border ${borderClass}`}>
                <button 
                  onClick={closeEditModal}
                  className={`absolute top-3 right-3 md:top-4 md:right-4 ${secondaryTextClass} hover:${textClass}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <h2 className={`text-lg md:text-xl font-semibold mb-4 ${textClass} pr-8`}>
                  Edit {editModal.type === 'post' ? 'Post' : 'Reply'}
                </h2>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={isMobileView ? 4 : 5}
                  className={`w-full p-3 ${inputBgClass} border ${inputBorderClass} rounded-lg ${textClass} focus:ring-blue-500 focus:border-blue-500 mb-4 text-sm md:text-base`}
                  placeholder={`Write your ${editModal.type === 'post' ? 'post' : 'reply'} content...`}
                />
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closeEditModal}
                    className={`px-3 py-1.5 md:px-4 md:py-2 border ${inputBorderClass} rounded-md ${cardBgClass} text-sm md:text-base ${textClass} hover:opacity-80`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEdit}
                    disabled={isSubmittingEdit}
                    className="px-3 py-1.5 md:px-4 md:py-2 bg-blue-600 text-white text-sm md:text-base rounded-md hover:bg-blue-700 flex items-center"
                  >
                    {isSubmittingEdit ? (
                      <>
                        <div className="h-3 w-3 md:h-4 md:w-4 mr-2 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
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
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
              <div className={`${modalBgClass} rounded-lg w-full max-w-md p-4 md:p-6 border ${borderClass}`}>
                <h2 className={`text-lg md:text-xl font-semibold mb-2 ${textClass}`}>Confirm Deletion</h2>
                <p className={`${secondaryTextClass} mb-6 text-sm md:text-base`}>
                  Are you sure you want to delete this {deleteModal.type === 'post' ? 'post' : 'reply'}? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closeDeleteModal}
                    className={`px-3 py-1.5 md:px-4 md:py-2 border ${borderClass} rounded-md ${cardBgClass} text-sm md:text-base ${textClass} hover:opacity-80`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className={`px-3 py-1.5 md:px-4 md:py-2 ${deleteButtonClass} text-white text-sm md:text-base rounded-md`}
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
              <Card className="mb-6 md:mb-8">
                <div className="flex flex-col md:flex-row md:gap-8 items-center md:items-start">
                  {/* Profile image section */}
                  <div className="mb-6 md:mb-0 flex flex-col items-center">
                    <div className="relative h-24 w-24 md:h-32 md:w-32 rounded-full overflow-hidden border-2 border-primary mb-4">
                      {user.imageUrl ? (
                        <Image
                          src={user.imageUrl}
                          alt={user.fullName || "Profile"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className={`h-full w-full ${inputBgClass} flex items-center justify-center ${secondaryTextClass}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 md:h-16 md:w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <Button 
                      onClick={handleProfileImageUpdate}
                      size="small"
                      className="text-xs md:text-sm mb-2"
                    >
                      Change Picture
                    </Button>

                    <p className={`text-2xs md:text-xs ${secondaryTextClass}`}>
                      Member since: {dbUser?.joinedAt 
                        ? new Date(dbUser.joinedAt).toLocaleDateString() 
                        : new Date(user.createdAt).toLocaleDateString()
                      }
                    </p>
                  </div>

                  {/* Profile form section */}
                  <div className="flex-1 w-full">
                    {message.text && (
                      <div className={`mb-4 md:mb-6 p-3 rounded-md text-xs md:text-sm ${
                        message.type === 'success' ? 'bg-green-900/20 text-green-300 border border-green-800' :
                        message.type === 'error' ? 'bg-red-900/20 text-red-300 border border-red-800' :
                        'bg-yellow-900/20 text-yellow-300 border border-yellow-800'
                      }`}>
                        {message.text}
                      </div>
                    )}

                    <form onSubmit={handleSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
                        <div>
                          <label htmlFor="firstName" className={`block text-xs md:text-sm font-medium mb-1 ${textClass}`}>
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
                          <label htmlFor="lastName" className={`block text-xs md:text-sm font-medium mb-1 ${textClass}`}>
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

                      <div className="mb-4 md:mb-6">
                        <label htmlFor="username" className={`block text-xs md:text-sm font-medium mb-1 ${textClass}`}>
                          Username
                        </label>
                        <Input
                          id="username"
                          name="username"
                          value={formData.username}
                          onChange={handleChange}
                          placeholder="Username"
                        />
                        <p className={`mt-1 text-2xs md:text-xs ${secondaryTextClass}`}>
                          This will be used to identify you on the platform.
                        </p>
                      </div>

                      <div className="mb-4 md:mb-6">
                        <label htmlFor="profile_location" className={`block text-xs md:text-sm font-medium mb-1 ${textClass}`}>
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
                          <ul className={`mt-2 ${cardBgClass} border ${borderClass} rounded-md max-h-40 overflow-y-auto`}>
                            {locationSuggestions.map((suggestion, index) => (
                              <li 
                                key={index} 
                                className={`p-2 hover:bg-opacity-20 hover:bg-gray-500 cursor-pointer text-sm ${textClass}`}
                                onClick={() => selectSuggestion(suggestion)}
                              >
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        )}
                        <p className={`mt-1 text-2xs md:text-xs ${secondaryTextClass}`}>
                          This helps others know your general location for emergency coordination.
                        </p>
                      </div>

                      <div className="mb-4 md:mb-6">
                        <label htmlFor="bio" className={`block text-xs md:text-sm font-medium mb-1 ${textClass}`}>
                          Bio
                        </label>
                        <textarea
                          id="bio"
                          name="bio"
                          value={formData.bio}
                          onChange={handleChange}
                          rows={isMobileView ? 3 : 4}
                          placeholder="Tell others a bit about yourself..."
                          className={`w-full px-3 py-2 ${inputBgClass} border ${inputBorderClass} rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary ${textClass} text-sm md:text-base`}
                          maxLength={160}
                        />
                        <p className={`mt-1 text-2xs md:text-xs ${secondaryTextClass}`}>
                          Maximum 160 characters.
                        </p>
                      </div>

                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={isSaving}
                          className={`w-full md:w-auto px-4 md:px-6 py-1.5 md:py-2 ${theme === 'dark' ? 'bg-green-900/20 text-green-400 border border-green-700 hover:bg-green-800/30' : 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'} rounded-md transition text-sm md:text-base`}
                        >
                          {isSaving ? (
                            <div className="flex items-center justify-center">
                              <div className="h-3 w-3 md:h-4 md:w-4 mr-2 rounded-full border-2 border-t-transparent border-green-300 animate-spin"></div>
                              Saving...
                            </div>
                          ) : 'Save Profile'}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </Card>

              <Card className="mb-6 md:mb-8">
                <h2 className={`text-lg md:text-xl font-semibold mb-3 md:mb-4 ${textClass}`}>Account Information</h2>

                <div className="mb-3 md:mb-4">
                  <p className={`text-xs md:text-sm font-medium mb-1 ${secondaryTextClass}`}>Email Address</p>
                  <p className={`text-sm md:text-base ${textClass}`}>{user.primaryEmailAddress?.emailAddress || 'No email address'}</p>
                </div>

                <div className="mb-4 md:mb-6">
                  <p className={`text-xs md:text-sm font-medium mb-1 ${secondaryTextClass}`}>Account ID</p>
                  <p className={`text-xs md:text-sm ${textClass} font-mono break-all`}>{user.id}</p>
                </div>

                {dbUser && (
                  <div className="mb-4 md:mb-6">
                    <p className={`text-xs md:text-sm font-medium mb-1 ${secondaryTextClass}`}>Role</p>
                    <p className={`text-sm md:text-base ${textClass}`}>{dbUser.role || 'Normal User'}</p>
                  </div>
                )}

                <div className={`border-t ${borderClass} pt-4 md:pt-6 flex flex-col md:flex-row justify-between`}>
                  <Button 
                    onClick={() => openUserProfile()}
                    variant="secondary"
                    className="mb-3 md:mb-0 text-sm md:text-base"
                  >
                    Manage Account Settings
                  </Button>

                  {userRole === 'normal' && (
                    <Button 
                      onClick={() => router.push('/profile/request-upgrade')}
                      className={`${theme === 'dark' ? 'bg-blue-900/20 text-blue-400 border border-blue-700 hover:bg-blue-800/30' : 'bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200'} transition text-sm md:text-base`}
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
            <Card className="mb-6 md:mb-8">
              <h2 className={`text-lg md:text-xl font-semibold mb-3 md:mb-4 ${textClass}`}>Your Aid Requests</h2>

              {isLoadingAidRequests ? (
                <div className="flex justify-center py-6">
                  <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${spinnerClass}`}></div>
                </div>
              ) : aidRequests.length === 0 ? (
                <div className={`${theme === 'dark' ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-100 text-blue-700'} p-3 md:p-4 rounded-md`}>
                  <p className="text-sm md:text-base">You haven't made any aid requests yet.</p>
                  <Button 
                    className={`mt-3 md:mt-4 ${theme === 'dark' ? 'bg-blue-900/30 text-blue-300 border border-blue-700 hover:bg-blue-800/30' : 'bg-blue-200 text-blue-700 border border-blue-300 hover:bg-blue-300'} px-3 md:px-4 py-1.5 md:py-2 rounded-md transition text-sm md:text-base`}
                    onClick={() => router.push('/apply-aid')}
                  >
                    Request Aid
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {aidRequests.map((request) => (
                    <div 
                      key={request._id} 
                      className={`p-3 md:p-4 ${cardBgClass} border ${borderClass} rounded-lg`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={`font-medium text-sm md:text-base ${textClass}`}>Request for {request.region}</h3>
                        <span className={`px-2 md:px-3 py-0.5 md:py-1 text-2xs md:text-xs rounded-full ${
                          request.status === 'approved' ? 'bg-green-900/20 text-green-400 border border-green-800' :
                          request.status === 'denied' ? 'bg-red-900/20 text-red-400 border border-red-800' :
                          request.status === 'shipped' ? 'bg-blue-900/20 text-blue-400 border border-blue-800' :
                          request.status === 'delivered' ? 'bg-purple-900/20 text-purple-400 border border-purple-800' :
                          'bg-yellow-900/20 text-yellow-400 border border-yellow-800'
                        }`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>
                      <p className={`text-2xs md:text-sm ${secondaryTextClass} mb-2`}>
                        Requested on {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                      {request.adminNote && (
                        <div className={`mt-2 p-2 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100'} rounded border ${borderClass}`}>
                          <p className={`text-xs md:text-sm ${textClass}`}>
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
            <Card className="mb-6 md:mb-8">
              <h2 className={`text-lg md:text-xl font-semibold mb-3 md:mb-4 ${textClass}`}>Your Content</h2>

              {/* Tabs for Posts and Comments */}
              <div className={`flex border-b ${borderClass} mb-3 md:mb-4`}>
                <button
                  className={`px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium ${
                    activeTab === 'posts' 
                      ? `${textClass} border-b-2 border-blue-500` 
                      : `${secondaryTextClass} ${tabHoverClass}`
                  }`}
                  onClick={() => setActiveTab('posts')}
                >
                  Posts
                </button>
                <button
                  className={`px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium ${
                    activeTab === 'comments' 
                      ? `${textClass} border-b-2 border-blue-500` 
                      : `${secondaryTextClass} ${tabHoverClass}`
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
                      <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${spinnerClass}`}></div>
                    </div>
                  ) : userPosts.length === 0 ? (
                    <div className={`${theme === 'dark' ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-100 text-blue-700'} p-3 md:p-4 rounded-md`}>
                      <p className="text-sm md:text-base">You haven't created any posts yet.</p>
                      <Button 
                        className={`mt-3 md:mt-4 ${theme === 'dark' ? 'bg-blue-900/30 text-blue-300 border border-blue-700 hover:bg-blue-800/30' : 'bg-blue-200 text-blue-700 border border-blue-300 hover:bg-blue-300'} px-3 md:px-4 py-1.5 md:py-2 rounded-md transition text-sm md:text-base`}
                        onClick={() => router.push('/create-post')}
                      >
                        Create Post
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 md:space-y-4">
                      {userPosts.map((post) => (
                        <div 
                          key={post._id} 
                          className={`p-3 md:p-4 ${cardBgClass} border ${borderClass} rounded-lg`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1 mr-3 md:mr-4">
                              <p className={`text-2xs md:text-sm ${secondaryTextClass} mb-1`}>
                                {new Date(post.createdAt).toLocaleDateString()} 
                                {post.location && ` • ${post.location}`}
                              </p>
                              <p className={`text-sm md:text-base ${textClass} line-clamp-2`}>{post.content}</p>
                              <div className="mt-2 flex text-2xs md:text-xs text-zinc-500 space-x-3 md:space-x-4">
                                <span className="flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                  </svg>
                                  {post.likes?.length || 0}
                                </span>
                                <span className="flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                                  </svg>
                                  {/* This would need to be updated to show actual comment count */}
                                  0
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-1 md:space-x-2">
                              <button 
                                onClick={() => router.push(`/posts/${post._id}`)}
                                className={`p-1.5 md:p-2 ${secondaryTextClass} hover:${textClass} transition`}
                                title="View"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => handleEditPost(post)}
                                className="p-1.5 md:p-2 text-zinc-400 hover:text-blue-400 transition"
                                title="Edit"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => handleDeletePost(post._id)}
                                className="p-1.5 md:p-2 text-zinc-400 hover:text-red-400 transition"
                                title="Delete"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                      <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${spinnerClass}`}></div>
                    </div>
                  ) : userComments.length === 0 ? (
                    <div className={`${theme === 'dark' ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-100 text-blue-700'} p-3 md:p-4 rounded-md`}>
                      <p className="text-sm md:text-base">You haven't replied to any posts yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 md:space-y-4">
                      {userComments.map((comment) => (
                        <div 
                          key={comment._id} 
                          className={`p-3 md:p-4 ${cardBgClass} border ${borderClass} rounded-lg`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1 mr-3 md:mr-4">
                              <p className={`text-2xs md:text-sm ${secondaryTextClass} mb-1`}>
                                {new Date(comment.createdAt).toLocaleDateString()}
                                {comment.postTitle && ` • On: ${comment.postTitle}`}
                              </p>
                              <p className={`text-sm md:text-base ${textClass}`}>{comment.content}</p>
                            </div>
                            <div className="flex space-x-1 md:space-x-2">
                              <button 
                                onClick={() => router.push(`/posts/${comment.postId}`)}
                                className={`p-1.5 md:p-2 ${secondaryTextClass} hover:${textClass} transition`}
                                title="View"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => handleEditComment(comment)}
                                className="p-1.5 md:p-2 text-zinc-400 hover:text-blue-400 transition"
                                title="Edit"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => handleDeleteComment(comment._id)}
                                className="p-1.5 md:p-2 text-zinc-400 hover:text-red-400 transition"
                                title="Delete"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        </main>
      </div>
    </div>
  );
}