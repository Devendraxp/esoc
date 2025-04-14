'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import useSWR from 'swr';
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
  
  // State for posts and pagination
  const [allPosts, setAllPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef(null);
  
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
      setAllPosts(data.posts);
      setHasMore(data.pagination.hasMore);
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
        setAllPosts(prevPosts => [...prevPosts, ...newData.posts]);
        setPage(nextPage);
        setHasMore(newData.pagination.hasMore);
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

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-[#ededed]">
      {/* Sidebar */}
      <Sidebar userRole={userRole} />

      {/* Main content */}
      <div className="flex-1 ml-64">
        <header className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#ededed]">Home</h1>
          <ThemeToggle />
        </header>

        <main className="p-8">
          <Container className="py-6">
            <h2 className="text-xl font-semibold mb-8 text-[#ededed]">Recent Posts</h2>
            
            {isLoading && !allPosts.length && (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ededed]"></div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {allPosts.map((post) => (
                <PostCard 
                  key={post._id} 
                  post={post}
                  onCommentAdded={handleCommentAdded}
                />
              ))}
            </div>
            
            {/* Loading indicator for infinite scroll */}
            {hasMore && (
              <div ref={loaderRef} className="flex justify-center items-center py-8">
                {isLoadingMore && (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ededed]"></div>
                )}
              </div>
            )}
            
            {/* End of posts message */}
            {!hasMore && allPosts.length > 0 && (
              <div className="text-center text-zinc-500 py-8">
                <p>You've reached the end of the posts</p>
              </div>
            )}
          </Container>
        </main>
      </div>
    </div>
  );
}
