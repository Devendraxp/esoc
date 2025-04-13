import React from 'react';

const Container = ({ children, className, ...props }) => {
  return (
    <div 
      className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-zinc-900 text-[#ededed] rounded-3xl shadow-xl border border-zinc-800 ${className || ''}`} 
      {...props}
    >
      {children}
    </div>
  );
};

export default Container;