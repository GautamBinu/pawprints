import { Geist, Geist_Mono } from "next/font/google";
import { Header, Footer } from "@/components";
import "./globals.css";

import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { AuthProvider } from "@/app/auth/AuthProvider";
import { authConfig } from "./config/server-config";
import { toUser } from "./shared/user";
import { Metadata } from "@/app/auth/AuthContext";
import { Toaster } from "@/components/ui/sonner";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tokens = await getTokens<Metadata>(await cookies(), authConfig);
  const user = tokens ? toUser(tokens) : null;

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <AuthProvider user={user}>
          <Header />
          <main className="flex-1">
            {children}
          </main>
        </AuthProvider>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
