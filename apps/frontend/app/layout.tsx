import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { ToastProvider } from "@/components/feedback/Toast";
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
  applicationName: "Resume Builder",
  title: {
    default: "Resume Builder",
    template: "%s | Resume Builder",
  },
  description: "Build, tailor, and manage polished resumes from one secure workspace.",
  icons: {
    icon: "/favicon.ico",
    apple: "/resume_logo.png",
  },
};

const themeScript = `
  try {
    var storedTheme = localStorage.getItem("resume-builder-theme");
    var theme = storedTheme === "dark" || storedTheme === "light"
      ? storedTheme
      : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = theme;
  } catch (_) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${figtree.variable} ${bricolage.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
