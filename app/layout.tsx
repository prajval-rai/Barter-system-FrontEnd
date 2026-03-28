import "./globals.css";
import type { Metadata } from "next";
import Providers from "@/app/Providers";

export const metadata: Metadata = {
  title: "ExchangeIt – Trade · Exchange · Deal",
  description: "A peer-to-peer barter and exchange platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google Identity Services — loads the GSI library */}
        <script src="https://accounts.google.com/gsi/client" async defer />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&family=DM+Mono&display=swap" rel="stylesheet" />
        <script
  src="https://cdn.jsdelivr.net/npm/iconify-icon@2.1.0/dist/iconify-icon.min.js"
  async
/>
      </head>
      <body>
        {/* Providers is a "use client" wrapper so AuthProvider
            can use React context inside the server-side layout */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}