import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useUser, useClerk, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import Card from './Card';

const Sidebar = ({ userRole = 'normal' }) => {
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  
  // Navigation links
  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Create Post', href: '/create-post' },
    { name: 'Apply for Aid', href: '/apply-aid' }, // Fixed path
  ];
  
  // Admin & Special user links - conditionally displayed
  const dashboardLinks = [];
  
  // Add dashboard link for admin users
  if (userRole === 'admin') {
    dashboardLinks.push({ name: 'Admin Dashboard', href: '/dashboard/admin' });
  }
  
  // Add dashboard link for special users
  if (userRole === 'special') {
    dashboardLinks.push({ name: 'Special Dashboard', href: '/dashboard/special' });
  }

  // If user is special or admin, add profile link
  const allLinks = [...navItems, ...dashboardLinks];

  // Function to determine if a link is active
  const isActiveLink = (href) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-[#0a0a0a] border-r border-zinc-800 py-6 overflow-y-auto text-[#ededed]">
      <div className="px-6 mb-8 flex flex-col gap-4">
        {/* User authentication section */}
        {isSignedIn ? (
          <div className="flex flex-col items-center space-y-3 mb-4 pt-1">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-primary">
              {user.imageUrl && (
                <Image
                  src={user.imageUrl}
                  alt={user.fullName || "User"}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div className="text-center">
              <p className="font-semibold text-primary">{user.fullName || user.username || "User"}</p>
              <p className="text-xs text-zinc-400">{user.primaryEmailAddress?.emailAddress}</p>
              {(userRole === 'admin' || userRole === 'special') && (
                <span className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  userRole === 'admin'
                    ? 'bg-purple-900/30 text-purple-300'
                    : 'bg-zinc-800 text-zinc-300'
                }`}>
                  {userRole}
                </span>
              )}
            </div>
            
            <div className="flex gap-2 w-full">
              <Link 
                href="/profile" 
                className="flex-1 text-center py-1 text-xs rounded-md bg-zinc-800 hover:bg-zinc-700 transition"
              >
                Profile
              </Link>
              <button 
                onClick={() => signOut()}
                className="flex-1 text-center py-1 text-xs rounded-md bg-zinc-800 hover:bg-zinc-700 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex justify-center gap-3">
              <SignInButton mode="modal">
                <button className="px-4 py-2 text-sm rounded-md bg-zinc-800 hover:bg-zinc-700 transition">
                  Sign In
                </button>
              </SignInButton>
              
              <SignUpButton mode="modal">
                <button className="px-4 py-2 text-sm rounded-md bg-primary hover:bg-primary/80 transition">
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          </div>
        )}
        
        <h2 className="text-xl font-bold text-[#ededed]">ESOC App</h2>
      </div>
      
      <nav className="space-y-4 px-4">
        <Card className="p-0 overflow-hidden">
          <ul className="divide-y divide-zinc-800">
            {allLinks.map((item) => (
              <li key={item.name}>
                <Link 
                  href={item.href}
                  className={`block px-4 py-3 text-sm font-medium transition
                    ${isActiveLink(item.href)
                      ? 'bg-zinc-900 text-primary border-l-4 border-primary pl-3'
                      : 'text-[#ededed] hover:bg-zinc-900/50'
                    }`}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </nav>
    </div>
  );
};

export default Sidebar;