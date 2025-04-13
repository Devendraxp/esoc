import React from 'react';

const Input = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  className = '',
  ...props
}) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 placeholder-zinc-500 text-[#ededed] focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
      {...props}
    />
  );
};

export default Input;