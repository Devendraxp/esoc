'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import useSWR from 'swr';
import { useTheme } from 'next-themes';
import Container from '../components/Container';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import ThemeToggle from '../components/ThemeToggle';
import PostCard from '../components/PostCard';

// Fetcher function for SWR
const fetcher = (url) => fetch(url).then((res) => res.json());

export default function Home() {
  // State for user role
  const [userRole, setUserRole] = useState('normal');
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Fix for hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // State for posts and pagination
  const [allPosts, setAllPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef(null);

  // Theme-aware style classes
  const bgClass = theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50';
  const textClass = theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800';
  const headerBgClass = theme === 'dark' ? 'bg-zinc-900' : 'bg-white';
  const borderClass = theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200';
  const secondaryTextClass = theme === 'dark' ? 'text-zinc-500' : 'text-zinc-600';
  const spinnerClass = theme === 'dark' ? 'border-[#ededed]' : 'border-zinc-700';
  
  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUserRole(userData.role);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };
    
    fetchUserRole();
  }, []);

  // Fetch initial posts using SWR
  const { data, error, isLoading, mutate } = useSWR(`/api/posts?page=1&limit=10`, fetcher);

  // Update posts when data changes
  useEffect(() => {
    if (data && data.posts) {
      setAllPosts(Array.isArray(data.posts) ? data.posts : []);
      setHasMore(data.pagination?.hasMore || false);
    }
  }, [data]);

  // Intersection observer for infinite scrolling
  const handleObserver = useCallback(
    (entries) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !isLoadingMore) {
        loadMorePosts();
      }
    },
    [hasMore, isLoadingMore]
  );

  // Set up the intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '20px',
      threshold: 0.1,
    });
    
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    
    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [handleObserver, loaderRef]);

  // Load more posts function
  const loadMorePosts = async () => {
    if (!hasMore || isLoadingMore) return;
    
    setIsLoadingMore(true);
    const nextPage = page + 1;
    
    try {
      const response = await fetch(`/api/posts?page=${nextPage}&limit=10`);
      const newData = await response.json();
      
      if (newData && newData.posts) {
        const newPosts = Array.isArray(newData.posts) ? newData.posts : [];
        setAllPosts(prevPosts => [...prevPosts, ...newPosts]);
        setPage(nextPage);
        setHasMore(newData.pagination?.hasMore || false);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Handle new comment added - refresh posts
  const handleCommentAdded = () => {
    mutate();
  };

  if (!mounted) {
    return null; // Prevent hydration issues
  }

  return (
    <div className={`flex min-h-screen ${bgClass} ${textClass}`}>
      {/* Sidebar */}
      <Sidebar userRole={userRole} />

      {/* Main content */}
      <div className="flex-1 md:ml-64 w-full">
        <header className={`sticky top-0 z-10 ${headerBgClass} border-b ${borderClass} p-4 flex justify-between items-center`}>
          <h1 className={`text-xl md:text-2xl font-bold ${textClass} text-center flex-1 pl-8 md:pl-0`}>Home</h1>
          <ThemeToggle />
        </header>

        <main className="p-4 md:p-8 pb-20 md:pb-8">
            <h2 className={`text-lg md:text-xl font-semibold mb-6 md:mb-8 ${textClass}`}>Recent Posts</h2>
            
            {isLoading && !allPosts.length && (
              <div className="flex justify-center items-center h-40">
                <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${spinnerClass}`}></div>
              </div>
            )}

            {error && (
              <Card className="bg-red-900/20 text-red-300 border border-red-800 mb-6">
                <p>Error loading posts. Please try again.</p>
              </Card>
            )}

            {allPosts && allPosts.length === 0 && !isLoading && (
              <Card className="bg-blue-900/20 text-blue-300 mb-6">
                <p>No posts available. Be the first to post!</p>
              </Card>
            )}

            {/* Vertical Post Feed for both mobile and desktop */}
            <div className="space-y-6 max-w-2xl mx-auto">
              {Array.isArray(allPosts) && allPosts.map((post) => (
                <PostCard 
                  key={post._id} 
                  post={post}
                  onCommentAdded={handleCommentAdded}
                />
              ))}
              
              {/* Loading indicator for infinite scroll */}
              {hasMore && (
                <div ref={loaderRef} className="flex justify-center items-center py-4">
                  {isLoadingMore && (
                    <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${spinnerClass}`}></div>
                  )}
                </div>
              )}
              
              {/* End of posts message */}
              {!hasMore && allPosts.length > 0 && (
                <div className={`text-center ${secondaryTextClass} py-4`}>
                  <p>You've reached the end of the posts</p>
                </div>
              )}
            </div>
        </main>
      </div>
    </div>
  );
}
