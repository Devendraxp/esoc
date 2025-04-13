import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Card from './Card';

const Sidebar = ({ userRole = 'normal' }) => {
  const pathname = usePathname();
  
  // Navigation links
  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Create Post', href: '/create-post' },
    { name: 'Apply for Aid', href: '/aid-request' },
  ];
  
  // Admin & Special user links - conditionally displayed
  const dashboardLinks = [
    { name: 'Dashboard', href: '/dashboard' },
    ...(userRole === 'admin' ? [
      { name: 'Manage Users', href: '/dashboard/users' },
      { name: 'Review Reports', href: '/dashboard/reports' },
      { name: 'Aid Requests', href: '/dashboard/aid-requests' }
    ] : []),
    ...(userRole === 'special' || userRole === 'admin' ? [
      { name: 'Analytics', href: '/dashboard/analytics' }
    ] : [])
  ];

  // If user is special or admin, add dashboard links
  const allLinks = [...navItems, ...(userRole !== 'normal' ? dashboardLinks : [])];

  // Function to determine if a link is active
  const isActiveLink = (href) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="fixed h-full w-64 bg-[#0a0a0a] border-r border-zinc-800 py-6 overflow-y-auto text-[#ededed]">
      <div className="px-6 mb-8">
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