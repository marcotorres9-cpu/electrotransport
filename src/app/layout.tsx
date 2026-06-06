import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ElectroTransport - Transporte de Electrodomésticos",
  description: "Servicio de transporte de electrodomésticos para locales comerciales. Propón tu precio y elige al mejor transportista.",
  keywords: ["electrotransport", "transporte", "electrodomésticos", "delivery"],
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "ElectroTransport",
    "theme-color": "#059669",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#059669" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Service Worker auto-registration with forced update
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').then(reg => {
                  // Check for updates every 30 seconds
                  setInterval(() => reg.update(), 30000);
                });
                // Listen for SW update messages and auto-reload
                navigator.serviceWorker.addEventListener('message', event => {
                  if (event.data && event.data.type === 'SW_UPDATED') {
                    console.log('SW updated, reloading...');
                    window.location.reload();
                  }
                });
                // Reload when a new SW takes control
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                  console.log('New SW controller, reloading...');
                  window.location.reload();
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
