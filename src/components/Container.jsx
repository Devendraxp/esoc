import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

const Container = ({ children, className, noPadding = false, fullWidth = false, ...props }) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Fix for hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Theme-aware styling
  const bgClass = theme === 'dark' ? 'bg-zinc-900' : 'bg-white';
  const textClass = theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900';
  const borderClass = theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200';
  
  if (!mounted) {
    // Default styling during SSR to prevent hydration mismatch
    return (
      <div 
        className={`${fullWidth ? 'w-full' : 'max-w-7xl mx-auto'} ${!noPadding ? 'px-3 sm:px-4 lg:px-8' : ''} bg-zinc-900 text-zinc-100 rounded-xl md:rounded-2xl lg:rounded-3xl shadow-xl border border-zinc-800 ${className || ''}`} 
        {...props}
      >
        {children}
      </div>
    );
  }
  
  return (
    <div 
      className={`${fullWidth ? 'w-full' : 'max-w-7xl mx-auto'} ${!noPadding ? 'px-3 sm:px-4 lg:px-8' : ''} ${bgClass} ${textClass} rounded-xl md:rounded-2xl lg:rounded-3xl shadow-xl border ${borderClass} ${className || ''}`} 
      {...props}
    >
      {children}
    </div>
  );
};

export default Container;