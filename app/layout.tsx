import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Sidebar, MobileNav } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { AppProviders } from "@/components/AppProviders";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const APP_NAME = "Life OS";
const APP_DESCRIPTION =
  "A gamified, dark-mode life dashboard for habits, school, fitness, spending, and a daily AI assistant.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  applicationName: APP_NAME,
  title: {
    default: `${APP_NAME} — Your personal dashboard`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: ["dashboard", "habits", "productivity", "school", "fitness", "spending", "ai", "pwa"],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: `${APP_NAME} — Your personal dashboard`,
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Your personal dashboard`,
    description: APP_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#08080d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans`}>
        <AppProviders>
          <div className="flex min-h-[100dvh]">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <Topbar />
              <main className="flex-1 px-5 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] pt-6 md:px-8 md:pb-10">
                {children}
              </main>
            </div>
          </div>
          <MobileNav />
        </AppProviders>
      </body>
    </html>
  );
}
