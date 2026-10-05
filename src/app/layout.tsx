import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/pwa/service-worker-register";

const geistSans = Geist({ 
  variable: "--font-geist-sans", 
  subsets: ["latin"] 
});

const geistMono = Geist_Mono({ 
  variable: "--font-geist-mono", 
  subsets: ["latin"] 
});

export const metadata: Metadata = {
  title: "LifeHub",
  description: "Tu sistema personal: qué toca hoy, tu semana, tu trabajo y tu plata.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "LifeHub",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon-192.png?v=2",
    apple: "/apple-icon.png?v=2",
  },
};

// Sin bloquear el zoom (accesibilidad). Los campos van a 16px en el celular
// (globals.css), así iOS no hace zoom al enfocarlos.
export const viewport: Viewport = {
  themeColor: "#0b0d12",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-CL" className="dark" suppressHydrationWarning>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-bg text-ink min-h-screen`}
      >
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}