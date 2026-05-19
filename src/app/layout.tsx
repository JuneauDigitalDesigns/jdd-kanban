import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JDD Buildout Tracker",
  description: "Local Kanban for tracking the Juneau Digital Designs buildout.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#101013] text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
