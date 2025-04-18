import { Inter } from 'next/font/google';
import { ThemeProvider } from "next-themes";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata = {
  title: "Eko",
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <ClerkProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            {children}
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
