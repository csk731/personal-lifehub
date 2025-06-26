import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | LifeHub',
    default: 'LifeHub - Your Personal Management Platform',
  },
  description: 'A highly customizable personal management platform with widget-based architecture for tasks, mood tracking, finance management, and more.',
  keywords: ['personal management', 'productivity', 'widgets', 'dashboard', 'task manager', 'mood tracker'],
  authors: [{ name: 'LifeHub Team' }],
  creator: 'LifeHub',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://lifehub.app',
    title: 'LifeHub - Your Personal Management Platform',
    description: 'Transform your daily routine with customizable widgets for task management, mood tracking, finance monitoring, and more.',
    siteName: 'LifeHub',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LifeHub - Your Personal Management Platform',
    description: 'Transform your daily routine with customizable widgets for task management, mood tracking, finance monitoring, and more.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-inter antialiased bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50`}
      >
        {children}
      </body>
    </html>
  );
}
