import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ReactQueryProvider } from "@/hooks/ReactQueryProvider";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KEN AI - Intelligent Student Management",
  description: "AI-powered platform for study abroad consultation and visa processing",
  keywords: ["student management", "AI", "study abroad", "visa", "education", "OCR", "chatbot"],
  authors: [{ name: "KEN AI Team" }],
  openGraph: {
    title: "KEN AI - Intelligent Student Management",
    description: "AI-powered platform for study abroad consultation and visa processing",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ReactQueryProvider>
          <ThemeProvider>
            {children}
            <Toaster position="top-right" richColors />
          </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
