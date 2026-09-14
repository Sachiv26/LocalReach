import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/layout/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "LocalReach — Your neighbourhood. Your marketplace.",
    template: "%s | LocalReach",
  },
  description:
    "LocalReach connects local people and businesses through trusted community marketplaces. Buy, sell and discover local businesses in your community.",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: "LocalReach",
    title: "LocalReach — Your neighbourhood. Your marketplace.",
    description:
      "Buy, sell and discover local businesses in your community.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LocalReach — Your neighbourhood. Your marketplace.",
    description:
      "Buy, sell and discover local businesses in your community.",
  },
};

export const viewport: Viewport = {
  themeColor: "#158258",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
