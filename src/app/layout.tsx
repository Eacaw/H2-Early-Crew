import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata: Metadata = {
  title: "H2 Early Crew",
  description: "H2 Early Crew",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="bg-gray-950 h-screen">
        <Navbar />
        <div className="mx-auto max-w-6xl">
          <div className="mt-28">{children}</div>
        </div>
      </body>
    </html>
  );
}
