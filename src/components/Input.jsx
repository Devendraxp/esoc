import React from 'react';
import { useTheme } from 'next-themes';

const Input = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  size = 'default',
  className = '',
  ...props
}) => {
  const { theme } = useTheme();
  
  // Size-specific classes
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    default: 'px-3 py-1.5 md:py-2 text-sm md:text-base',
    large: 'px-3 py-2 md:px-4 md:py-3 text-base'
  };

  // Theme-aware styles
  const themeClasses = theme === 'dark'
    ? 'bg-zinc-800 border-zinc-700 placeholder-zinc-500 text-zinc-100'
    : 'bg-white border-zinc-300 placeholder-zinc-400 text-zinc-900';

  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full rounded-md border focus:outline-none focus:ring-2 focus:ring-primary/75 ${themeClasses} ${sizeClasses[size] || sizeClasses.default} ${className}`}
      {...props}
    />
  );
};

export default Input;