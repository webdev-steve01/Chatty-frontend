import type { Metadata } from "next";

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
