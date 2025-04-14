// filepath: /home/dev/projects/esoc/src/components/reports/ReportPostModal.jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReportPostModal({ isOpen, onClose, postId, postContent }) {
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const router = useRouter();
  
  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      if (!details.trim()) {
        throw new Error('Please provide details about why you are reporting this post');
      }
      
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'post',
          postId,
          content: details
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to report post');
      }
      
      setSuccess('Post reported successfully');
      
      // Clear form and close modal after a delay
      setTimeout(() => {
        setDetails('');
        onClose();
        router.refresh();
      }, 2000);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={(e) => e.stopPropagation()}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">Report Post</h2>
        
        <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Post Content:</p>
          <p className="text-sm mt-1">{postContent}</p>
        </div>
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md">
            {success}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Please provide details about why you're reporting this post:
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full p-2 border rounded-md min-h-[100px] bg-white dark:bg-gray-700 text-black dark:text-white"
              placeholder="Please explain why this post should be reported..."
              disabled={isSubmitting}
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Report Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}