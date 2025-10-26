import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Optimize font loading
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap", // Optimize font loading
});

// Enhanced metadata for SEO and social sharing
export const metadata: Metadata = {
  title: {
    default: "Kirtankumar [K.K.] | Cloud-Native & DevOps Engineer",
    template: "%s | Kirtankumar [K.K.]"
  },
  description: "Cloud engineer who turns ideas into reliable, low-cost AWS platforms. 3+ years experience in designing secure, scalable infrastructure with EKS, Terraform, and DevOps best practices.",
  keywords: ["Cloud Engineer", "DevOps", "AWS", "Kubernetes", "EKS", "Terraform", "Infrastructure as Code", "Software Developer"],
  authors: [{ name: "Kirtankumar Thummar" }],
  creator: "Kirtankumar Thummar",
  metadataBase: new URL(process.env.NEXT_PUBLIC_API_ENDPOINT || 'https://vctrx.cloud'),
  
  // Open Graph tags for social sharing
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Kirtankumar [K.K.] | Cloud-Native & DevOps Engineer",
    description: "Cloud engineer specializing in AWS, Kubernetes, and scalable infrastructure. Built 10 production repos and cut cloud spend by 70%.",
    siteName: "Kirtankumar Portfolio",
    images: [
      {
        url: "/profile.webp",
        width: 1200,
        height: 630,
        alt: "Kirtankumar - Cloud & DevOps Engineer",
      },
    ],
  },

  // Twitter Card tags
  twitter: {
    card: "summary_large_image",
    title: "Kirtankumar [K.K.] | Cloud-Native & DevOps Engineer",
    description: "Cloud engineer specializing in AWS, Kubernetes, and scalable infrastructure.",
    images: ["/profile.webp"],
    creator: "@vangoghcode", // Update with actual Twitter handle
  },

  // Additional metadata
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
  
  // Icons
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

// Viewport configuration for mobile optimization
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#FAFAFA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to external resources for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ 
          /* High-performance scroll optimization */
          overscrollBehavior: 'none',
          WebkitOverflowScrolling: 'touch'
        } as React.CSSProperties}
      >
        <Header />
        {children}
      </body>
    </html>
  );
}
