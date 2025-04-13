import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Lock } from 'lucide-react';

const ThemeToggle = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Fix for hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="p-2 rounded-full bg-zinc-800 text-zinc-100 cursor-not-allowed"
        aria-label="Dark mode locked"
        disabled
      >
        <div className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        className="p-2 rounded-full bg-zinc-800 text-zinc-300 cursor-not-allowed"
        aria-label="Dark mode locked"
        disabled
      >
        <Moon className="h-5 w-5" />
      </button>
      <div className="absolute -top-1 -right-1 bg-zinc-700 rounded-full p-0.5">
        <Lock className="h-3 w-3 text-zinc-300" />
      </div>
    </div>
  );
};

export default ThemeToggle;