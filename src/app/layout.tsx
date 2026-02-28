import type { Metadata } from "next";
import { Nunito, Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";
import AudioUnlocker from "@/components/ui/AudioUnlocker";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EnglishBuddy - Learn English!",
  description: "Fun English learning app for kids",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${nunito.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-bg pb-20">
        <AudioUnlocker />
        <main className="mx-auto max-w-lg px-4 py-6">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
