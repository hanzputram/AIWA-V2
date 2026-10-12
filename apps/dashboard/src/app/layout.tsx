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
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;450;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
