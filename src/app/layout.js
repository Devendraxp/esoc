import { Inter } from 'next/font/google';
import { ThemeProvider } from "next-themes";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata = {
  title: "ESOC App",
  description: "Emergency Social Coordination Application",
  icons: {
    icon: [
      { url: './Eko.png', sizes: 'any' },
      { url: '/Eko.png', sizes: 'any' },
    ],
    apple: [
      { url: '/Eko.png' }
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-[#0a0a0a] text-[#ededed}`}
      >
        <ClerkProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
            {children}
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
