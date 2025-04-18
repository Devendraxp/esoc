// filepath: /home/dev/projects/esoc/src/components/comments/CommentList.jsx
'use client';

import React, { useState, useEffect } from 'react';
import CommentItem from './CommentItem';

export default function CommentList({ postId, initialComments = [] }) {
  const [comments, setComments] = useState(initialComments);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMobileView, setIsMobileView] = useState(false);
  
  // Check mobile view on mount and window resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobileView(window.innerWidth < 640);
    };
    
    // Check on mount
    checkIfMobile();
    
    // Check on resize
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  useEffect(() => {
    // Update comments when initialComments changes
    setComments(initialComments);
  }, [initialComments]);
  
  const fetchComments = async () => {
    if (!postId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/posts/${postId}/comments`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Error loading comments. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle comment deletion
  const handleCommentDeleted = (deletedCommentId) => {
    setComments(prevComments => 
      prevComments.filter(comment => comment._id !== deletedCommentId)
    );
  };
  
  // If there are no comments and we're not loading, show a message
  if (comments.length === 0 && !isLoading) {
    return (
      <div className="py-3 sm:py-4 text-center text-zinc-500 text-xs sm:text-sm">
        No comments yet. Be the first to reply!
      </div>
    );
  }
  
  return (
    <div className="mt-2 sm:mt-4">
      {isLoading && (
        <div className="py-3 sm:py-4 text-center">
          <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full border-2 border-t-transparent border-blue-600 animate-spin mx-auto"></div>
        </div>
      )}
      
      {error && (
        <div className="py-2 sm:py-4 text-center text-red-500 text-xs sm:text-sm">
          {error}
          <button 
            onClick={fetchComments}
            className="ml-2 text-blue-500 hover:underline"
          >
            Try again
          </button>
        </div>
      )}
      
      <div className={`space-y-1 sm:space-y-0 ${isMobileView ? 'divide-y divide-zinc-800/50' : ''}`}>
        {comments.map(comment => (
          <CommentItem 
            key={comment._id} 
            comment={comment} 
            postId={postId}
            onCommentDeleted={handleCommentDeleted}
          />
        ))}
      </div>
    </div>
  );
}