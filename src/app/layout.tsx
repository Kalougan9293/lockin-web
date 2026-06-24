import type { Metadata } from "next";
import { Geist } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LockIn | Suivez & relancez vos clients",
  description:
    "Importez vos contacts, configurez cadence, ton et rythme — vous gardez le contrôle.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${geistSans.variable} h-full antialiased`}>
      <body className="glow-bg min-h-full text-white">{children}</body>
    </html>
  );
}
