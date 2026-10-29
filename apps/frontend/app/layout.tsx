import type { Metadata } from "next";
import { ToastProvider } from "@/components/feedback/Toast";
import { QueryProvider } from "@/components/providers/QueryProvider";
import "./globals.css";
export const metadata: Metadata = {
  applicationName: "Resume Builder",
  title: {
    default: "Resume Builder",
    template: "%s | Resume Builder",
  },
  description:
    "Build a professional resume for free in your browser and save it as a PDF. No sign-up required.",
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
          <ToastProvider>{children}</ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
