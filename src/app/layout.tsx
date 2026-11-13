import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";
import { PwaRegister } from "@/components/pwa-register";
import { PwaInstallSheet } from "@/components/pwa-install-sheet";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "TicketPlatform - Plataforma de Ingressos",
  description: "Sua plataforma de confiança para compra e verificação de ingressos para eventos.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ingressos",
  },
  other: {
    // Necessário para o modo standalone no Safari do iOS/iPadOS.
    // O Next.js 16 só gera "mobile-web-app-capable", que o Safari ignora.
    "apple-mobile-web-app-capable": "yes",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "TicketPlatform",
    title: "TicketPlatform - Plataforma de Ingressos",
    description:
      "Sua plataforma de confiança para compra e verificação de ingressos para eventos.",
    images: [
      {
        url: "/logo.png",
        width: 471,
        height: 530,
        alt: "TicketPlatform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TicketPlatform - Plataforma de Ingressos",
    description:
      "Sua plataforma de confiança para compra e verificação de ingressos para eventos.",
    images: ["/logo.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#735eec",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PwaRegister />
          <PwaInstallSheet />
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
