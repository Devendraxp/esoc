'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import useSWR, { mutate } from 'swr';
import { useUser } from '@clerk/nextjs';

import Container from '../../../components/Container';
import Sidebar from '../../../components/Sidebar';
import Button from '../../../components/Button';
import Card from '../../../components/Card';
import Input from '../../../components/Input';
import ThemeToggle from '../../../components/ThemeToggle';
import ImageSlider from '../../../components/ImageSlider';

// Fetcher function for SWR
const fetcher = (url) => fetch(url).then((res) => res.json());

export default function PostDetail({ params }) {
  const router = useRouter();
  // Unwrap params using React.use() to fix the warning
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;
  const { isSignedIn, user } = useUser();
  
  // State for new comment
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authorDetails, setAuthorDetails] = useState(null);
  const [inputError, setInputError] = useState(false);
  const [userRole, setUserRole] = useState(null); // Add userRole state
  
  // For optimistic UI updates
  const [optimisticPost, setOptimisticPost] = useState(null);

  // SWR for real-time updates
  const { data: post, error: postError, isLoading: postLoading } = useSWR(
    `/api/posts/${id}`,
    fetcher
  );
  
  // Fetch current user's role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (isSignedIn) {
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
  }, [isSignedIn]);
  
  // Update optimistic post when actual post data changes
  useEffect(() => {
    if (post) {
      setOptimisticPost(post);
    }
  }, [post]);
  
  // Check if author is special or admin
  const isSpecialOrAdmin = (authorDetails?.role === 'special' || authorDetails?.role === 'admin') || 
                          (post?.author?.role === 'special' || post?.author?.role === 'admin');
  
  const { data: comments, error: commentsError, isLoading: commentsLoading } = useSWR(
    `/api/posts/${id}/comments`,
    fetcher
  );
  
  // Fetch author details when post loads
  useEffect(() => {
    if (post?.author?.clerkId) {
      const fetchAuthor = async () => {
        try {
          const response = await fetch(`/api/users/${post.author.clerkId}`);
          if (response.ok) {
            const userData = await response.json();
            setAuthorDetails(userData);
          }
        } catch (error) {
          console.error('Error fetching author details:', error);
        }
      };
      
      fetchAuthor();
    }
  }, [post]);

  // Handle like post
  const handleLike = async () => {
    if (!isSignedIn) {
      alert('Please sign in to like posts');
      return;
    }
    
    try {
      // Optimistic UI update
      const userId = user.id;
      const alreadyLiked = optimisticPost?.likes?.includes(userId);
      
      // Create a copy for optimistic update
      const updatedPost = { ...optimisticPost };
      
      if (alreadyLiked) {
        // Remove like
        updatedPost.likes = updatedPost.likes.filter(id => id !== userId);
      } else {
        // Add like and remove dislike if present
        updatedPost.likes = [...(updatedPost.likes || []), userId];
        if (updatedPost.dislikes?.includes(userId)) {
          updatedPost.dislikes = updatedPost.dislikes.filter(id => id !== userId);
        }
      }
      
      // Update UI immediately
      setOptimisticPost(updatedPost);

      await fetch(`/api/posts/${id}/like`, {
        method: 'POST',
      });
      
      // Revalidate post data
      mutate(`/api/posts/${id}`);
    } catch (error) {
      console.error('Error liking post:', error);
      // Revert the optimistic update on error
      setOptimisticPost(post);
    }
  };

  // Handle dislike post
  const handleDislike = async () => {
    if (!isSignedIn) {
      alert('Please sign in to dislike posts');
      return;
    }
    
    try {
      // Optimistic UI update
      const userId = user.id;
      const alreadyDisliked = optimisticPost?.dislikes?.includes(userId);
      
      // Create a copy for optimistic update
      const updatedPost = { ...optimisticPost };
      
      if (alreadyDisliked) {
        // Remove dislike
        updatedPost.dislikes = updatedPost.dislikes.filter(id => id !== userId);
      } else {
        // Add dislike and remove like if present
        updatedPost.dislikes = [...(updatedPost.dislikes || []), userId];
        if (updatedPost.likes?.includes(userId)) {
          updatedPost.likes = updatedPost.likes.filter(id => id !== userId);
        }
      }
      
      // Update UI immediately
      setOptimisticPost(updatedPost);

      await fetch(`/api/posts/${id}/dislike`, {
        method: 'POST',
      });
      
      // Revalidate post data
      mutate(`/api/posts/${id}`);
    } catch (error) {
      console.error('Error disliking post:', error);
      // Revert the optimistic update on error
      setOptimisticPost(post);
    }
  };

  // Handle report post
  const handleReport = async () => {
    if (!isSignedIn) {
      alert('Please sign in to report posts');
      return;
    }
    
    try {
      // Show a simple browser prompt to get the reason
      const reason = prompt('Why are you reporting this post?', 'fake');
      
      if (!reason) return;
      
      await fetch(`/api/posts/${id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      
      alert('Post reported successfully');
    } catch (error) {
      console.error('Error reporting post:', error);
    }
  };

  // Handle submit comment
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!isSignedIn) {
      alert('Please sign in to comment');
      return;
    }
    
    if (!commentText.trim()) {
      setInputError(true);
      return;
    }
    
    setInputError(false);
    setIsSubmitting(true);
    
    try {
      await fetch(`/api/posts/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: commentText }),
      });
      
      // Clear input and revalidate comments
      setCommentText('');
      mutate(`/api/posts/${id}/comments`);
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Media rendering helper
  const renderMedia = (media) => {
    if (!media || media.length === 0) return null;
    
    // Filter media by type
    const images = media.filter(item => item.type === 'image');
    const videos = media.filter(item => item.type === 'video');
    const audios = media.filter(item => item.type === 'audio');
    const others = media.filter(item => item.type !== 'image' && item.type !== 'video' && item.type !== 'audio');
    
    return (
      <div className="mt-4 space-y-4">
        {/* Image slider - only show if there are images */}
        {images.length > 0 && (
          <ImageSlider 
            images={images.map(image => image.url)} 
            height="h-64" 
            objectFit="object-contain"
          />
        )}
        
        {/* Videos */}
        {videos.map((video, index) => (
          <div key={`video-${index}`} className="rounded-lg overflow-hidden">
            <video 
              src={video.url} 
              controls 
              className="w-full"
            />
          </div>
        ))}
        
        {/* Audio */}
        {audios.map((audio, index) => (
          <div key={`audio-${index}`} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <audio 
              src={audio.url} 
              controls 
              className="w-full"
            />
          </div>
        ))}
        
        {/* Other files */}
        {others.map((file, index) => (
          <div key={`file-${index}`} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <a 
              href={file.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {file.url.split('/').pop() || 'Download attachment'}
            </a>
          </div>
        ))}
      </div>
    );
  };

  // Get the author's displayable name
  const getAuthorDisplayName = () => {
    if (authorDetails?.firstName && authorDetails?.lastName) {
      return `${authorDetails.firstName} ${authorDetails.lastName}`;
    } else if (authorDetails?.username) {
      return authorDetails.username;
    } else {
      return post?.author?.clerkId || 'Anonymous';
    }
  };

  if (postLoading) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0a] text-[#ededed]">
        <Sidebar />
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

  if (postError || !post) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0a] text-[#ededed]">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          <Container>
            <Card className="bg-red-900/20 text-red-300 border border-red-800">
              <p className="text-lg">Error loading post. This post may not exist or has been removed.</p>
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
      <Sidebar />

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
          <h1 className="text-2xl font-bold text-[#ededed]">Post Detail</h1>
          <ThemeToggle />
        </header>

        <main className="p-8">
          <Container className="py-6">
            <Card className={`mb-8 ${isSpecialOrAdmin ? 'border-green-500 border-2' : ''}`}>
              <div className="mb-6">
                <div className="flex items-start space-x-3">
                  {/* Author Profile Image */}
                  <div className="relative flex-shrink-0 h-12 w-12 rounded-full overflow-hidden border border-zinc-700">
                    {authorDetails?.profileImageUrl ? (
                      <Image 
                        src={authorDetails.profileImageUrl} 
                        alt={getAuthorDisplayName()}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-md font-medium text-[#ededed] flex items-center">
                          {getAuthorDisplayName()}
                          {isSpecialOrAdmin && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </p>
                        <div className="flex items-center text-xs text-zinc-400 space-x-2">
                          <span>{post.createdAt ? format(new Date(post.createdAt), 'MMM d, yyyy • h:mm a') : 'Unknown date'}</span>
                          
                          {/* Post location */}
                          {post.location && (
                            <>
                              <span>•</span>
                              <span className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {post.location}
                              </span>
                            </>
                          )}
                          
                          {/* Author location (only show if post location is empty) */}
                          {!post.location && (authorDetails?.profile_location || post.author?.profile_location) && (
                            <>
                              <span>•</span>
                              <span className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {authorDetails?.profile_location || post.author?.profile_location}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-4">
                        <button 
                          onClick={handleLike}
                          className={`flex items-center transition border rounded-md px-3 py-1.5 ${
                            optimisticPost?.likes?.includes(user?.id) 
                              ? 'text-green-400 bg-green-900/20 border-green-700' 
                              : 'text-zinc-400 border-zinc-700 hover:border-green-700 hover:bg-green-900/10'
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2">
                            <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266-.558.107-1.282.725-1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z" />
                          </svg>
                          <span>{optimisticPost?.likes?.length || 0}</span>
                        </button>
                        
                        <button 
                          onClick={handleDislike}
                          className={`flex items-center transition border rounded-md px-3 py-1.5 ${
                            optimisticPost?.dislikes?.includes(user?.id) 
                              ? 'text-red-400 bg-red-900/20 border-red-700' 
                              : 'text-zinc-400 border-zinc-700 hover:border-red-700 hover:bg-red-900/10'
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2">
                            <path d="M15.73 5.25h1.035A7.465 7.465 0 0118 9.375a7.465 7.465 0 01-1.235 4.125h-.148c-.806 0-1.534.446-2.031 1.08a9.04 9.04 0 01-2.861 2.4c-.723.384-1.35-.956-1.653 1.715a4.498 4.498 0 00-.322 1.672V21a.75.75 0 01-.75.75 2.25 2.25 0 01-2.25-2.25c0-1.152.26-2.243.723-3.218.266-.558-.107-1.282-.725-1.282H3.622c-1.026 0-1.945-.694-2.054-1.715A12.134 12.134 0 011.5 12c0-2.848.992-5.464 2.649-7.521.388-.482.987-.729 1.605-.729H9.77a4.5 4.5 0 011.423.23l3.114 1.04a4.5 4.5 0 001.423.23zM21.669 13.773c.536-1.362.831-2.845.831-4.398 0-1.22-.182-2.398-.52-3.507-.26-.85-1.084-1.368-1.973-1.368H19.1c-.445 0-.72.498-.523.898.591 1.2.924 2.55.924 3.977a8.959 8.959 0 01-1.302 4.666c-.245.403.028.959.5.959h1.053c.832 0 1.612-.453 1.918-1.227z" />
                          </svg>
                          <span>{optimisticPost?.dislikes?.length || 0}</span>
                        </button>
                        
                        <button 
                          onClick={handleReport}
                          className="flex items-center transition border border-zinc-700 hover:border-yellow-600 hover:bg-yellow-900/10 text-zinc-400 hover:text-yellow-400 rounded-md px-3 py-1.5"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2">
                            <path fillRule="evenodd" d="M3 2.25a.75.75 0 01.75.75v.54l1.838-.46a9.75 9.75 0 016.725.738l.108.054a8.25 8.25 0 005.58.652l3.109-.732a.75.75 0 01.917.81 47.784 47.784 0 00.005 10.337.75.75 0 01-.574.812l-3.114.733a9.75 9.75 0 01-6.594-.77l-.108-.054a8.25 8.25 0 00-5.69-.625l-2.202.55V21a.75.75 0 01-1.5 0V3A.75.75 0 013 2.25z" clipRule="evenodd" />
                          </svg>
                          <span>Report</span>
                        </button>
                        
                        {/* Special user direct delete button */}
                        {(userRole === 'special' || userRole === 'admin') && (
                          <button 
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
                                fetch(`/api/posts/${id}/delete`, {
                                  method: 'DELETE',
                                }).then(response => {
                                  if (response.ok) {
                                    alert('Post deleted successfully');
                                    router.push('/');
                                  } else {
                                    alert('Failed to delete post');
                                  }
                                }).catch(error => {
                                  console.error('Error deleting post:', error);
                                  alert('Error deleting post');
                                });
                              }
                            }}
                            className="flex items-center transition border border-zinc-700 hover:border-red-600 hover:bg-red-900/10 text-zinc-400 hover:text-red-400 rounded-md px-3 py-1.5 ml-3"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                            <span>Delete Post</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-[#ededed] whitespace-pre-wrap mb-6">{post.content}</p>
              
              {/* Render media attachments */}
              {renderMedia(post.media)}
              
              {/* Fake Score indicator for admin/special users */}
              {post.fakeScore > 0 && (
                <div className="mt-6 bg-yellow-900/20 text-yellow-300 p-4 rounded-md text-sm">
                  ⚠️ Fake Score: {post.fakeScore}/10
                </div>
              )}
            </Card>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-6 text-[#ededed]">Comments</h2>
              
              {/* Comment input */}
              <form onSubmit={handleSubmitComment} className="mb-8">
                <div className="flex space-x-3">
                  <Input
                    value={commentText}
                    onChange={(e) => {
                      setCommentText(e.target.value);
                      if (e.target.value.trim() !== '') {
                        setInputError(false);
                      }
                    }}
                    placeholder="Add a comment..."
                    className={`flex-1 ${inputError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : ''}`}
                  />
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !isSignedIn}
                    className={`border border-zinc-700 rounded-md px-4 py-2 ${
                      isSubmitting ? 'bg-blue-900/30 text-blue-300' : 'bg-primary hover:bg-primary/80'
                    }`}
                  >
                    {isSubmitting ? (
                      <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
                    ) : (
                      'Reply'
                    )}
                  </Button>
                </div>
                {!isSignedIn && (
                  <p className="mt-2 text-xs text-zinc-500">Please sign in to leave a comment</p>
                )}
                {inputError && (
                  <p className="mt-2 text-xs text-red-500">Comment cannot be empty</p>
                )}
              </form>

              {/* Comments list */}
              {commentsLoading && (
                <div className="flex justify-center items-center h-20">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#ededed]"></div>
                </div>
              )}
              
              {commentsError && (
                <Card className="bg-red-900/20 text-red-300 border border-red-800 mb-6">
                  <p>Error loading comments. Please try again.</p>
                </Card>
              )}

              {comments && comments.length === 0 && (
                <Card className="bg-blue-900/20 text-blue-300 border border-blue-800 mb-6">
                  <p>No comments yet. Be the first to add one!</p>
                </Card>
              )}

              <div className="space-y-6">
                {comments && comments.map((comment) => {
                  // Get the comment author's data - now directly from the author field
                  const commentAuthor = comment.author || { clerkId: 'Anonymous' };
                  const isSpecialOrAdminComment = commentAuthor.role === 'special' || commentAuthor.role === 'admin';
                  
                  return (
                    <Card key={comment._id} className={`border hover:border-zinc-700 transition-colors ${
                      isSpecialOrAdminComment ? 'border-green-500 border-2' : 'border-zinc-800'
                    }`}>
                      <div className="flex items-start space-x-3 mb-3">
                        {/* Comment Author Profile Image */}
                        <div className="relative flex-shrink-0 h-10 w-10 rounded-full overflow-hidden border border-zinc-700">
                          {commentAuthor.profileImageUrl ? (
                            <Image 
                              src={commentAuthor.profileImageUrl} 
                              alt={commentAuthor.firstName || commentAuthor.username || 'User'}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <p className="text-sm font-medium text-[#ededed] flex items-center">
                              {commentAuthor.firstName && commentAuthor.lastName 
                                ? `${commentAuthor.firstName} ${commentAuthor.lastName}`
                                : commentAuthor.username || 'Anonymous'}
                              {isSpecialOrAdminComment && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </p>
                            {commentAuthor.role && commentAuthor.role !== 'normal' && (
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                commentAuthor.role === 'admin'
                                  ? 'bg-purple-900/30 text-purple-300 border border-purple-700'
                                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                              }`}>
                                {commentAuthor.role}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 flex items-center">
                            <span>{comment.createdAt ? format(new Date(comment.createdAt), 'MMM d, yyyy • h:mm a') : 'Unknown date'}</span>
                            {commentAuthor.profile_location && (
                              <span className="flex items-center ml-2">
                                •
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {commentAuthor.profile_location}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <p className="text-[#ededed] ml-13 pl-0.5">{comment.content}</p>
                    </Card>
                  );
                })}
              </div>
            </div>
          </Container>
        </main>
      </div>
    </div>
  );
}