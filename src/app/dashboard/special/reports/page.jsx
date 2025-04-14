'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function SpecialReports() {
  const { isSignedIn, user } = useUser();
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('pending');
  
  useEffect(() => {
    // Fetch reports
    const fetchReports = async () => {
      if (!isSignedIn) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/reports?status=${filter}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch reports');
        }
        
        const data = await response.json();
        console.log('Reports data:', data);
        setReports(data);
      } catch (error) {
        console.error('Error fetching reports:', error);
        setError('An error occurred while fetching reports. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReports();
  }, [isSignedIn, filter]);
  
  // Handle report actions
  const handleReportAction = async (reportId, action) => {
    try {
      const response = await fetch('/api/reports/handle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId,
          action
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process report');
      }
      
      // Update the reports list
      setReports(prevReports => 
        prevReports.filter(report => report._id !== reportId)
      );
      
      // Show success message
      alert(`Report ${action === 'agree' ? 'approved and content deleted' : action === 'disagree' ? 'dismissed' : 'marked as read'}`);
      
    } catch (error) {
      console.error('Error handling report:', error);
      alert('An error occurred. Please try again.');
    }
  };
  
  // Navigate to the reported content
  const viewContent = (report) => {
    if (report.type === 'post' && report.post) {
      router.push(`/posts/${report.post._id}`);
    } else if (report.type === 'comment' && report.post) {
      router.push(`/posts/${report.post._id}#comment-${report.comment?._id}`);
    }
  };
  
  // Render report content based on type
  const renderReportContent = (report) => {
    if (report.type === 'post') {
      return report.post?.content || 'Post content unavailable';
    } else if (report.type === 'comment') {
      return report.comment?.content || 'Comment content unavailable';
    }
    return 'Content unavailable';
  };
  
  if (!isSignedIn) {
    return (
      <div className="p-6 text-center">
        <p>Please sign in to access this page.</p>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Reports Management</h1>
      
      {/* Filter tabs */}
      <div className="flex mb-6 border-b border-zinc-700">
        <button 
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 font-medium ${filter === 'pending' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-zinc-400'}`}
        >
          Pending
        </button>
        <button 
          onClick={() => setFilter('agreed')}
          className={`px-4 py-2 font-medium ${filter === 'agreed' ? 'text-green-500 border-b-2 border-green-500' : 'text-zinc-400'}`}
        >
          Approved
        </button>
        <button 
          onClick={() => setFilter('disagreed')}
          className={`px-4 py-2 font-medium ${filter === 'disagreed' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-400'}`}
        >
          Dismissed
        </button>
      </div>
      
      {/* Error state */}
      {error && (
        <div className="bg-red-900/20 text-red-500 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {/* Loading state */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-blue-600 animate-spin"></div>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-zinc-800 rounded-md p-6 text-center">
          <p className="text-zinc-400">No {filter} reports found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reports.map(report => (
            <div key={report._id} className="bg-zinc-800 rounded-md overflow-hidden">
              <div className="p-4 border-b border-zinc-700">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-medium bg-blue-900/30 text-blue-400 px-2 py-1 rounded">
                      {report.type === 'post' ? 'Post Report' : 'Comment Report'}
                    </span>
                    <span className="ml-2 text-xs text-zinc-500">
                      Reported {new Date(report.createdAt).toLocaleDateString()} by {report.reporter?.username || 'unknown'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-3">
                  <h3 className="text-sm font-medium text-zinc-300">Report details:</h3>
                  <p className="text-zinc-400 mt-1">{report.content}</p>
                </div>
              </div>
              
              <div className="p-4 bg-zinc-900">
                <h3 className="text-sm font-medium text-zinc-300 mb-2">Reported Content:</h3>
                <div className="bg-zinc-800 p-3 rounded-md text-zinc-300">
                  {renderReportContent(report)}
                </div>
                
                <div className="mt-4 flex justify-end space-x-2">
                  {(report.post || report.comment) && (
                    <button 
                      onClick={() => viewContent(report)}
                      className="px-3 py-1.5 text-xs font-medium bg-zinc-700 text-zinc-300 rounded hover:bg-zinc-600"
                    >
                      View in Context
                    </button>
                  )}
                  
                  {filter === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleReportAction(report._id, 'agree')}
                        className="px-3 py-1.5 text-xs font-medium bg-green-900/30 text-green-400 rounded hover:bg-green-800"
                      >
                        Approve & Delete Content
                      </button>
                      <button 
                        onClick={() => handleReportAction(report._id, 'disagree')}
                        className="px-3 py-1.5 text-xs font-medium bg-red-900/30 text-red-400 rounded hover:bg-red-800"
                      >
                        Dismiss Report
                      </button>
                      <button 
                        onClick={() => handleReportAction(report._id, 'read')}
                        className="px-3 py-1.5 text-xs font-medium bg-zinc-700 text-zinc-300 rounded hover:bg-zinc-600"
                      >
                        Mark as Read
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}