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
      <body suppressHydrationWarning>
        <Navbar />
        <div className="container mx-auto mt-28 max-w-6xl">{children}</div>
      </body>
    </html>
  );
}
