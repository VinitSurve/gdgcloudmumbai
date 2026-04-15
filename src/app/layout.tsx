import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://sports.withgoogle.com"),
  title: "Google Cloud x Team USA Clone",
  description:
    "Local reverse-engineered clone of the Google Cloud x Team USA experience.",
  icons: {
    icon: "/seo/favicon.ico",
  },
  openGraph: {
    title: "Google Cloud x Team USA Clone",
    description:
      "As a partner of Team USA, Google Cloud collaborated with elite athletes to build an AI tool that transforms standard video into actionable performance data.",
    images: [{ url: "/seo/og_image.jpg" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
