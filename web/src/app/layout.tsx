import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { ServiceWorkerRegistration } from "@/components/providers/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "Asagity - アサギティ",
  description: "A cyan-tinted decentralized social universe",
  icons: { icon: "/favicon.ico" },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Asagity",
  },
};

export const viewport: Viewport = {
  themeColor: "#39C5BB",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" className="h-full antialiased" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-gray-100 dark:bg-[#121212]">
        <ServiceWorkerRegistration />
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
