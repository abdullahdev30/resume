import type { Metadata } from "next";
import { ToastProvider } from "@/components/feedback/Toast";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import "./globals.css";
export const metadata: Metadata = {
  applicationName: "Resume Builder",
  title: {
    default: "Resume Builder",
    template: "%s | Resume Builder",
  },
  description:
    "Build professional resumes with reusable personas. Register and choose a monthly package; no payment is collected yet.",
  icons: {
    icon: "/favicon.ico",
    apple: "/resume_logo.png",
  },
};

const themeScript = `document.documentElement.dataset.theme = "light";`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <QueryProvider>
          <LanguageProvider><ToastProvider>{children}</ToastProvider></LanguageProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
