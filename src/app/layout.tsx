import type { Metadata } from "next";
import "./globals.css";
import { Header, Footer, ToastProvider, ChainProviders } from "@/components";
import { Recursive } from "next/font/google";

const recursive = Recursive({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-recursive",
});

/**
 * Application metadata configuration
 * Defines SEO and browser-related settings
 */
export const metadata: Metadata = {
  title: "X Vault Demo",
  description:
    "A modern web application for interacting with ERC-4626 vaults on Ethereum",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.svg",
  },
};

/**
 * Root layout component
 * Provides the basic structure for all pages:
 * - HTML and body tags
 * - Provider context
 * - Header and footer
 * - Main content area with responsive padding
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link href={recursive.style.fontFamily} rel="stylesheet" />
      </head>
      <body
        className={`${recursive.className} min-h-screen bg-white antialiased`}
      >
        {/* Background pattern - positioned at the bottom-most layer */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-50">
          <div className="absolute inset-0">
            {/* Top row */}
            <p className="absolute -left-24 top-[8%] font-beast text-[42rem] text-accent-purple-light whitespace-pre tracking-[0.2em] rotate-[0deg]">
              ^^^~
            </p>
            <p className="absolute right-[-15%] top-[5%] font-beast text-[40rem] text-accent-purple-light whitespace-pre tracking-[0.25em] rotate-[90deg]">
              ~~~~
            </p>

            {/* Middle row */}
            <p className="absolute left-[8%] top-[35%] font-beast text-[44rem] text-accent-purple-light whitespace-pre tracking-[0.15em] rotate-[180deg]">
              ^^^
            </p>
            <p className="absolute right-[12%] top-[38%] font-beast text-[38rem] text-accent-purple-light whitespace-pre tracking-[0.2em] rotate-[270deg]">
              ~~~
            </p>

            {/* Lower middle row */}
            <p className="absolute -left-32 top-[65%] font-beast text-[46rem] text-accent-purple-light whitespace-pre tracking-[0.18em] rotate-[0deg]">
              ^^^^
            </p>
            <p className="absolute right-[-20%] top-[62%] font-beast text-[40rem] text-accent-purple-light whitespace-pre tracking-[0.22em] rotate-[90deg]">
              ~~~
            </p>

            {/* Bottom row */}
            <p className="absolute left-[15%] bottom-[8%] font-beast text-[42rem] text-accent-purple-light whitespace-pre tracking-[0.15em] rotate-[180deg]">
              ^^^~
            </p>
            <p className="absolute right-[18%] bottom-[12%] font-beast text-[44rem] text-accent-purple-light whitespace-pre tracking-[0.2em] rotate-[270deg]">
              ~~~
            </p>
          </div>
        </div>

        <ChainProviders>
          <ToastProvider>
            <div className="flex flex-col min-h-screen relative">
              <Header />
              <main className="flex-1">
                <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
                  {children}
                </div>
              </main>
              <Footer />
            </div>
          </ToastProvider>
        </ChainProviders>
      </body>
    </html>
  );
}
