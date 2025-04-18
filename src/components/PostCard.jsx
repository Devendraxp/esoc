'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from 'next-themes';
import Card from './Card';
import Button from './Button';
import Input from './Input';
import ImageSlider from './ImageSlider';
import { useUser } from '@clerk/nextjs';
import { mutate } from 'swr';
import ReportPostModal from './reports/ReportPostModal';

const PostCard = ({ post, onCommentAdded }) => {
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authorData, setAuthorData] = useState(null);
  const [inputError, setInputError] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  // Fix for hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Theme-aware classes - Updated for better contrast in light mode
  const nameTextClass = theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800';
  const contentTextClass = theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800';
  const audioBgClass = theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100';
  const menuBgClass = theme === 'dark' ? 'bg-zinc-800' : 'bg-white';
  const menuBorderClass = theme === 'dark' ? 'border-zinc-700' : 'border-zinc-300';
  const menuHoverClass = theme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-100';
  const dividerClass = theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200';

  // For optimistic UI updates
  const [optimisticPost, setOptimisticPost] = useState(post);

  // State for post options menu
  const [showOptions, setShowOptions] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const optionsRef = React.useRef(null);

  // Check mobile view on mount and window resize
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

  // Check if user is the post author
  const isAuthor = user && (optimisticPost.author?.clerkId === user.id);

  // Check if user is special or admin
  const [userRole, setUserRole] = useState(null);
  const isSpecialOrAdmin = userRole === 'special' || userRole === 'admin';

  // Check if author is special or admin
  const isAuthorSpecialOrAdmin =
    (authorData?.role === 'special' || authorData?.role === 'admin') ||
    (optimisticPost.authorDetails?.role === 'special' || optimisticPost.authorDetails?.role === 'admin');

  // Update optimistic post when the actual post changes
  useEffect(() => {
    setOptimisticPost(post);
  }, [post]);

  // Fetch current user role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (isSignedIn && user?.id) {
        try {
          const response = await fetch('/api/auth/me');
          if (response.ok) {
            const userData = await response.json();
            setUserRole(userData.role);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      }
    };

    fetchUserRole();
  }, [isSignedIn, user]);

  // Fetch author details if not already included in the post
  useEffect(() => {
    const fetchAuthorData = async () => {
      if (post.author?.clerkId && (!post.authorDetails || !post.authorDetails.firstName)) {
        try {
          const response = await fetch(`/api/users/${post.author.clerkId}`);
          if (response.ok) {
            const userData = await response.json();
            setAuthorData(userData);
          }
        } catch (error) {
          console.error('Error fetching author data:', error);
        }
      }
    };

    fetchAuthorData();
  }, [post]);

  // Handle options toggle
  const toggleOptions = (e) => {
    e.stopPropagation();
    setShowOptions((prev) => !prev);
  };

  // Handle clicking outside options menu to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle edit post
  const handleEditPost = (e) => {
    e.stopPropagation();
    router.push(`/posts/${optimisticPost._id}/edit`);
    setShowOptions(false);
  };

  // Handle delete post
  const handleDeletePost = async (e) => {
    e.stopPropagation();

    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        // If user is a special user or admin, use the special delete endpoint
        const endpoint =
          isSpecialOrAdmin && !isAuthor
            ? `/api/posts/${optimisticPost._id}/delete`
            : `/api/posts/${optimisticPost._id}`;

        const response = await fetch(endpoint, {
          method: 'DELETE',
        });

        if (response.ok) {
          mutate('/api/posts');
          // Provide feedback to the user
          alert('Post deleted successfully');
        } else {
          alert('Failed to delete post');
        }
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Error deleting post');
      }
    }

    setShowOptions(false);
  };

  // Handle report post
  const openReportModal = (e) => {
    e.stopPropagation();
    setShowOptions(false);
    setShowReportModal(true);
  };

  // Handle closing report modal
  const closeReportModal = () => {
    setShowReportModal(false);
  };

  // Format the creation time to show "X time ago"
  const timeAgo = optimisticPost.createdAt
    ? formatDistanceToNow(new Date(optimisticPost.createdAt), { addSuffix: true })
    : 'some time ago';

  // Get user info from the post author with fallbacks
  const getAuthorDisplayName = () => {
    // Check the fetched author data first
    if (authorData) {
      if (authorData.firstName && authorData.lastName) {
        return `${authorData.firstName} ${authorData.lastName}`;
      } else if (authorData.username) {
        return authorData.username;
      }
    }

    // Check post.authorDetails
    if (optimisticPost.authorDetails) {
      if (optimisticPost.authorDetails.firstName && optimisticPost.authorDetails.lastName) {
        return `${optimisticPost.authorDetails.firstName} ${optimisticPost.authorDetails.lastName}`;
      } else if (optimisticPost.authorDetails.name) {
        return optimisticPost.authorDetails.name;
      } else if (optimisticPost.authorDetails.username) {
        return optimisticPost.authorDetails.username;
      }
    }

    // Fallback to clerkId or anonymous
    return optimisticPost.author?.clerkId || 'Anonymous';
  };

  const getAuthorUsername = () => {
    if (authorData?.username) {
      return authorData.username;
    } else if (optimisticPost.authorDetails?.username) {
      return optimisticPost.authorDetails.username;
    } else {
      return optimisticPost.author?.clerkId || 'user';
    }
  };

  const getAuthorProfileImage = () => {
    if (authorData?.profileImageUrl) {
      return authorData.profileImageUrl;
    } else if (optimisticPost.authorDetails?.profileImageUrl) {
      return optimisticPost.authorDetails.profileImageUrl;
    } else {
      return '/avatars/default.png';
    }
  };

  // Handle upvote with optimistic update
  const handleUpvote = async (e) => {
    e.stopPropagation();
    if (!isSignedIn) return;

    // Optimistic UI update
    const userId = user.id;
    const alreadyLiked = optimisticPost.likes?.includes(userId);

    // Create a copy for optimistic update
    const updatedPost = { ...optimisticPost };

    if (alreadyLiked) {
      // Remove like
      updatedPost.likes = updatedPost.likes.filter((id) => id !== userId);
    } else {
      // Add like and remove dislike if present
      updatedPost.likes = [...(updatedPost.likes || []), userId];
      if (updatedPost.dislikes?.includes(userId)) {
        updatedPost.dislikes = updatedPost.dislikes.filter((id) => id !== userId);
      }
    }

    // Update UI immediately
    setOptimisticPost(updatedPost);

    try {
      await fetch(`/api/posts/${optimisticPost._id}/like`, {
        method: 'POST',
      });
      // Refresh the post data in the background to ensure consistency
      mutate('/api/posts');
      if (onCommentAdded) onCommentAdded();
    } catch (error) {
      console.error('Error liking post:', error);
      // Revert on error
      setOptimisticPost(post);
    }
  };

  // Handle downvote with optimistic update
  const handleDownvote = async (e) => {
    e.stopPropagation();
    if (!isSignedIn) return;

    // Optimistic UI update
    const userId = user.id;
    const alreadyDisliked = optimisticPost.dislikes?.includes(userId);

    // Create a copy for optimistic update
    const updatedPost = { ...optimisticPost };

    if (alreadyDisliked) {
      // Remove dislike
      updatedPost.dislikes = updatedPost.dislikes.filter((id) => id !== userId);
    } else {
      // Add dislike and remove like if present
      updatedPost.dislikes = [...(updatedPost.dislikes || []), userId];
      if (updatedPost.likes?.includes(userId)) {
        updatedPost.likes = updatedPost.likes.filter((id) => id !== userId);
      }
    }

    // Update UI immediately
    setOptimisticPost(updatedPost);

    try {
      await fetch(`/api/posts/${optimisticPost._id}/dislike`, {
        method: 'POST',
      });
      // Refresh the post data in the background
      mutate('/api/posts');
      if (onCommentAdded) onCommentAdded();
    } catch (error) {
      console.error('Error disliking post:', error);
      // Revert on error
      setOptimisticPost(post);
    }
  };

  // Handle posting a reply
  const handleSubmitReply = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Validate input
    if (!replyText.trim()) {
      setInputError(true);
      return;
    }

    if (!isSignedIn) return;

    setIsSubmitting(true);
    setInputError(false);

    try {
      const response = await fetch(`/api/posts/${optimisticPost._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: replyText }),
      });

      if (response.ok) {
        setReplyText('');
        // If a callback was provided, call it to refresh the data
        if (onCommentAdded) onCommentAdded();
      }
    } catch (error) {
      console.error('Error posting reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    setReplyText(e.target.value);
    if (e.target.value.trim() !== '') {
      setInputError(false);
    }
  };

  // Handle clicking on the post
  const handlePostClick = () => {
    router.push(`/posts/${optimisticPost._id}`);
  };

  // Render media content
  const renderMedia = () => {
    if (!optimisticPost.media || optimisticPost.media.length === 0) return null;

    // Filter media by type
    const images = optimisticPost.media.filter((item) => item.type === 'image');
    const videos = optimisticPost.media.filter((item) => item.type === 'video');
    const audios = optimisticPost.media.filter((item) => item.type === 'audio');
    const others = optimisticPost.media.filter(
      (item) => item.type !== 'image' && item.type !== 'video' && item.type !== 'audio'
    );

    return (
      <div className="mb-4 overflow-hidden rounded-lg">
        {/* Image slider */}
        {images.length > 0 && (
          <ImageSlider images={images.map((image) => image.url)} height={isMobileView ? 'h-64' : 'h-48'} />
        )}

        {/* Videos */}
        {videos.map((video, index) => (
          <div key={`video-${index}`} className="mb-2">
            <video
              src={video.url}
              controls
              className="w-full rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ))}

        {/* Audio */}
        {audios.map((audio, index) => (
          <div key={`audio-${index}`} className={`mb-2 ${audioBgClass} rounded-lg p-2`}>
            <audio
              src={audio.url}
              controls
              className="w-full"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ))}

        {/* Other files */}
        {others.map((file, index) => (
          <div key={`file-${index}`} className="mb-2 text-blue-400 underline">
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {file.url.split('/').pop() || 'Attached file'}
            </a>
          </div>
        ))}
      </div>
    );
  };

  if (!mounted) {
    return null; // Prevent hydration issues
  }

  return (
    <Card
      className={`hover:border-blue-700 transition-colors cursor-pointer overflow-hidden ${
        isAuthorSpecialOrAdmin ? 'border-green-500 border-2' : ''
      }`}
    >
      <div onClick={handlePostClick}>
        <div className="flex items-start space-x-3 mb-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden relative border border-zinc-700">
              <Image
                src={getAuthorProfileImage()}
                alt={getAuthorDisplayName()}
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="max-w-[80%]">
                <h3 className={`text-sm font-medium ${nameTextClass} mr-2 truncate flex items-center`}>
                  {getAuthorDisplayName()}
                  {isAuthorSpecialOrAdmin && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 ml-1 text-green-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </h3>
                <div className="text-xs text-zinc-500 mt-0.5 flex flex-wrap items-center">
                  <span className="mr-2">@{getAuthorUsername()}</span>
                  <span className="text-zinc-500">{timeAgo}</span>
                </div>

                {/* Show post location first if available */}
                {optimisticPost.location && (
                  <p className="text-xs text-zinc-500 mt-0.5 flex items-center overflow-hidden text-ellipsis whitespace-nowrap">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 mr-1 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="truncate">{optimisticPost.location}</span>
                  </p>
                )}

                {/* Show author location as fallback */}
                {!optimisticPost.location &&
                  (authorData?.profile_location || optimisticPost.authorDetails?.profile_location) && (
                    <p className="text-xs text-zinc-500 mt-0.5 flex items-center overflow-hidden text-ellipsis whitespace-nowrap">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 mr-1 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="truncate">
                        {authorData?.profile_location || optimisticPost.authorDetails?.profile_location}
                      </span>
                    </p>
                  )}
              </div>

              {/* Options menu - moved to top right */}
              <div className="relative">
                <button
                  onClick={toggleOptions}
                  className="text-zinc-400 hover:text-blue-400 p-1 transition rounded-full hover:bg-zinc-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M12 6a2 2 0 100-4 2 2 0 000 4zm0 7a2 2 0 100-4 2 2 0 000 4zm0 7a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                </button>
                {showOptions && (
                  <div
                    ref={optionsRef}
                    className={`absolute right-0 mt-2 w-48 ${menuBgClass} border ${menuBorderClass} rounded-md shadow-lg z-10`}
                  >
                    {isAuthor ? (
                      <>
                        <button
                          onClick={handleEditPost}
                          className={`block w-full text-left px-4 py-2 text-sm text-zinc-400 ${menuHoverClass} hover:text-white`}
                        >
                          Edit Post
                        </button>
                        <button
                          onClick={handleDeletePost}
                          className={`block w-full text-left px-4 py-2 text-sm text-red-400 ${menuHoverClass} hover:text-white`}
                        >
                          Delete Post
                        </button>
                      </>
                    ) : isSpecialOrAdmin ? (
                      <>
                        <button
                          onClick={openReportModal}
                          className={`block w-full text-left px-4 py-2 text-sm text-yellow-400 ${menuHoverClass} hover:text-white`}
                        >
                          Report Post
                        </button>
                        <button
                          onClick={handleDeletePost}
                          className={`block w-full text-left px-4 py-2 text-sm text-red-400 ${menuHoverClass} hover:text-white`}
                        >
                          Delete Post
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={openReportModal}
                        className={`block w-full text-left px-4 py-2 text-sm text-yellow-400 ${menuHoverClass} hover:text-white`}
                      >
                        Report Post
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Post media */}
        {renderMedia()}

        {/* Post content - updated class for better visibility in light mode */}
        <p className={`${contentTextClass} mb-6 whitespace-pre-wrap line-clamp-6`}>{optimisticPost.content}</p>
      </div>

      {/* Interaction buttons */}
      <div className={`flex items-center border-t ${dividerClass} pt-4 mt-2`}>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleUpvote}
            className={`flex items-center hover:text-green-400 transition border rounded-md px-2 py-1 ${
              optimisticPost.likes?.includes(user?.id)
                ? 'text-green-400 bg-green-900/20 border-green-700'
                : 'text-zinc-400 border-zinc-700 hover:border-green-700'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-1">
              <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266-.558.107-1.282.725-1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z" />
            </svg>
            <span>{optimisticPost.likes?.length || 0}</span>
          </button>

          <button
            onClick={handleDownvote}
            className={`flex items-center hover:text-red-400 transition border rounded-md px-2 py-1 ${
              optimisticPost.dislikes?.includes(user?.id)
                ? 'text-red-400 bg-red-900/20 border-red-700'
                : 'text-zinc-400 border-zinc-700 hover:border-red-700'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-1">
              <path d="M15.73 5.25h1.035A7.465 7.465 0 0118 9.375a7.465 7.465 0 01-1.235 4.125h-.148c-.806 0-1.534.446-2.031 1.08a9.04 9.04 0 01-2.861 2.4c-.723.384-1.35-.956-1.653 1.715a4.498 4.498 0 00-.322 1.672V21a.75.75 0 01-.75.75 2.25 2.25 0 01-2.25-2.25c0-1.152.26-2.243.723-3.218.266-.558-.107-1.282-.725-1.282H3.622c-1.026 0-1.945-.694-2.054-1.715A12.134 12.134 0 011.5 12c0-2.848.992-5.464 2.649-7.521.388-.482.987-.729 1.605-.729H9.77a4.5 4.5 0 011.423.23l3.114 1.04a4.5 4.5 0 001.423.23zM21.669 13.773c.536-1.362.831-2.845.831-4.398 0-1.22-.182-2.398-.52-3.507-.26-.85-1.084-1.368-1.973-1.368H19.1c-.445 0-.72.498-.523.898.591 1.2.924 2.55.924 3.977a8.959 8.959 0 01-1.302 4.666c-.245.403.028.959.5.959h1.053c.832 0 1.612-.453 1.918-1.227z" />
            </svg>
            <span>{optimisticPost.dislikes?.length || 0}</span>
          </button>
        </div>
      </div>

      {/* Reply input (always shown) */}
      <div className={`mt-4 border-t ${dividerClass} pt-4`} onClick={(e) => e.stopPropagation()}>
        <form
          onSubmit={handleSubmitReply}
          className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2"
        >
          <Input
            value={replyText}
            onChange={handleInputChange}
            placeholder="Reply..."
            className={`flex-1 ${
              inputError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : ''
            }`}
          />
          <Button
            type="submit"
            disabled={isSubmitting || !isSignedIn}
            className={`sm:w-auto w-full text-sm py-2 px-4 border border-zinc-700 rounded-md ${
              isSubmitting ? 'bg-blue-900/30 text-blue-300' : 'bg-primary hover:bg-primary/80'
            }`}
          >
            {isSubmitting ? (
              <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
            ) : (
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
                Send
              </span>
            )}
          </Button>
        </form>
        {inputError && (
          <p className="text-red-500 text-xs mt-1">Please enter a reply before submitting</p>
        )}
      </div>

      {/* Report post modal using our new component */}
      <ReportPostModal
        isOpen={showReportModal}
        onClose={closeReportModal}
        postId={optimisticPost._id}
        postContent={optimisticPost.content}
      />
    </Card>
  );
};

export default PostCard;