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

// Fetcher function for SWR with timeout
const fetcher = async (url) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error);
    throw error;
  }
};

export default function AdminDashboard() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('users');
  const [userRole, setUserRole] = useState(null);
  
  // Fetch user role
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch('/api/auth/me', { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.error('Error response from /api/auth/me:', response.status);
          setUserRole('unknown');
          return;
        }
        
        const data = await response.json();
        setUserRole(data.role);
        
        // Redirect if not an admin
        if (data.role !== 'admin') {
          router.push('/');
          return;
        }
        
        // If user is admin, trigger email sync in background
        try {
          await fetch('/api/users/sync-emails', {
            method: 'POST',
          });
          console.log('Email sync triggered');
        } catch (syncError) {
          console.error('Error syncing emails:', syncError);
          // Don't block the dashboard if email sync fails
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        // Set a default role to avoid getting stuck on loading
        setUserRole('unknown');
      }
    };
    
    checkUserRole();
  }, [router]);

  // Fetch users
  const { data: users, error: usersError, isLoading: usersLoading, mutate: refreshUsers } = useSWR(
    '/api/users',
    fetcher
  );
  
  // Fetch all aid requests
  const { data: aidRequests, error: aidError, isLoading: aidLoading, mutate: refreshAidRequests } = useSWR(
    '/api/aid-requests/all',
    fetcher
  );
  
  // Fetch all reports
  const { data: reports, error: reportsError, isLoading: reportsLoading } = useSWR(
    '/api/reports/all',
    fetcher
  );
  
  // Fetch all upgrade requests
  const { data: upgradeRequests, error: upgradeError, isLoading: upgradeLoading, mutate: refreshUpgradeRequests } = useSWR(
    '/api/users/upgrade-requests',
    fetcher
  );
  
  // Handle promote user to special role
  const handlePromoteUser = async (userId) => {
    try {
      await fetch(`/api/users/${userId}/promote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'special' }),
      });
      
      refreshUsers();
    } catch (error) {
      console.error('Error promoting user:', error);
    }
  };
  
  // Handle demote user to regular role
  const handleDemoteUser = async (userId) => {
    try {
      await fetch(`/api/users/${userId}/demote`, {
        method: 'POST',
      });
      
      refreshUsers();
    } catch (error) {
      console.error('Error demoting user:', error);
    }
  };
  
  // Handle delete user
  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      
      refreshUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
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
              <h1 className="text-2xl font-bold text-[#ededed]">Admin Dashboard</h1>
              <ThemeToggle />
            </header>

            <main className="p-8">
              <Container className="py-6">
                {/* Section Navigation */}
                <div className="mb-8 border-b border-zinc-800">
                  <div className="flex flex-wrap">
                    <button
                      onClick={() => setActiveSection('users')}
                      className={`py-3 px-6 font-medium text-sm ${
                        activeSection === 'users'
                          ? 'border-b-2 border-primary text-primary'
                          : 'text-zinc-400 hover:text-[#ededed]'
                      }`}
                    >
                      User Management
                    </button>
                    <button
                      onClick={() => setActiveSection('upgrade')}
                      className={`py-3 px-6 font-medium text-sm ${
                        activeSection === 'upgrade'
                          ? 'border-b-2 border-primary text-primary'
                          : 'text-zinc-400 hover:text-[#ededed]'
                      }`}
                    >
                      Upgrade Requests
                    </button>
                    <button
                      onClick={() => setActiveSection('aid')}
                      className={`py-3 px-6 font-medium text-sm ${
                        activeSection === 'aid'
                          ? 'border-b-2 border-primary text-primary'
                          : 'text-zinc-400 hover:text-[#ededed]'
                      }`}
                    >
                      Aid Requests
                    </button>
                    <button
                      onClick={() => setActiveSection('reports')}
                      className={`py-3 px-6 font-medium text-sm ${
                        activeSection === 'reports'
                          ? 'border-b-2 border-primary text-primary'
                          : 'text-zinc-400 hover:text-[#ededed]'
                      }`}
                    >
                      Reports
                    </button>
                  </div>
                </div>
                
                {/* User Management Section */}
                {activeSection === 'users' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-[#ededed]">User Management</h2>
                    </div>
                    
                    {usersLoading ? (
                      <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ededed]"></div>
                      </div>
                    ) : usersError ? (
                      <Card className="bg-red-900/20 text-red-300 border border-red-800 mb-6">
                        <p>Error loading users. Please try again.</p>
                      </Card>
                    ) : !users || users.length === 0 ? (
                      <Card className="bg-zinc-900 text-[#ededed] mb-6">
                        <p>No users found.</p>
                      </Card>
                    ) : (
                      <div className="overflow-x-auto bg-zinc-900 rounded-lg shadow mb-6">
                        <table className="min-w-full divide-y divide-zinc-800">
                          <thead className="bg-zinc-800">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">User ID</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Name</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Email</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Region</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Role</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                            {users.map((user) => (
                              <tr key={user.id || user.clerkId} className="hover:bg-zinc-800/50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                                  <div>
                                    <span className="font-mono">{user.id || user.clerkId}</span>
                                    {(user.firstName || user.lastName) && (
                                      <div className="mt-1 text-xs text-primary">
                                        {[user.firstName, user.lastName].filter(Boolean).join(' ')}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#ededed]">
                                  {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'Unnamed'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                                  {user.email || 'No email'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                                  {user.profile_location || 'Not specified'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#ededed]">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    user.role === 'admin'
                                      ? 'bg-purple-900/30 text-purple-300'
                                      : user.role === 'special'
                                      ? 'bg-zinc-800 text-zinc-300'
                                      : 'bg-green-900/30 text-green-300'
                                  }`}>
                                    {user.role || 'user'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 flex">
                                  {user.role !== 'admin' && user.role !== 'special' && (
                                    <Button
                                      onClick={() => handlePromoteUser(user.id || user.clerkId)}
                                      className="bg-zinc-700 hover:bg-zinc-600 text-[#ededed] text-xs py-1 px-2"
                                    >
                                      Promote to Special
                                    </Button>
                                  )}
                                  {user.role === 'special' && (
                                    <Button
                                      variant="secondary"
                                      onClick={() => handleDemoteUser(user.id || user.clerkId)}
                                      className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs py-1 px-2"
                                    >
                                      Demote to User
                                    </Button>
                                  )}
                                  {user.role !== 'admin' && (
                                    <Button
                                      variant="secondary"
                                      onClick={() => handleDeleteUser(user.id || user.clerkId)}
                                      className="bg-red-900/30 text-red-300 hover:bg-red-900/50 text-xs py-1 px-2"
                                    >
                                      Delete
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Upgrade Requests Section */}
                {activeSection === 'upgrade' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-[#ededed]">Upgrade Requests</h2>
                    </div>
                    
                    {upgradeLoading ? (
                      <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ededed]"></div>
                      </div>
                    ) : upgradeError ? (
                      <Card className="bg-red-900/20 text-red-300 border border-red-800 mb-6">
                        <p>Error loading upgrade requests. Please try again.</p>
                      </Card>
                    ) : !upgradeRequests || upgradeRequests.length === 0 ? (
                      <Card className="bg-zinc-900 text-[#ededed] mb-6">
                        <p>No upgrade requests found.</p>
                      </Card>
                    ) : (
                      <div className="overflow-x-auto bg-zinc-900 rounded-lg shadow mb-6">
                        <table className="min-w-full divide-y divide-zinc-800">
                          <thead className="bg-zinc-800">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">User ID</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Name</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Email</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Region</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Requested Role</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                            {upgradeRequests.map((request) => (
                              <tr key={request.userId} className="hover:bg-zinc-800/50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                                  <div>
                                    <span className="font-mono">{request.userId}</span>
                                    {(request.firstName || request.lastName) && (
                                      <div className="mt-1 text-xs text-primary">
                                        {[request.firstName, request.lastName].filter(Boolean).join(' ')}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#ededed]">
                                  {[request.firstName, request.lastName].filter(Boolean).join(' ') || 'Unnamed'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                                  {request.email || 'No email'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                                  {request.region || 'Not specified'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#ededed]">
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-zinc-800 text-zinc-300">
                                    {request.requestedRole || 'special'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 flex">
                                  <Button
                                    onClick={() => handlePromoteUser(request.userId)}
                                    className="bg-zinc-700 hover:bg-zinc-600 text-[#ededed] text-xs py-1 px-2"
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    onClick={() => handleDeleteUser(request.userId)}
                                    className="bg-red-900/30 text-red-300 hover:bg-red-900/50 text-xs py-1 px-2"
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
                
                {/* Aid Requests Section */}
                {activeSection === 'aid' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-[#ededed]">All Aid Requests</h2>
                    </div>
                    
                    {aidLoading ? (
                      <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ededed]"></div>
                      </div>
                    ) : aidError ? (
                      <Card className="bg-red-900/20 text-red-300 border border-red-800 mb-6">
                        <p>Error loading aid requests. Please try again.</p>
                      </Card>
                    ) : !aidRequests || aidRequests.length === 0 ? (
                      <Card className="bg-zinc-900 text-[#ededed] mb-6">
                        <p>No aid requests found.</p>
                      </Card>
                    ) : (
                      <div className="overflow-x-auto bg-zinc-900 rounded-lg shadow mb-6">
                        <table className="min-w-full divide-y divide-zinc-800">
                          <thead className="bg-zinc-800">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">ID</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Region</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Requested On</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Requesters</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Handled By</th>
                            </tr>
                          </thead>
                          <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                            {aidRequests.map((request) => (
                              <tr key={request._id} className="hover:bg-zinc-800/50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                                  {request._id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#ededed]">
                                  {request.region}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#ededed]">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    request.status === 'approved'
                                      ? 'bg-green-900/30 text-green-300'
                                      : request.status === 'denied'
                                      ? 'bg-red-900/30 text-red-300'
                                      : 'bg-zinc-800 text-yellow-300'
                                  }`}>
                                    {request.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                                  {format(new Date(request.createdAt), 'MMM d, yyyy')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                                  {request.requesters?.length || 1} people
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                                  {request.respondedBy || (request.status !== 'pending' ? 'Unknown' : '-')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Reports Section */}
                {activeSection === 'reports' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-[#ededed]">All Reported Posts</h2>
                    </div>
                    
                    {reportsLoading ? (
                      <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ededed]"></div>
                      </div>
                    ) : reportsError ? (
                      <Card className="bg-red-900/20 text-red-300 border border-red-800 mb-6">
                        <p>Error loading reports. Please try again.</p>
                      </Card>
                    ) : !reports || reports.length === 0 ? (
                      <Card className="bg-zinc-900 text-[#ededed] mb-6">
                        <p>No reported posts found.</p>
                      </Card>
                    ) : (
                      <div className="space-y-8">
                        {reports.map((report) => (
                          <Card key={report._id} className={`border ${
                            report.status === 'resolved' 
                              ? 'border-green-800' 
                              : 'border-zinc-800'
                          }`}>
                            <div className="flex flex-col">
                              <div className="flex justify-between items-start mb-6">
                                <div>
                                  <div className="flex items-center mb-3">
                                    <div className={`${
                                      report.status === 'resolved'
                                        ? 'bg-green-900/30 text-green-300'
                                        : 'bg-zinc-800 text-yellow-300'
                                    } rounded-full p-1 mr-2`}>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        {report.status === 'resolved' ? (
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        ) : (
                                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        )}
                                      </svg>
                                    </div>
                                    <span className="text-sm font-semibold text-[#ededed]">
                                      Report ID: {report._id}
                                    </span>
                                    <span className={`ml-3 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      report.status === 'resolved'
                                        ? 'bg-green-900/30 text-green-300'
                                        : 'bg-zinc-800 text-yellow-300'
                                    }`}>
                                      {report.status || 'pending'}
                                    </span>
                                  </div>
                                  <p className="text-sm text-zinc-400">
                                    Reported on {format(new Date(report.createdAt), 'MMM d, yyyy')} by {
                                      typeof report.reporter === 'object' 
                                        ? (report.reporter?.firstName 
                                           ? `${report.reporter.firstName} ${report.reporter.lastName || ''}`.trim() 
                                           : report.reporter?.username || report.reporter?.clerkId || 'Anonymous')
                                        : (report.reporter || 'Anonymous')
                                    }
                                  </p>
                                  <p className="text-sm text-zinc-400 mt-2">
                                    <span className="font-medium">Reason:</span> {report.reason}
                                  </p>
                                </div>
                                
                                {report.status === 'resolved' && report.resolvedBy && (
                                  <div className="text-sm text-zinc-400">
                                    <span className="font-medium">Resolved by:</span> {
                                      typeof report.resolvedBy === 'object'
                                        ? (report.resolvedBy?.firstName 
                                           ? `${report.resolvedBy.firstName} ${report.resolvedBy.lastName || ''}`.trim()
                                           : report.resolvedBy?.username || report.resolvedBy?.clerkId || 'Unknown')
                                        : report.resolvedBy
                                    }
                                  </div>
                                )}
                              </div>
                              
                              <div className="bg-zinc-800 rounded-lg p-6 mb-6">
                                <p className="text-[#ededed]">{report.post?.content}</p>
                                <div className="flex justify-between items-center mt-3">
                                  <p className="text-xs text-zinc-400">
                                    Posted by {
                                      typeof report.post?.author === 'object'
                                        ? (report.post.author?.firstName
                                           ? `${report.post.author.firstName} ${report.post.author.lastName || ''}`.trim()
                                           : report.post.author?.username || report.post.author?.clerkId || 'Anonymous')
                                        : (report.post?.author || 'Anonymous')
                                    } in {
                                      typeof report.post?.author === 'object'
                                        ? report.post.author?.profile_location || 'Unknown Region'
                                        : 'Unknown Region'
                                    }
                                  </p>
                                  {report.post?.fakeScore > 0 && (
                                    <div className="bg-zinc-900 text-orange-300 p-1 px-2 rounded text-xs">
                                      ⚠️ Fake score: {report.post.fakeScore}/10
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {report.actions && report.actions.length > 0 && (
                                <div className="text-sm text-zinc-400 mb-2">
                                  <span className="font-medium">Actions taken:</span> {report.actions.join(', ')}
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
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