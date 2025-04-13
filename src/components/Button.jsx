import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '',
  ...props 
}) => {
  const baseClasses = 'px-4 py-2 rounded-md font-medium transition';
  
  const variantClasses = {
    primary: 'bg-primary hover:bg-primary-hover active:bg-primary-active text-[#ededed]',
    secondary: 'bg-zinc-800 hover:bg-zinc-700 text-[#ededed]'
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${className}`;

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