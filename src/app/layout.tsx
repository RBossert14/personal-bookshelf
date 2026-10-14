import type { Metadata, Viewport } from "next";
import { Figtree, Young_Serif } from "next/font/google";

import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const youngSerif = Young_Serif({
  variable: "--font-young-serif",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My bookshelf",
  description: "A personal bookshelf for what I'm reading, what I've read, and what's next.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef0e2" },
    { media: "(prefers-color-scheme: dark)", color: "#161c1f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // next-themes sets the theme class before React hydrates, so <html> differs from the server render.
    <html lang="en" suppressHydrationWarning className={`${figtree.variable} ${youngSerif.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster position="bottom-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
