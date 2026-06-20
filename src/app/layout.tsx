import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Tiwana Connect",
  description: "Private family platform admin and API foundation."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
