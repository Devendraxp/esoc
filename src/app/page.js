'use client';

import React from 'react';
import useSWR from 'swr';
import { format } from 'date-fns';
import Container from '../components/Container';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import ThemeToggle from '../components/ThemeToggle';

// Fetcher function for SWR
const fetcher = (url) => fetch(url).then((res) => res.json());

export default function Home() {
  // Fetch posts using SWR
  const { data: posts, error, isLoading } = useSWR('/api/posts', fetcher);

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
                <Card key={post._id} className="flex flex-col hover:border-blue-700 transition-colors">
                  <div className="flex-1 mb-4">
                    <p className="text-[#ededed] mb-4 line-clamp-3">{post.content}</p>
                    
                    {post.media && post.media.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-[#a1a1aa]">
                          {post.media.length} media attachment{post.media.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-[#ededed]">
                        {post.author?.clerkId || 'Anonymous'}
                      </p>
                      <p className="text-xs text-[#a1a1aa]">
                        {post.createdAt ? format(new Date(post.createdAt), 'MMM d, yyyy • h:mm a') : 'Unknown date'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-[#a1a1aa]">{post.likes?.length || 0} ❤️</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Container>
        </main>
      </div>
    </div>
  );
}
