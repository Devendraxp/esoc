import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useUser, useClerk, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import Card from './Card';

const Sidebar = ({ userRole = 'normal' }) => {
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const { theme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Fix for hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if we're in a mobile view on component mount and window resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    // Check on mount
    checkIfMobile();

    // Check on resize
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Close mobile menu when navigating to a new page
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Theme-aware style classes
  const bgClass = theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white';
  const borderClass = theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200';
  const textClass = theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900';
  const menuBgClass = theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200';
  const menuHoverClass = theme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-zinc-300';
  const dockBgClass = theme === 'dark' ? 'bg-zinc-900' : 'bg-zinc-100';
  const inactiveTextClass = theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500';
  const cardDividerClass = theme === 'dark' ? 'divide-zinc-800' : 'divide-zinc-200';
  const activeBgClass = theme === 'dark' ? 'bg-zinc-900' : 'bg-zinc-100';
  const activeHoverClass = theme === 'dark' ? 'hover:bg-zinc-900/50' : 'hover:bg-zinc-100/80';
  const secondaryTextClass = theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500';

  // Navigation links
  const navItems = [
    { name: 'Home', href: '/', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
        <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
      </svg>
    )},
    { name: 'Create Post', href: '/create-post', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z" clipRule="evenodd" />
      </svg>
    )},
    { name: 'Ask for help', href: '/apply-aid', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
      </svg>
    )},
    { name: 'Eko AI News', href: '/news-tracker', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M4.125 3C3.089 3 2.25 3.84 2.25 4.875V18a3 3 0 003 3h15a3 3 0 01-3-3V4.875C17.25 3.839 16.41 3 15.375 3H4.125zM12 9.75a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5H12zm-.75-2.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H12a.75.75 0 01-.75-.75zM6 12.75a.75.75 0 000 1.5h7.5a.75.75 0 000-1.5H6zm-.75 3.75a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5H6a.75.75 0 01-.75-.75zM6 6.75a.75.75 0 00-.75.75v3c0 .414.336.75.75.75h3a.75.75 0 00.75-.75v-3A.75.75 0 009 6.75H6z" clipRule="evenodd" />
      </svg>
    )},
    { name: 'Urgent Notifications', href: '/urgent-notifications', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 25.057 25.057 0 01-4.496 0z" clipRule="evenodd" />
      </svg>
    )},
  ];

  // Admin & Special user links - conditionally displayed
  const dashboardLinks = [];

  // Add dashboard link for admin users
  if (userRole === 'admin') {
    dashboardLinks.push({ 
      name: 'Admin Dashboard', 
      href: '/dashboard/admin',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M3 6a3 3 0 013-3h2.25a3 3 0 013 3v2.25a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm9.75 0a3 3 0 013-3H18a3 3 0 013 3v2.25a3 3 0 01-3 3h-2.25a3 3 0 01-3-3V6zM3 15.75a3 3 0 013-3h2.25a3 3 0 013 3V18a3 3 0 01-3 3H6a3 3 0 01-3-3v-2.25zm9.75 0a3 3 0 013-3H18a3 3 0 013 3V18a3 3 0 01-3 3h-2.25a3 3 0 01-3-3v-2.25z" clipRule="evenodd" />
        </svg>
      )
    });
  }

  // Add dashboard link for special users
  if (userRole === 'special') {
    dashboardLinks.push({ 
      name: 'Special Dashboard', 
      href: '/dashboard/special',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M3 6a3 3 0 013-3h2.25a3 3 0 013 3v2.25a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm9.75 0a3 3 0 013-3H18a3 3 0 013 3v2.25a3 3 0 01-3 3h-2.25a3 3 0 01-3-3V6zM3 15.75a3 3 0 013-3h2.25a3 3 0 013 3V18a3 3 0 01-3 3H6a3 3 0 01-3-3v-2.25zm9.75 0a3 3 0 013-3H18a3 3 0 013 3V18a3 3 0 01-3 3h-2.25a3 3 0 01-3-3v-2.25z" clipRule="evenodd" />
        </svg>
      )
    });
  }

  // Combine all links
  const allLinks = [...navItems, ...dashboardLinks];

  // Function to determine if a link is active
  const isActiveLink = (href) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  // Mobile hamburger menu button
  const MobileMenuButton = () => (
    <button 
      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      className={`md:hidden fixed top-4 left-4 z-50 p-2 rounded-md ${menuBgClass} ${textClass}`}
      aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
    >
      {isMobileMenuOpen ? (
        // X icon for close
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        // Hamburger icon for open
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      )}
    </button>
  );

  // Mobile bottom dock navigation (simplified navigation for critical actions)
  const MobileBottomDock = () => (
    <div className={`md:hidden fixed bottom-0 left-0 right-0 ${dockBgClass} border-t ${borderClass} z-40 flex justify-around py-2`}>
      <Link href="/" className={`p-2 rounded-full flex flex-col items-center ${isActiveLink('/') ? 'text-primary' : inactiveTextClass}`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
          <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
        </svg>
        <span className="text-xs">Home</span>
      </Link>
      <Link href="/create-post" className={`p-2 rounded-full flex flex-col items-center ${isActiveLink('/create-post') ? 'text-primary' : inactiveTextClass}`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z" clipRule="evenodd" />
        </svg>
        <span className="text-xs">Post</span>
      </Link>
      <Link href="/news-tracker" className={`p-2 rounded-full flex flex-col items-center ${isActiveLink('/news-tracker') ? 'text-primary' : inactiveTextClass}`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path fillRule="evenodd" d="M4.125 3C3.089 3 2.25 3.84 2.25 4.875V18a3 3 0 003 3h15a3 3 0 01-3-3V4.875C17.25 3.839 16.41 3 15.375 3H4.125z" clipRule="evenodd" />
        </svg>
        <span className="text-xs">Ai News</span>
      </Link>
      <Link href="/profile" className={`p-2 rounded-full flex flex-col items-center ${isActiveLink('/profile') ? 'text-primary' : inactiveTextClass}`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
        </svg>
        <span className="text-xs">Profile</span>
      </Link>
    </div>
  );

  // Desktop sidebar content
  const renderDesktopSidebar = () => (
    <div className={`hidden md:block fixed left-0 top-0 h-full w-64 ${bgClass} border-r ${borderClass} py-6 overflow-y-auto ${textClass}`}>
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
              <p className={`text-xs ${secondaryTextClass}`}>{user.primaryEmailAddress?.emailAddress}</p>
              {(userRole === 'admin' || userRole === 'special') && (
                <span className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  userRole === 'admin'
                    ? 'bg-purple-900/30 text-purple-300'
                    : theme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-700'
                }`}>
                  {userRole}
                </span>
              )}
            </div>

            <div className="flex gap-2 w-full">
              <Link 
                href="/profile" 
                className={`flex-1 text-center py-1 text-xs rounded-md ${menuBgClass} ${menuHoverClass} transition`}
              >
                Profile
              </Link>
              <button 
                onClick={() => signOut()}
                className={`flex-1 text-center py-1 text-xs rounded-md ${menuBgClass} ${menuHoverClass} transition`}
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex justify-center gap-3">
              <SignInButton mode="modal">
                <button className={`px-4 py-2 text-sm rounded-md ${menuBgClass} ${menuHoverClass} transition`}>
                  Sign In
                </button>
              </SignInButton>

              <SignUpButton mode="modal">
                <button className="px-4 py-2 text-sm rounded-md bg-primary hover:bg-primary/80 transition text-white">
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          </div>
        )}
      </div>

      <nav className="space-y-4 px-4">
        <Card className="p-0 overflow-hidden">
          <ul className={`divide-y ${cardDividerClass}`}>
            {allLinks.map((item) => (
              <li key={item.name}>
                <Link 
                  href={item.href}
                  className={`block px-4 py-3 text-sm font-medium transition flex items-center
                    ${isActiveLink(item.href)
                      ? `${activeBgClass} text-primary border-l-4 border-primary pl-3`
                      : `${textClass} ${activeHoverClass}`
                    }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </nav>

      {/* Logo at the bottom of sidebar */}
      <div className="absolute bottom-6 w-full flex justify-center">
        <div className="relative h-40 w-60">
          <Image
            src="/logo.png"
            alt="Logo"
            fill
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );

  // Mobile full-screen menu
  const renderMobileMenu = () => (
    <div className={`md:hidden fixed inset-0 z-40 ${bgClass} transform transition-transform duration-300 ease-in-out ${
      isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className="flex flex-col h-full pt-16 pb-20 px-4 overflow-y-auto">
        {/* User info for mobile */}
        {isSignedIn ? (
          <div className="flex items-center space-x-3 mb-8 px-4 py-2">
            <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-primary">
              {user.imageUrl && (
                <Image
                  src={user.imageUrl}
                  alt={user.fullName || "User"}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div>
              <p className="font-semibold text-primary">{user.fullName || user.username || "User"}</p>
              <p className={`text-xs ${secondaryTextClass}`}>{user.primaryEmailAddress?.emailAddress}</p>
              {(userRole === 'admin' || userRole === 'special') && (
                <span className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  userRole === 'admin'
                    ? 'bg-purple-900/30 text-purple-300'
                    : theme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-700'
                }`}>
                  {userRole}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-center gap-3 mb-8">
            <SignInButton mode="modal">
              <button className={`px-4 py-2 text-sm rounded-md ${menuBgClass} ${menuHoverClass} transition`}>
                Sign In
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button className="px-4 py-2 text-sm rounded-md bg-primary hover:bg-primary/80 transition text-white">
                Sign Up
              </button>
            </SignUpButton>
          </div>
        )}

        {/* Mobile navigation links */}
        <Card className="p-0 overflow-hidden mb-4">
          <ul className={`divide-y ${cardDividerClass}`}>
            {allLinks.map((item) => (
              <li key={item.name}>
                <Link 
                  href={item.href}
                  className={`block px-4 py-4 text-base font-medium transition flex items-center
                    ${isActiveLink(item.href)
                      ? `${activeBgClass} text-primary border-l-4 border-primary pl-3`
                      : `${textClass} ${activeHoverClass}`
                    }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        {/* Sign out button for mobile */}
        {isSignedIn && (
          <button 
            onClick={() => signOut()}
            className={`mt-auto mx-4 mb-4 py-3 text-sm font-medium rounded-md ${menuBgClass} ${menuHoverClass} transition flex items-center justify-center`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2">
              <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm5.03 4.72a.75.75 0 010 1.06l-1.72 1.72h10.94a.75.75 0 010 1.5H10.81l1.72 1.72a.75.75 0 11-1.06 1.06l-3-3a.75.75 0 010-1.06l3-3a.75.75 0 011.06 0z" clipRule="evenodd" />
            </svg>
            Sign Out
          </button>
        )}

        {/* Mini logo for mobile menu */}
        <div className="mt-auto mb-20 w-full flex justify-center">
          <div className="relative h-20 w-40">
            <Image
              src="/logo.png"
              alt="Logo"
              fill
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Mobile menu button */}
      <MobileMenuButton />

      {/* Mobile menu (slide-in) */}
      {renderMobileMenu()}

      {/* Mobile bottom dock */}
      <MobileBottomDock />

      {/* Desktop sidebar */}
      {renderDesktopSidebar()}
    </>
  );
};

export default Sidebar;