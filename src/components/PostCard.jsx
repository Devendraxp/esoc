'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import Card from './Card';
import Button from './Button';
import Input from './Input';
import { useUser } from '@clerk/nextjs';
import { mutate } from 'swr';

const PostCard = ({ post, onCommentAdded }) => {
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authorData, setAuthorData] = useState(null);
  
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
  
  // Format the creation time to show "X time ago"
  const timeAgo = post.createdAt 
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
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
    if (post.authorDetails) {
      if (post.authorDetails.firstName && post.authorDetails.lastName) {
        return `${post.authorDetails.firstName} ${post.authorDetails.lastName}`;
      } else if (post.authorDetails.name) {
        return post.authorDetails.name;
      } else if (post.authorDetails.username) {
        return post.authorDetails.username;
      }
    }
    
    // Fallback to clerkId or anonymous
    return post.author?.clerkId || 'Anonymous';
  };
  
  const getAuthorUsername = () => {
    if (authorData?.username) {
      return authorData.username;
    } else if (post.authorDetails?.username) {
      return post.authorDetails.username;
    } else {
      return post.author?.clerkId || 'user';
    }
  };
  
  const getAuthorProfileImage = () => {
    if (authorData?.profileImageUrl) {
      return authorData.profileImageUrl;
    } else if (post.authorDetails?.profileImageUrl) {
      return post.authorDetails.profileImageUrl;
    } else {
      return "/avatars/default.png";
    }
  };
  
  // Handle upvote
  const handleUpvote = async (e) => {
    e.stopPropagation();
    if (!isSignedIn) return;
    
    try {
      await fetch(`/api/posts/${post._id}/like`, {
        method: 'POST',
      });
      // Refresh the post data
      mutate('/api/posts');
      if (onCommentAdded) onCommentAdded();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };
  
  // Handle downvote
  const handleDownvote = async (e) => {
    e.stopPropagation();
    if (!isSignedIn) return;
    
    try {
      await fetch(`/api/posts/${post._id}/dislike`, {
        method: 'POST',
      });
      // Refresh the post data
      mutate('/api/posts');
      if (onCommentAdded) onCommentAdded();
    } catch (error) {
      console.error('Error disliking post:', error);
    }
  };
  
  // Handle posting a reply
  const handleSubmitReply = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!replyText.trim() || !isSignedIn) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/posts/${post._id}/comments`, {
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
  
  // Handle clicking on the post
  const handlePostClick = () => {
    router.push(`/posts/${post._id}`);
  };
  
  // Render media content
  const renderMedia = () => {
    if (!post.media || post.media.length === 0) return null;
    
    return (
      <div className="mb-4 overflow-hidden rounded-lg">
        {post.media.map((item, index) => {
          if (item.type === 'image') {
            return (
              <div key={index} className="relative w-full h-48 mb-2">
                <Image 
                  src={item.url} 
                  alt="Post media" 
                  fill 
                  className="object-cover rounded-lg"
                />
              </div>
            );
          } else if (item.type === 'video') {
            return (
              <div key={index} className="mb-2">
                <video 
                  src={item.url} 
                  controls 
                  className="w-full rounded-lg" 
                  onClick={e => e.stopPropagation()}
                />
              </div>
            );
          } else if (item.type === 'audio') {
            return (
              <div key={index} className="mb-2 bg-zinc-800 rounded-lg p-2">
                <audio 
                  src={item.url} 
                  controls 
                  className="w-full" 
                  onClick={e => e.stopPropagation()}
                />
              </div>
            );
          } else {
            return (
              <div key={index} className="mb-2 text-blue-400 underline">
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                >
                  {item.url.split('/').pop() || 'Attached file'}
                </a>
              </div>
            );
          }
        })}
      </div>
    );
  };
  
  return (
    <Card 
      className="hover:border-blue-700 transition-colors cursor-pointer overflow-hidden"
    >
      <div onClick={handlePostClick}>
        <div className="flex items-start space-x-3 mb-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden relative">
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
            <div className="flex items-baseline">
              <h3 className="text-sm font-medium text-[#ededed] mr-2 truncate">{getAuthorDisplayName()}</h3>
              <span className="text-xs text-zinc-500">{timeAgo}</span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">@{getAuthorUsername()}</p>
            {(authorData?.profile_location || post.authorDetails?.profile_location) && (
              <p className="text-xs text-zinc-500 mt-0.5 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {authorData?.profile_location || post.authorDetails?.profile_location}
              </p>
            )}
          </div>
        </div>
        
        {/* Post media */}
        {renderMedia()}
        
        {/* Post content */}
        <p className="text-[#ededed] mb-6 whitespace-pre-wrap line-clamp-6">{post.content}</p>
      </div>
      
      {/* Interaction buttons */}
      <div className="flex items-center border-t border-zinc-800 pt-4 mt-2">
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleUpvote}
            className={`flex items-center hover:text-green-400 transition ${
              post.likes?.includes(user?.id) ? 'text-green-400' : 'text-zinc-400'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-1">
              <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z" />
            </svg>
            <span>{post.likes?.length || 0}</span>
          </button>
          
          <button 
            onClick={handleDownvote}
            className={`flex items-center hover:text-red-400 transition ${
              post.dislikes?.includes(user?.id) ? 'text-red-400' : 'text-zinc-400'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-1">
              <path d="M15.73 5.25h1.035A7.465 7.465 0 0118 9.375a7.465 7.465 0 01-1.235 4.125h-.148c-.806 0-1.534.446-2.031 1.08a9.04 9.04 0 01-2.861 2.4c-.723.384-1.35-.956-1.653 1.715a4.498 4.498 0 00-.322 1.672V21a.75.75 0 01-.75.75 2.25 2.25 0 01-2.25-2.25c0-1.152.26-2.243.723-3.218.266-.558-.107-1.282-.725-1.282H3.622c-1.026 0-1.945-.694-2.054-1.715A12.134 12.134 0 011.5 12c0-2.848.992-5.464 2.649-7.521.388-.482.987-.729 1.605-.729H9.77a4.5 4.5 0 011.423.23l3.114 1.04a4.5 4.5 0 001.423.23zM21.669 13.773c.536-1.362.831-2.845.831-4.398 0-1.22-.182-2.398-.52-3.507-.26-.85-1.084-1.368-1.973-1.368H19.1c-.445 0-.72.498-.523.898.591 1.2.924 2.55.924 3.977a8.959 8.959 0 01-1.302 4.666c-.245.403.028.959.5.959h1.053c.832 0 1.612-.453 1.918-1.227z" />
            </svg>
            <span>{post.dislikes?.length || 0}</span>
          </button>
        </div>
      </div>
      
      {/* Reply input (always shown) */}
      <div className="mt-4 border-t border-zinc-800 pt-4" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmitReply} className="flex items-center space-x-2">
          <Input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Reply..."
            className="flex-1"
          />
          <Button 
            type="submit"
            disabled={isSubmitting || !replyText.trim() || !isSignedIn}
            className="text-sm py-1 px-2 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </Button>
        </form>
      </div>
    </Card>
  );
};

export default PostCard;