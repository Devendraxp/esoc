'use client';

import { ThemeProvider } from 'next-themes';

if (typeof window === 'undefined' && typeof localStorage !== 'undefined') {
  try {
    localStorage.getItem('_');
  } catch {
    globalThis.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null,
    };
  }
}

export default function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {children}
    </ThemeProvider>
  );
}
