import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

let initializeNewsProcessor;
if (typeof process !== 'undefined' && process.env.NEXT_RUNTIME !== 'edge') {
  try {
    const newsSchedulerModule = require('./utils/newsScheduler');
    initializeNewsProcessor = newsSchedulerModule.initializeNewsProcessor;


    if (process.env.GEMINI_API_KEY) {
      console.log('Attempting to initialize news processor...');

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

const isAuthRoute = createRouteMatcher([

  '/api/posts',
  '/api/posts/(.*)',
  '/api/aid-requests',
  '/api/aid-requests/(.*)',
  '/api/reports',
  '/api/reports/(.*)',
  '/api/users/(.*)',
  '/api/news-tracker/(.*)',

  '/create-post(.*)',
  '/apply-aid(.*)',
  '/dashboard/(.*)',
  '/news-tracker(.*)'
]);

export default clerkMiddleware(async (auth, req) => {

  if (req.method === 'OPTIONS') {
    return NextResponse.next();
  }


  if (auth.userId && !req.nextUrl.pathname.startsWith('/api/users')) {
    try {

      const userData = {
        firstName: auth.user?.firstName || '',
        lastName: auth.user?.lastName || '',
        username: auth.user?.username || '',
        profileImageUrl: auth.user?.imageUrl || '',

        email: auth.user?.emailAddresses?.find(
          email => email.id === auth.user.primaryEmailAddressId
        )?.emailAddress || auth.user?.emailAddresses?.[0]?.emailAddress || ''
      };


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
