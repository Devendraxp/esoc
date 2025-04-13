import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Configure which routes require authentication
const isAuthRoute = createRouteMatcher([
  // Protected API routes
  '/api/posts',
  '/api/posts/(.*)',
  '/api/aid-requests',
  '/api/aid-requests/(.*)',
  '/api/reports',
  '/api/reports/(.*)',
  '/api/users/(.*)',
  // Protected app routes
  '/create-post(.*)',
  '/apply-aid(.*)',
  '/dashboard/(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return NextResponse.next();
  }
  
  // Sync user data with our database when authenticated
  if (auth.userId && !req.nextUrl.pathname.startsWith('/api/users')) {
    try {
      // Get the primary email address
      const primaryEmail = auth.user?.emailAddresses?.find(
        email => email.id === auth.user.primaryEmailAddressId
      )?.emailAddress || auth.user?.emailAddresses?.[0]?.emailAddress;
      
      // Only sync user data occasionally to avoid too many DB operations,
      // but always sync if we have a new or different email
      const shouldSync = Math.random() < 0.1; // 10% chance to sync on any request
      
      if (shouldSync) {
        const userData = {
          firstName: auth.user?.firstName,
          lastName: auth.user?.lastName,
          username: auth.user?.username,
          email: primaryEmail,
          profileImageUrl: auth.user?.imageUrl
        };
        
        // Call our API to sync user data
        await fetch(`${req.nextUrl.origin}/api/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: req.headers.get('authorization') || '',
          },
          body: JSON.stringify(userData),
        });
      }
    } catch (error) {
      console.error('Error syncing user data:', error);
      // Don't block the request if sync fails
    }
  }
  
  // Return response from middleware
  return NextResponse.next();
});

// Configure the middleware to run on specific routes
export const config = {
  matcher: [
    '/((?!_next/image|_next/static|favicon.ico|.well-known).*)',
    '/',
    '/api/(.*)'
  ],
};