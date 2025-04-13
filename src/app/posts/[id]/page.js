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

  // SWR for real-time updates
  const { data: post, error: postError, isLoading: postLoading } = useSWR(
    `/api/posts/${id}`,
    fetcher
  );
  
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
      await fetch(`/api/posts/${id}/like`, {
        method: 'POST',
      });
      
      // Revalidate post data
      mutate(`/api/posts/${id}`);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  // Handle dislike post
  const handleDislike = async () => {
    if (!isSignedIn) {
      alert('Please sign in to dislike posts');
      return;
    }
    
    try {
      await fetch(`/api/posts/${id}/dislike`, {
        method: 'POST',
      });
      
      // Revalidate post data
      mutate(`/api/posts/${id}`);
    } catch (error) {
      console.error('Error disliking post:', error);
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
    
    if (!commentText.trim()) return;
    
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
    
    return (
      <div className="mt-4 space-y-4">
        {media.map((item, idx) => {
          if (item.type === 'image') {
            return (
              <div key={idx} className="relative w-full h-64 rounded-lg overflow-hidden">
                <Image 
                  src={item.url} 
                  alt="Post media" 
                  fill 
                  className="object-cover"
                />
              </div>
            );
          } else if (item.type === 'video') {
            return (
              <div key={idx} className="rounded-lg overflow-hidden">
                <video 
                  src={item.url} 
                  controls 
                  className="w-full"
                />
              </div>
            );
          } else if (item.type === 'audio') {
            return (
              <div key={idx} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                <audio 
                  src={item.url} 
                  controls 
                  className="w-full"
                />
              </div>
            );
          } else {
            return (
              <div key={idx} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {item.url.split('/').pop() || 'Download attachment'}
                </a>
              </div>
            );
          }
        })}
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
            <Card className="mb-8">
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
                        <p className="text-md font-medium text-[#ededed]">
                          {getAuthorDisplayName()}
                        </p>
                        <div className="flex items-center text-xs text-zinc-400 space-x-2">
                          <span>{post.createdAt ? format(new Date(post.createdAt), 'MMM d, yyyy • h:mm a') : 'Unknown date'}</span>
                          {(authorDetails?.profile_location || post.author?.profile_location) && (
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
                          className={`flex items-center hover:text-green-400 transition ${
                            post.likes?.includes(user?.id) ? 'text-green-400' : 'text-zinc-400'
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-2">
                            <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266-.558.107-1.282.725-1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z" />
                          </svg>
                          <span>{post.likes?.length || 0}</span>
                        </button>
                        
                        <button 
                          onClick={handleDislike}
                          className={`flex items-center hover:text-red-400 transition ${
                            post.dislikes?.includes(user?.id) ? 'text-red-400' : 'text-zinc-400'
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-2">
                            <path d="M15.73 5.25h1.035A7.465 7.465 0 0118 9.375a7.465 7.465 0 01-1.235 4.125h-.148c-.806 0-1.534.446-2.031 1.08a9.04 9.04 0 01-2.861 2.4c-.723.384-1.35-.956-1.653 1.715a4.498 4.498 0 00-.322 1.672V21a.75.75 0 01-.75.75 2.25 2.25 0 01-2.25-2.25c0-1.152.26-2.243.723-3.218.266-.558-.107-1.282-.725-1.282H3.622c-1.026 0-1.945-.694-2.054-1.715A12.134 12.134 0 011.5 12c0-2.848.992-5.464 2.649-7.521.388-.482.987-.729 1.605-.729H9.77a4.5 4.5 0 011.423.23l3.114 1.04a4.5 4.5 0 001.423.23zM21.669 13.773c.536-1.362.831-2.845.831-4.398 0-1.22-.182-2.398-.52-3.507-.26-.85-1.084-1.368-1.973-1.368H19.1c-.445 0-.72.498-.523.898.591 1.2.924 2.55.924 3.977a8.959 8.959 0 01-1.302 4.666c-.245.403.028.959.5.959h1.053c.832 0 1.612-.453 1.918-1.227z" />
                          </svg>
                          <span>{post.dislikes?.length || 0}</span>
                        </button>
                        
                        <button 
                          onClick={handleReport}
                          className="flex items-center text-zinc-400 hover:text-yellow-400 transition"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-2">
                            <path fillRule="evenodd" d="M3 2.25a.75.75 0 01.75.75v.54l1.838-.46a9.75 9.75 0 016.725.738l.108.054a8.25 8.25 0 005.58.652l3.109-.732a.75.75 0 01.917.81 47.784 47.784 0 00.005 10.337.75.75 0 01-.574.812l-3.114.733a9.75 9.75 0 01-6.594-.77l-.108-.054a8.25 8.25 0 00-5.69-.625l-2.202.55V21a.75.75 0 01-1.5 0V3A.75.75 0 013 2.25z" clipRule="evenodd" />
                          </svg>
                          <span>Report</span>
                        </button>
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
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !isSignedIn}
                  >
                    {isSubmitting ? 'Sending...' : 'Reply'}
                  </Button>
                </div>
                {!isSignedIn && (
                  <p className="mt-2 text-xs text-zinc-500">Please sign in to leave a comment</p>
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
                  // Get the comment author's data
                  const commentAuthor = comment.authorDetails || { clerkId: comment.author?.clerkId };
                  
                  return (
                    <Card key={comment._id} className="border border-zinc-800">
                      <div className="flex items-start space-x-3 mb-3">
                        {/* Comment Author Profile Image */}
                        <div className="relative flex-shrink-0 h-8 w-8 rounded-full overflow-hidden border border-zinc-700">
                          {commentAuthor.profileImageUrl ? (
                            <Image 
                              src={commentAuthor.profileImageUrl} 
                              alt={commentAuthor.firstName || commentAuthor.clerkId || 'User'}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-[#ededed]">
                            {commentAuthor.firstName && commentAuthor.lastName 
                              ? `${commentAuthor.firstName} ${commentAuthor.lastName}`
                              : commentAuthor.username || commentAuthor.clerkId || 'Anonymous'}
                          </p>
                          <p className="text-xs text-zinc-400">
                            {comment.createdAt ? format(new Date(comment.createdAt), 'MMM d, yyyy • h:mm a') : 'Unknown date'}
                            {commentAuthor.profile_location && ` • ${commentAuthor.profile_location}`}
                          </p>
                        </div>
                      </div>
                      <p className="text-[#ededed]">{comment.content}</p>
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