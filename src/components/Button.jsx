import React from 'react';
import { useTheme } from 'next-themes';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'default',
  className = '',
  ...props 
}) => {
  const { theme } = useTheme();
  
  // Base classes with responsive padding
  const baseClasses = 'rounded-md font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary';
  
  // Variant-specific classes - theme aware
  const variantClasses = {
    primary: 'bg-primary hover:bg-primary/90 active:bg-primary/80 text-primary-foreground focus:ring-primary/50',
    secondary: theme === 'dark' 
      ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 focus:ring-zinc-500/30'
      : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-800 focus:ring-zinc-400/30',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500/50',
    outline: theme === 'dark'
      ? 'bg-transparent border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white focus:ring-zinc-500/30'
      : 'bg-transparent border border-zinc-300 hover:border-zinc-500 text-zinc-700 hover:text-zinc-900 focus:ring-zinc-500/30'
  };
  
  // Size-specific classes
  const sizeClasses = {
    small: 'px-2.5 py-1 text-xs',
    default: 'px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base',
    large: 'px-4 py-2 md:px-6 md:py-3 text-base md:text-lg'
  };

  // Combine all classes
  const combinedClasses = `${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || sizeClasses.default} ${className}`;

  return (
    <button 
      className={combinedClasses}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;