'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import useSWR from 'swr';
import Sidebar from '../../components/Sidebar';
import Card from '../../components/Card';
import ThemeToggle from '../../components/ThemeToggle';
import PostCard from '../../components/PostCard';

// Fetcher function for SWR
const fetcher = (url) => fetch(url).then((res) => res.json());

export default function UrgentNotifications() {
  // State for user role
  const [userRole, setUserRole] = useState('normal');
  
  // State for admin posts and pagination
  const [adminPosts, setAdminPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef(null);
  
  // For mobile view, show one post at a time
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
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

  // Fetch posts with SWR, using larger limit since we're filtering
  const { data, error, isLoading, mutate } = useSWR(`/api/posts?page=1&limit=50`, fetcher);

  // Filter and update admin posts when data changes
  useEffect(() => {
    if (data && data.posts) {
      // Filter posts to only include those created by admin users
      const filteredPosts = Array.isArray(data.posts) 
        ? data.posts.filter(post => 
            post.author && 
            (post.author.role === 'admin' || 
             (typeof post.author === 'object' && post.author.role === 'admin'))
          )
        : [];
      
      setAdminPosts(filteredPosts);
      setHasMore(data.pagination?.hasMore || false);
    }
  }, [data]);
  
  // Effect to handle mobile view detection for pagination
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      // Update currentPostIndex if needed when resizing
      if (window.innerWidth < 768 && currentPostIndex >= adminPosts.length) {
        setCurrentPostIndex(Math.max(0, adminPosts.length - 1));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [adminPosts.length, currentPostIndex]);

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
      const response = await fetch(`/api/posts?page=${nextPage}&limit=50`);
      const newData = await response.json();
      
      if (newData && newData.posts) {
        // Filter new posts for admin posts
        const newAdminPosts = Array.isArray(newData.posts) 
          ? newData.posts.filter(post => 
              post.author && 
              (post.author.role === 'admin' || 
               (typeof post.author === 'object' && post.author.role === 'admin'))
            )
          : [];
          
        setAdminPosts(prevPosts => [...prevPosts, ...newAdminPosts]);
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
  
  // Mobile post navigation
  const goToPrevPost = () => {
    if (currentPostIndex > 0) {
      setCurrentPostIndex(currentPostIndex - 1);
    }
  };

  const goToNextPost = () => {
    if (currentPostIndex < adminPosts.length - 1) {
      setCurrentPostIndex(currentPostIndex + 1);
    } else if (hasMore) {
      // Load more posts if we've reached the end and there are more available
      loadMorePosts().then(() => {
        setCurrentPostIndex(currentPostIndex + 1);
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-[#ededed]">
      {/* Sidebar */}
      <Sidebar userRole={userRole} />

      {/* Main content */}
      <div className="flex-1 md:ml-64 w-full">
        <header className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold text-[#ededed] text-center flex-1 pl-8 md:pl-0">Urgent Notifications</h1>
          <ThemeToggle />
        </header>

        <main className="p-4 md:p-8 pb-20 md:pb-8">
          <div className="py-4 md:py-6">
            <div className="mb-6 md:mb-8">
              <h2 className="text-lg md:text-xl font-semibold mb-1 md:mb-2 text-[#ededed]">Admin Announcements</h2>
              <p className="text-sm md:text-base text-zinc-400">Important announcements and updates from administrators</p>
            </div>
            
            {isLoading && !adminPosts.length && (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ededed]"></div>
              </div>
            )}

            {error && (
              <Card className="bg-red-900/20 text-red-300 border border-red-800 mb-6">
                <p className="text-sm md:text-base">Error loading announcements. Please try again.</p>
              </Card>
            )}

            {adminPosts && adminPosts.length === 0 && !isLoading && (
              <Card className="bg-blue-900/20 text-blue-300 mb-6">
                <p className="text-sm md:text-base">No admin announcements available at this time.</p>
              </Card>
            )}
            
            {/* Mobile View: Single Post with Navigation */}
            <div className="md:hidden">
              {adminPosts.length > 0 && (
                <>
                  {/* Current post */}
                  <div className="mb-4">
                    <PostCard 
                      key={adminPosts[currentPostIndex]?._id} 
                      post={adminPosts[currentPostIndex]}
                      onCommentAdded={handleCommentAdded}
                    />
                  </div>
                  
                  {/* Post navigation controls */}
                  <div className="flex justify-between items-center mt-6 mb-4">
                    <button 
                      onClick={goToPrevPost} 
                      disabled={currentPostIndex <= 0}
                      className={`px-4 py-2 rounded-md flex items-center ${
                        currentPostIndex <= 0 
                          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                          : 'bg-zinc-800 text-[#ededed] hover:bg-zinc-700'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                      Previous
                    </button>
                    
                    <span className="text-zinc-400 text-sm">
                      {currentPostIndex + 1} of {adminPosts.length}{hasMore ? '+' : ''}
                    </span>
                    
                    <button 
                      onClick={goToNextPost} 
                      disabled={currentPostIndex >= adminPosts.length - 1 && !hasMore}
                      className={`px-4 py-2 rounded-md flex items-center ${
                        currentPostIndex >= adminPosts.length - 1 && !hasMore
                          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                          : 'bg-zinc-800 text-[#ededed] hover:bg-zinc-700'
                      }`}
                    >
                      Next
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  </div>
                </>
              )}
              
              {/* Mobile loading indicator */}
              {isLoadingMore && (
                <div className="flex justify-center items-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ededed]"></div>
                </div>
              )}
            </div>

            {/* Desktop View: Grid Layout */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {Array.isArray(adminPosts) && adminPosts.map((post) => (
                <PostCard 
                  key={post._id} 
                  post={post}
                  onCommentAdded={handleCommentAdded}
                />
              ))}
            </div>
            
            {/* Loading indicator for infinite scroll (desktop only) */}
            <div className="hidden md:block">
              {hasMore && (
                <div ref={loaderRef} className="flex justify-center items-center py-8">
                  {isLoadingMore && (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ededed]"></div>
                  )}
                </div>
              )}
            </div>
            
            {/* End of posts message */}
            {!hasMore && adminPosts.length > 0 && (
              <div className="text-center text-zinc-500 py-6 md:py-8">
                <p className="text-sm md:text-base">You've seen all admin announcements</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}