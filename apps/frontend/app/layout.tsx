import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-figtree",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-bricolage",
});

export const metadata: Metadata = {
  title: "Resume Builder",
  description: "Authenticated resume builder portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" className={`${figtree.variable} ${bricolage.variable}`}>
      <body>{children}</body>
    </html>
  );
}
