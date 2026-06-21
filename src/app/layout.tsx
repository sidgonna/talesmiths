import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SupabaseProvider } from "@/components/providers/SupabaseProvider";
import { AdminProvider } from "@/components/providers/AdminProvider";
import { AdminOverlay } from "@/components/admin/AdminOverlay";

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas-neue",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tale Smiths — AI Manga & Comic Platform",
  description: "Discover and read original AI-generated manga and comics in high-fidelity immersive layouts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bebasNeue.variable} ${inter.variable} h-full antialiased`}
      data-theme="dark"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-text-primary antialiased selection:bg-brand-primary selection:text-background">
        <SupabaseProvider>
          <ThemeProvider>
            <AdminProvider>
              {children}
              <AdminOverlay />
            </AdminProvider>
          </ThemeProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
