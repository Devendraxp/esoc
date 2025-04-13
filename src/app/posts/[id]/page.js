'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import useSWR, { mutate } from 'swr';

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
  const id = params.id;
  
  // State for new comment
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SWR for real-time updates
  const { data: post, error: postError, isLoading: postLoading } = useSWR(
    `/api/posts/${id}`,
    fetcher
  );
  
  const { data: comments, error: commentsError, isLoading: commentsLoading } = useSWR(
    `/api/posts/${id}/comments`,
    fetcher
  );

  // Handle like post
  const handleLike = async () => {
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

  // Handle report post
  const handleReport = async () => {
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
              <div className="mb-6 flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-[#ededed]">
                    {post.author?.clerkId || 'Anonymous'}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {post.createdAt ? format(new Date(post.createdAt), 'MMM d, yyyy • h:mm a') : 'Unknown date'}
                    {post.author?.profile_location && ` • ${post.author.profile_location}`}
                  </p>
                </div>
                <div className="flex space-x-3">
                  <Button 
                    variant="secondary" 
                    onClick={handleLike}
                    className="text-sm flex items-center space-x-2 bg-zinc-800 hover:bg-zinc-700"
                  >
                    <span>❤️</span>
                    <span>{post.likes?.length || 0}</span>
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={handleReport}
                    className="text-sm bg-zinc-800 hover:bg-zinc-700"
                  >
                    Report
                  </Button>
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
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Reply'}
                  </Button>
                </div>
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
                {comments && comments.map((comment) => (
                  <Card key={comment._id} className="border border-zinc-800">
                    <div className="mb-3">
                      <p className="text-sm font-medium text-[#ededed]">
                        {comment.author?.clerkId || 'Anonymous'}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {comment.createdAt ? format(new Date(comment.createdAt), 'MMM d, yyyy • h:mm a') : 'Unknown date'}
                      </p>
                    </div>
                    <p className="text-[#ededed]">{comment.content}</p>
                  </Card>
                ))}
              </div>
            </div>
          </Container>
        </main>
      </div>
    </div>
  );
}