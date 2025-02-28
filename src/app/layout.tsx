import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import { DataProvider } from "./context/DataContext";

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
        <DataProvider>
          <Navbar />
          <div className="mx-auto max-w-6xl pt-20">
            <div>{children}</div>
          </div>
        </DataProvider>
      </body>
    </html>
  );
}
