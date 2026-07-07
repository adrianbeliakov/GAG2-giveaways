import type { Metadata } from "next";
import { Sora, DM_Sans, JetBrains_Mono } from "next/font/google";
import { Navbar } from "@/components/navbar";
import "./globals.css";

const display = Sora({ subsets: ["latin"], variable: "--font-display" });
const body = DM_Sans({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: { default: "GAG2 Giveaways", template: "%s · GAG2 Giveaways" },
  description: "Official GAG2 giveaways. Sign up, enter with one click, and see every winner.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-line py-6">
          <p className="text-center text-xs text-fog">
            GAG2 Giveaways · Winners are drawn randomly from verified entries.
          </p>
        </footer>
      </body>
    </html>
  );
}
