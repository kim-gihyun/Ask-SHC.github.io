import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ask SHC — Shun Hing College Student Help Desk",
  description: "Answers about Shun Hing College and JCSV III, grounded in official college documents.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
