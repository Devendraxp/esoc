import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

const Card = ({ children, className = '', ...props }) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Fix for hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    // Default styling during SSR to prevent hydration mismatch
    return (
      <div 
        className={`bg-zinc-900 border border-zinc-800 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xl text-zinc-100 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
  
  const textClass = theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900';
  const bgClass = theme === 'dark' ? 'bg-zinc-900' : 'bg-white';
  const borderClass = theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200';
  
  return (
    <div 
      className={`${bgClass} border ${borderClass} rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xl ${textClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;