import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { UserProvider } from "./(context)/UserContext";
import "./globals.css";
import { UserIdProvider } from "./(context)/UserIdContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chatty",
  description: "Chat with friends from all over the world",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-[100vh] bg-[#FEFAE0] `}
      >
        <UserProvider>
          <UserIdProvider>
            <main className="h-[100vh]">{children}</main>
          </UserIdProvider>
        </UserProvider>
      </body>
    </html>
  );
}
