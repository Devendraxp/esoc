import React from 'react';

const Card = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`bg-card border border-border rounded-3xl p-6 shadow-xl text-[#ededed] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;