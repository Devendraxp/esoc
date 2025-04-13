'use client';

import React from 'react';
import useSWR from 'swr';
import Container from '../components/Container';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import ThemeToggle from '../components/ThemeToggle';
import PostCard from '../components/PostCard';

// Fetcher function for SWR
const fetcher = (url) => fetch(url).then((res) => res.json());

export default function Home() {
  // Fetch posts using SWR
  const { data: posts, error, isLoading, mutate } = useSWR('/api/posts', fetcher);

  // Handle new comment added - refresh posts
  const handleCommentAdded = () => {
    mutate();
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-[#ededed]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 ml-64">
        <header className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#ededed]">Home</h1>
          <ThemeToggle />
        </header>

        <main className="p-8">
          <Container className="py-6">
            <h2 className="text-xl font-semibold mb-8 text-[#ededed]">Recent Posts</h2>
            
            {isLoading && (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ededed]"></div>
              </div>
            )}

            {error && (
              <Card className="bg-red-900/20 text-red-300 border border-red-800 mb-6">
                <p>Error loading posts. Please try again.</p>
              </Card>
            )}

            {posts && posts.length === 0 && (
              <Card className="bg-blue-900/20 text-blue-300 mb-6">
                <p>No posts available. Be the first to post!</p>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts && posts.map((post) => (
                <PostCard 
                  key={post._id} 
                  post={post}
                  onCommentAdded={handleCommentAdded}
                />
              ))}
            </div>
          </Container>
        </main>
      </div>
    </div>
  );
}
