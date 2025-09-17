import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header, Footer } from "@/components";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PawPrints - Make Your Mark",
  description: "Petition for students to bring out student voices on campus",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <div style={{ height: '10vh' }}>
          <Header />
        </div>
        <main style={{ height: '65vh' }}>
          {children}
        </main>
        <div style={{ height: '25vh' }}>
          <Footer />
        </div>
      </body>
    </html>
  );
}
