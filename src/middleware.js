import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Only import the news processor initializer in a controlled way
let initializeNewsProcessor;
if (typeof process !== 'undefined' && process.env.NEXT_RUNTIME !== 'edge') {
  try {
    const newsSchedulerModule = require('./utils/newsScheduler');
    initializeNewsProcessor = newsSchedulerModule.initializeNewsProcessor;
    
    // Initialize news processor only in Node.js environment (not Edge runtime)
    if (process.env.HUGGINGFACE_API_KEY && process.env.GEMINI_API_KEY) {
      console.log('Attempting to initialize news processor...');
      // Delay initialization to ensure models are registered
      setTimeout(() => {
        try {
          initializeNewsProcessor();
          console.log('News processor initialized');
        } catch (error) {
          console.error('Failed to initialize news processor:', error);
        }
      }, 3000);
    } else {
      console.warn('News processor not initialized - missing API keys');
    }
  } catch (error) {
    console.error('Error importing news scheduler:', error);
  }
}

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
  '/api/news-tracker/(.*)',
  // Protected app routes
  '/create-post(.*)',
  '/apply-aid(.*)',
  '/dashboard/(.*)',
  '/news-tracker(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return NextResponse.next();
  }
  
  // Sync user data with our database when authenticated
  if (auth.userId && !req.nextUrl.pathname.startsWith('/api/users')) {
    try {
      // Get complete user data from auth
      const userData = {
        firstName: auth.user?.firstName || '',
        lastName: auth.user?.lastName || '',
        username: auth.user?.username || '',
        profileImageUrl: auth.user?.imageUrl || '',
        // Make sure to include email data
        email: auth.user?.emailAddresses?.find(
          email => email.id === auth.user.primaryEmailAddressId
        )?.emailAddress || auth.user?.emailAddresses?.[0]?.emailAddress || ''
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