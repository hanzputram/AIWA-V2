import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIWA - AI Sales WhatsApp Platform",
  description: "Multi-tenant AI-powered sales assistant for WhatsApp Business",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
