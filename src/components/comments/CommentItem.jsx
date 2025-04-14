// filepath: /home/dev/projects/esoc/src/components/comments/CommentItem.jsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import ReportCommentModal from '../reports/ReportCommentModal';

export default function CommentItem({ comment, postId, onCommentDeleted }) {
  const { user, isSignedIn } = useUser();
  const [showOptions, setShowOptions] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const optionsRef = useRef(null);
  
  // Check if user is the comment author
  const isAuthor = user && (comment.author?.clerkId === user.id);
  
  // Check if user is special or admin
  const isSpecialOrAdmin = userRole === 'special' || userRole === 'admin';
  
  // Format the creation time
  const timeAgo = comment.createdAt
    ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })
    : 'some time ago';
  
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
  
  // Handle options toggle
  const toggleOptions = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowOptions(prev => !prev);
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
  
  // Handle delete comment
  const handleDeleteComment = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      try {
        // If user is a special user or admin, use the special delete endpoint
        const endpoint = isSpecialOrAdmin && !isAuthor 
          ? `/api/posts/comments/${comment._id}/delete` 
          : `/api/posts/comments/${comment._id}`;
          
        const response = await fetch(endpoint, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          if (onCommentDeleted) {
            onCommentDeleted(comment._id);
          }
          // Provide feedback to the user
          alert('Comment deleted successfully');
        } else {
          alert('Failed to delete comment');
        }
      } catch (error) {
        console.error('Error deleting comment:', error);
        alert('Error deleting comment');
      }
    }
    
    setShowOptions(false);
  };
  
  // Handle report comment
  const openReportModal = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowOptions(false);
    setShowReportModal(true);
  };
  
  // Handle closing report modal
  const closeReportModal = () => {
    setShowReportModal(false);
  };
  
  // Helper function to get the author name
  const getAuthorName = () => {
    if (comment.author.firstName && comment.author.lastName) {
      return `${comment.author.firstName} ${comment.author.lastName}`;
    } else if (comment.author.username) {
      return comment.author.username;
    } else {
      return comment.author.clerkId || 'Anonymous';
    }
  };
  
  // Check if author is verified/special
  const isAuthorVerified = comment.author.role === 'special' || comment.author.role === 'admin';
  
  return (
    <div className="border-b border-zinc-800 py-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden relative border border-zinc-700">
            <Image 
              src={comment.author.profileImageUrl || "/avatars/default.png"} 
              alt={getAuthorName()}
              width={32}
              height={32}
              className="object-cover"
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-sm font-medium text-[#ededed] flex items-center">
                {getAuthorName()}
                {isAuthorVerified && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-1 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </h4>
              <span className="text-xs text-zinc-500">{timeAgo}</span>
              
              {comment.author.profile_location && (
                <p className="text-xs text-zinc-500 mt-0.5 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {comment.author.profile_location}
                </p>
              )}
            </div>
            
            <div className="flex items-center">
              {/* Direct buttons for special users */}
              {isSpecialOrAdmin && !isAuthor && (
                <button 
                  onClick={handleDeleteComment}
                  className="text-red-400 hover:text-red-300 text-xs mr-2 bg-zinc-800 hover:bg-red-900/30 px-2 py-1 rounded transition"
                  title="Delete Comment (Special User)"
                >
                  Delete
                </button>
              )}
              <button 
                onClick={openReportModal}
                className="text-yellow-400 hover:text-yellow-300 text-xs mr-2 bg-zinc-800 hover:bg-yellow-900/30 px-2 py-1 rounded transition"
                title="Report Comment"
              >
                Report
              </button>
              
              {/* Options menu */}
              <div className="relative">
                <button 
                  onClick={toggleOptions}
                  className="text-zinc-400 hover:text-blue-400 p-1 transition rounded-full hover:bg-zinc-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M12 6a2 2 0 100-4 2 2 0 000 4zm0 7a2 2 0 100-4 2 2 0 000 4zm0 7a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                </button>
                {showOptions && (
                  <div 
                    ref={optionsRef} 
                    className="absolute right-0 mt-1 w-48 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg z-10"
                  >
                    {isAuthor && (
                      <button 
                        onClick={handleDeleteComment}
                        className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-zinc-700 hover:text-white"
                      >
                        Delete Comment
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Comment content */}
          <p className="text-[#ededed] whitespace-pre-wrap mt-1">{comment.content}</p>
        </div>
      </div>
      
      {/* Report comment modal */}
      <ReportCommentModal 
        isOpen={showReportModal}
        onClose={closeReportModal}
        postId={postId}
        commentId={comment._id}
        commentContent={comment.content}
      />
    </div>
  );
}