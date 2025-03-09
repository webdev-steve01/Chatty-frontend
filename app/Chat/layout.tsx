import type { Metadata } from "next";
import ChatNavFooter from "../(components)/ChatNavFooter";
// import { Geist, Geist_Mono } from "next/font/google";
// import { UserProvider } from "./(context)/UserContext";

export const metadata: Metadata = {
  title: "Chatty chat",
  description: "Chat with friends from all over the world",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="h-[100vh]">{children}</div>;
}
