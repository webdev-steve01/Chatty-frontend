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
  return (
    <div className="h-[95vh] max-w-[700px] mx-auto  my-2 bg-[#FEFAE0]">
      {children}
    </div>
  );
}
