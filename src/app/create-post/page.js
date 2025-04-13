'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from '@clerk/nextjs';
import Container from '../../components/Container';
import Sidebar from '../../components/Sidebar';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Card from '../../components/Card';
import ThemeToggle from '../../components/ThemeToggle';

export default function CreatePost() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const userId = isLoaded && isSignedIn ? user.id : null;
  
  // State for form data
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setMediaFiles(prevFiles => [...prevFiles, ...files]);
    
    // Create preview URLs for images
    const newPreviewUrls = files.map(file => {
      const fileType = file.type.split('/')[0];
      if (fileType === 'image') {
        return {
          type: 'image',
          url: URL.createObjectURL(file),
          name: file.name
        };
      } else if (fileType === 'video') {
        return {
          type: 'video',
          url: URL.createObjectURL(file),
          name: file.name
        };
      } else if (fileType === 'audio') {
        return {
          type: 'audio',
          url: URL.createObjectURL(file),
          name: file.name
        };
      } else {
        return {
          type: 'document',
          url: '#',
          name: file.name
        };
      }
    });
    
    setPreviewUrls(prevUrls => [...prevUrls, ...newPreviewUrls]);
  };
  
  // Remove a file from the selection
  const removeFile = (index) => {
    const newMediaFiles = [...mediaFiles];
    const newPreviewUrls = [...previewUrls];
    
    // Revoke the URL to avoid memory leaks
    if (newPreviewUrls[index].url !== '#') {
      URL.revokeObjectURL(newPreviewUrls[index].url);
    }
    
    newMediaFiles.splice(index, 1);
    newPreviewUrls.splice(index, 1);
    
    setMediaFiles(newMediaFiles);
    setPreviewUrls(newPreviewUrls);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Post content is required');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // In a real application, you'd use FormData to upload files
      const formData = new FormData();
      formData.append('content', content);
      mediaFiles.forEach(file => formData.append('media', file));
      
      // For demo purposes, we'll just simulate a successful post
      // const response = await fetch('/api/posts', {
      //   method: 'POST',
      //   body: formData
      // });
      
      // Simulate a delay for the demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clear form after successful submission
      setContent('');
      
      // Revoke all object URLs to avoid memory leaks
      previewUrls.forEach(item => {
        if (item.url !== '#') {
          URL.revokeObjectURL(item.url);
        }
      });
      
      setMediaFiles([]);
      setPreviewUrls([]);
      
      // Redirect to home page
      router.push('/');
    } catch (error) {
      setError('Failed to create post. Please try again.');
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <SignedIn>
        <div className="flex min-h-screen bg-[#0a0a0a] text-[#ededed]">
          {/* Sidebar */}
          <Sidebar />

          {/* Main content */}
          <div className="flex-1 ml-64">
            <header className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-[#ededed]">Create Post</h1>
              <ThemeToggle />
            </header>

            <main className="p-8">
              <Container className="py-6">
                <Card className="mb-6">
                  <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                      <label htmlFor="content" className="block text-sm font-medium text-[#ededed] mb-2">
                        Post Content
                      </label>
                      <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={5}
                        className="w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-800 text-[#ededed] focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Share important information with your community..."
                      />
                    </div>
                    
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-[#ededed] mb-2">
                        Media Attachments
                      </label>
                      <div className="flex items-center">
                        <label className="cursor-pointer bg-zinc-800 px-4 py-2 rounded-md hover:bg-zinc-700 text-[#ededed]">
                          <span>Add Files</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                        <span className="ml-3 text-sm text-zinc-400">
                          Add images, videos, audio, or documents
                        </span>
                      </div>
                    </div>
                    
                    {/* Preview area for selected files */}
                    {previewUrls.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-medium text-[#ededed] mb-3">
                          Selected Files ({previewUrls.length})
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                          {previewUrls.map((item, index) => (
                            <div 
                              key={index} 
                              className="relative bg-zinc-900 rounded-md overflow-hidden border border-zinc-800"
                            >
                              {item.type === 'image' && (
                                <div className="h-32 w-full relative">
                                  <img
                                    src={item.url}
                                    alt={item.name}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              )}
                              {item.type === 'video' && (
                                <div className="h-32 w-full relative bg-black flex items-center justify-center">
                                  <video
                                    src={item.url}
                                    className="h-full w-full object-contain"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="bg-black bg-opacity-50 text-[#ededed] px-2 py-1 rounded-md text-xs">
                                      Video
                                    </span>
                                  </div>
                                </div>
                              )}
                              {item.type === 'audio' && (
                                <div className="h-32 w-full flex items-center justify-center bg-blue-900/20">
                                  <span className="text-blue-300">
                                    Audio File
                                  </span>
                                </div>
                              )}
                              {item.type === 'document' && (
                                <div className="h-32 w-full flex items-center justify-center bg-zinc-800">
                                  <span className="text-[#ededed]">
                                    Document
                                  </span>
                                </div>
                              )}
                              <div className="p-3 text-xs truncate text-[#ededed]">
                                {item.name}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                                aria-label="Remove file"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {error && (
                      <div className="mb-6 bg-red-900/20 text-red-300 p-4 rounded-md text-sm">
                        {error}
                      </div>
                    )}
                    
                    <div className="flex justify-end space-x-4 mt-8">
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={() => router.push('/')}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Creating...' : 'Create Post'}
                      </Button>
                    </div>
                  </form>
                </Card>
              </Container>
            </main>
          </div>
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}