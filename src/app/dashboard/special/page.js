'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { format } from 'date-fns';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';

import Container from '../../../components/Container';
import Sidebar from '../../../components/Sidebar';
import Button from '../../../components/Button';
import Card from '../../../components/Card';
import ThemeToggle from '../../../components/ThemeToggle';

// Fetcher function for SWR
const fetcher = (url) => fetch(url).then((res) => res.json());

export default function SpecialDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('aid');
  const [userRole, setUserRole] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null); // For the popup modal
  
  // Fetch user role
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        setUserRole(data.role);
        
        // Redirect if not a special user
        if (data.role !== 'special' && data.role !== 'admin') {
          router.push('/');
        }
        
        // If user has a profile_location, set it as the default selected region
        if (data.profile_location) {
          setSelectedRegion(data.profile_location);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };
    
    checkUserRole();
  }, [router]);

  // Fetch aid requests
  const { data: aidRequests, error: aidError, isLoading: aidLoading, mutate: refreshAidRequests } = useSWR(
    '/api/aid-requests/all?status=pending',
    fetcher
  );
  
  // Fetch approved aid requests assigned to this special user
  // Now fetching all in-progress aid requests that are not completed
  const { data: approvedRequests, error: approvedError, isLoading: approvedLoading, mutate: refreshApproved } = useSWR(
    '/api/aid-requests/all?acceptedByMe=true',
    fetcher
  );
  
  // Fetch reported posts without region filtering 
  const { data: reportedPosts, error: reportsError, isLoading: reportsLoading, mutate: refreshReports } = useSWR(
    `/api/reports/all`,
    fetcher
  );
  
  // Handle aid request approval
  const handleApproveAid = async (requestId) => {
    try {
      const response = await fetch(`/api/aid-requests/${requestId}/approve`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        console.error('Error approving request:', await response.text());
      }
      
      refreshAidRequests();
      setSelectedRequest(null); // Close the modal after action
    } catch (error) {
      console.error('Error approving aid request:', error);
    }
  };
  
  // Handle aid request denial
  const handleDenyAid = async (requestId) => {
    try {
      const response = await fetch(`/api/aid-requests/${requestId}/deny`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        console.error('Error denying request:', await response.text());
      }
      
      refreshAidRequests();
      setSelectedRequest(null); // Close the modal after action
    } catch (error) {
      console.error('Error denying aid request:', error);
    }
  };
  
  // Handle opening the request detail modal
  const openRequestDetail = (request) => {
    setSelectedRequest(request);
  };
  
  // Handle updating aid request status
  const handleUpdateAidStatus = async (requestId, status) => {
    try {
      const response = await fetch(`/api/aid-requests/${requestId}/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        console.error('Error updating request status:', await response.text());
      }
      
      // Refresh both pending and approved requests to ensure UI stays updated
      refreshApproved();
      refreshAidRequests();
    } catch (error) {
      console.error('Error updating aid request status:', error);
    }
  };
  
  // Handle completing an aid request
  const handleCompleteAid = async (requestId) => {
    try {
      const response = await fetch(`/api/aid-requests/${requestId}/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'completed' }),
      });
      
      if (!response.ok) {
        console.error('Error completing request:', await response.text());
      }
      
      // Refresh both pending and approved requests
      refreshApproved();
      refreshAidRequests();
    } catch (error) {
      console.error('Error completing aid request:', error);
    }
  };
  
  // Handle marking reported post as safe
  const handleMarkSafe = async (reportId) => {
    try {
      await fetch(`/api/reports/${reportId}/safe`, {
        method: 'POST',
      });
      
      refreshReports();
    } catch (error) {
      console.error('Error marking post as safe:', error);
    }
  };
  
  // Handle removing reported post
  const handleRemovePost = async (postId) => {
    try {
      await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });
      
      refreshReports();
    } catch (error) {
      console.error('Error removing post:', error);
    }
  };

  // Handle report actions with proper API calls
  const handleAgreeWithReport = async (reportId) => {
    try {
      const response = await fetch('/api/reports/handle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId,
          action: 'agree'
        }),
      });
      
      if (!response.ok) {
        console.error('Error handling report:', await response.text());
      }
      
      refreshReports();
    } catch (error) {
      console.error('Error handling report:', error);
    }
  };
  
  const handleDisagreeWithReport = async (reportId) => {
    try {
      const response = await fetch('/api/reports/handle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId,
          action: 'disagree'
        }),
      });
      
      if (!response.ok) {
        console.error('Error handling report:', await response.text());
      }
      
      refreshReports();
    } catch (error) {
      console.error('Error handling report:', error);
    }
  };
  
  // If still checking role, show loading
  if (userRole === null) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0a] justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ededed]"></div>
      </div>
    );
  }

  return (
    <>
      <SignedIn>
        <div className="flex min-h-screen bg-[#0a0a0a] text-[#ededed]">
          {/* Sidebar */}
          <Sidebar userRole={userRole} />

          {/* Main content */}
          <div className="flex-1 ml-64">
            <header className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-[#ededed]">Special Responder Dashboard</h1>
              <ThemeToggle />
            </header>

            <main className="p-8">
              <Container className="py-6">
                {/* Tab Navigation */}
                <div className="mb-8 border-b border-zinc-800">
                  <div className="flex">
                    <button
                      onClick={() => setActiveTab('aid')}
                      className={`py-3 px-6 font-medium text-sm ${
                        activeTab === 'aid'
                          ? 'border-b-2 border-primary text-primary'
                          : 'text-zinc-400 hover:text-[#ededed]'
                      }`}
                    >
                      Pending Aid
                    </button>
                    <button
                      onClick={() => setActiveTab('approved')}
                      className={`py-3 px-6 font-medium text-sm ${
                        activeTab === 'approved'
                          ? 'border-b-2 border-primary text-primary'
                          : 'text-zinc-400 hover:text-[#ededed]'
                      }`}
                    >
                      Approved Aid
                    </button>
                    <button
                      onClick={() => setActiveTab('reports')}
                      className={`py-3 px-6 font-medium text-sm ${
                        activeTab === 'reports'
                          ? 'border-b-2 border-primary text-primary'
                          : 'text-zinc-400 hover:text-[#ededed]'
                      }`}
                    >
                      Reported Posts
                    </button>
                  </div>
                </div>
                
                {/* Aid Requests Tab */}
                {activeTab === 'aid' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-[#ededed]">Pending Aid Requests</h2>
                    </div>
                    
                    {aidLoading ? (
                      <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ededed]"></div>
                      </div>
                    ) : aidError ? (
                      <Card className="bg-red-900/20 text-red-300 border border-red-800 mb-6">
                        <p>Error loading aid requests. Please try again.</p>
                      </Card>
                    ) : aidRequests?.length === 0 ? (
                      <Card className="bg-zinc-900 text-[#ededed] mb-6">
                        <p>No pending aid requests at this time.</p>
                      </Card>
                    ) : (
                      <div className="overflow-x-auto bg-zinc-900 rounded-lg shadow mb-6">
                        <table className="min-w-full divide-y divide-zinc-800">
                          <thead className="bg-zinc-800">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Region</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Requested On</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Requesters</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Additional Info</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                            {aidRequests?.map((request) => (
                              <tr 
                                key={request._id} 
                                className={`hover:bg-zinc-800/50 cursor-pointer ${
                                  request.requesterRole === 'special' ? 'bg-purple-900/20' : ''
                                }`}
                                onClick={() => openRequestDetail(request)}
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#ededed]">
                                  {request.requesterRole === 'special' && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-900 text-purple-200 mr-2">
                                      Priority
                                    </span>
                                  )}
                                  {request.region}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                                  {format(new Date(request.createdAt), 'MMM d, yyyy')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                                  {request.requesters?.length || 1} people
                                </td>
                                <td className="px-6 py-4 text-sm text-zinc-400 max-w-xs truncate">
                                  {request.adminNote || 'No additional information'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3 flex" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    onClick={() => handleApproveAid(request._id)}
                                    className="bg-green-800 hover:bg-green-700 text-[#ededed]"
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    onClick={() => handleDenyAid(request._id)}
                                    className="bg-red-900/50 hover:bg-red-900/70 text-[#ededed]"
                                  >
                                    Deny
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Approved Aid Tab */}
                {activeTab === 'approved' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-[#ededed]">Approved Aid Requests</h2>
                    </div>
                    
                    {approvedLoading ? (
                      <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ededed]"></div>
                      </div>
                    ) : approvedError ? (
                      <Card className="bg-red-900/20 text-red-300 border border-red-800 mb-6">
                        <p>Error loading approved aid requests. Please try again.</p>
                      </Card>
                    ) : approvedRequests?.length === 0 ? (
                      <Card className="bg-zinc-900 text-[#ededed] mb-6">
                        <p>No approved aid requests at this time.</p>
                      </Card>
                    ) : (
                      <div className="overflow-x-auto bg-zinc-900 rounded-lg shadow mb-6">
                        <table className="min-w-full divide-y divide-zinc-800">
                          <thead className="bg-zinc-800">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Region</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Approved On</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Requesters</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Delivery Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                            {approvedRequests?.map((request) => (
                              <tr 
                                key={request._id} 
                                className={`hover:bg-zinc-800/50 ${
                                  request.requesterRole === 'special' ? 'bg-purple-900/20' : ''
                                }`}
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#ededed]">
                                  {request.requesterRole === 'special' && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-900 text-purple-200 mr-2">
                                      Priority
                                    </span>
                                  )}
                                  {request.region}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                                  {format(new Date(request.respondedAt || request.updatedAt), 'MMM d, yyyy')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                                  {request.requesters?.length || 1} people
                                </td>
                                <td className="px-6 py-4 text-sm text-zinc-400">
                                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    request.status === 'approved' 
                                      ? 'bg-green-900/30 text-green-300'
                                      : request.status === 'received'
                                      ? 'bg-blue-900/30 text-blue-300'
                                      : request.status === 'prepared'
                                      ? 'bg-yellow-900/30 text-yellow-300'
                                      : request.status === 'shipped'
                                      ? 'bg-orange-900/30 text-orange-300'
                                      : request.status === 'delivered'
                                      ? 'bg-purple-900/30 text-purple-300'
                                      : request.status === 'completed'
                                      ? 'bg-indigo-900/30 text-indigo-300'
                                      : 'bg-zinc-800 text-zinc-300'
                                  }`}>
                                    {request.status === 'approved' ? 'Approved' : 
                                     request.status === 'received' ? 'Materials Received' :
                                     request.status === 'prepared' ? 'Aid Prepared' :
                                     request.status === 'shipped' ? 'Shipped' :
                                     request.status === 'delivered' ? 'Delivered' :
                                     request.status === 'completed' ? 'Completed' :
                                     'Unknown'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex items-center space-x-2">
                                    <select 
                                      className="bg-zinc-800 border border-zinc-700 rounded p-1.5 text-sm text-[#ededed]"
                                      onChange={(e) => handleUpdateAidStatus(request._id, e.target.value)}
                                      value={request.status}
                                    >
                                      <option value="approved">Approved</option>
                                      <option value="received">Materials Received</option>
                                      <option value="prepared">Aid Prepared</option>
                                      <option value="shipped">Shipped</option>
                                      <option value="delivered">Delivered</option>
                                    </select>
                                    
                                    <Button
                                      onClick={() => handleUpdateAidStatus(request._id, request.status)}
                                      className="bg-zinc-700 hover:bg-zinc-600 text-[#ededed] text-xs py-1 px-2"
                                    >
                                      Update
                                    </Button>
                                    
                                    <Button
                                      onClick={() => handleCompleteAid(request._id)}
                                      className="bg-purple-900/50 hover:bg-purple-900/70 text-[#ededed] text-xs py-1 px-2"
                                    >
                                      Complete
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Reported Posts Tab */}
                {activeTab === 'reports' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-[#ededed]">Reported Posts</h2>
                    </div>
                    
                    {reportsLoading ? (
                      <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ededed]"></div>
                      </div>
                    ) : reportsError ? (
                      <Card className="bg-red-900/20 text-red-300 border border-red-800 mb-6">
                        <p>Error loading reported posts. Please try again.</p>
                      </Card>
                    ) : !reportedPosts || reportedPosts.length === 0 ? (
                      <Card className="bg-zinc-900 text-[#ededed] mb-6">
                        <p>No reported posts at this time.</p>
                      </Card>
                    ) : (
                      <div className="space-y-8">
                        {reportedPosts.map((report) => (
                          <Card key={report._id} className="border border-yellow-800">
                            <div className="flex justify-between">
                              <div className="flex space-x-4 items-start">
                                <div className="bg-yellow-900/30 rounded-full p-2 text-yellow-300">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-[#ededed] mb-2">
                                    Reported by {
                                      typeof report.reporter === 'object' 
                                        ? (report.reporter?.firstName 
                                           ? `${report.reporter.firstName} ${report.reporter.lastName || ''}`.trim() 
                                           : report.reporter?.username || report.reporter?.clerkId || 'Anonymous')
                                        : (report.reporter || 'Anonymous')
                                    } • {report.content}
                                  </p>
                                  <p className="text-sm text-zinc-400 mb-6">
                                    Reported on {format(new Date(report.createdAt), 'MMM d, yyyy')}
                                  </p>
                                  
                                  <div className="bg-zinc-800 rounded-lg p-6 mb-6">
                                    <p className="text-[#ededed] line-clamp-3">{report.post?.content}</p>
                                    <p className="text-xs text-zinc-400 mt-3">
                                      Posted by {
                                        typeof report.post?.author === 'object'
                                          ? (report.post.author?.firstName
                                             ? `${report.post.author.firstName} ${report.post.author.lastName || ''}`.trim()
                                             : report.post.author?.username || report.post.author?.clerkId || 'Anonymous')
                                          : (report.post?.author || 'Anonymous')
                                      }
                                    </p>
                                  </div>
                                  
                                  {report.post?.fakeScore > 0 && (
                                    <div className="bg-orange-900/20 text-orange-300 p-3 rounded text-sm mb-4">
                                      ⚠️ Fake content score: {report.post.fakeScore}/10
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex space-x-3 mt-2">
                                <Button 
                                  variant="secondary"
                                  className="bg-green-900/30 text-green-300 hover:bg-green-900/50"
                                  onClick={() => handleDisagreeWithReport(report._id)}
                                >
                                  Dismiss Report
                                </Button>
                                <Button 
                                  className="bg-red-900/50 hover:bg-red-900/70 text-[#ededed]"
                                  onClick={() => handleAgreeWithReport(report._id)}
                                >
                                  Agree & Delete
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Aid Request Detail Modal */}
                {selectedRequest && (
                  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-2xl w-full overflow-hidden shadow-xl p-6 max-h-[90vh] overflow-y-auto">
                      {/* Close button */}
                      <div className="flex justify-end mb-4">
                        <button 
                          onClick={() => setSelectedRequest(null)}
                          className="text-zinc-400 hover:text-white p-1 rounded-full"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      <h2 className="text-xl font-semibold mb-4 text-[#ededed]">Aid Request Details</h2>
                      
                      <div className="bg-zinc-800 p-6 rounded-lg mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm font-medium text-zinc-400 mb-1">Region</p>
                            <p className="text-[#ededed] mb-4">
                              {selectedRequest.region}
                              {selectedRequest.requesterRole === 'special' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-900 text-purple-200 ml-2">
                                  Priority
                                </span>
                              )}
                            </p>
                            
                            <p className="text-sm font-medium text-zinc-400 mb-1">Requested On</p>
                            <p className="text-[#ededed] mb-4">{format(new Date(selectedRequest.createdAt), 'PPP')}</p>
                            
                            <p className="text-sm font-medium text-zinc-400 mb-1">Status</p>
                            <p className="text-[#ededed] mb-4">
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-900/30 text-yellow-300">
                                Pending
                              </span>
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-zinc-400 mb-1">Requesters</p>
                            <p className="text-[#ededed] mb-4">{selectedRequest.requesters?.length || 1} people</p>
                            
                            {selectedRequest.requesters && selectedRequest.requesters[0] && (
                              <>
                                <p className="text-sm font-medium text-zinc-400 mb-1">Requester Details</p>
                                <p className="text-[#ededed] mb-4">
                                  {selectedRequest.requesters[0].firstName 
                                    ? `${selectedRequest.requesters[0].firstName} ${selectedRequest.requesters[0].lastName || ''}`
                                    : selectedRequest.requesters[0].email || 'Anonymous'}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <p className="text-sm font-medium text-zinc-400 mb-2">Additional Information</p>
                          <p className="text-[#ededed] bg-zinc-900 p-4 rounded-md">
                            {selectedRequest.adminNote || 'No additional information provided.'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-4">
                        <Button
                          variant="secondary"
                          onClick={() => setSelectedRequest(null)}
                          className="px-6 py-2 border border-zinc-700 rounded-md bg-zinc-800/60 hover:bg-zinc-700/60"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => handleDenyAid(selectedRequest._id)}
                          className="bg-red-900/50 hover:bg-red-900/70 text-[#ededed]"
                        >
                          Deny Request
                        </Button>
                        <Button
                          onClick={() => handleApproveAid(selectedRequest._id)}
                          className="bg-green-800 hover:bg-green-700 text-[#ededed]"
                        >
                          Approve Request
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
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