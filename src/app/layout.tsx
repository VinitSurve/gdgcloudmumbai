import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
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
      <body className="min-h-full flex flex-col">
        <Link
          href="/"
          aria-label="Home"
          className="fixed left-3 top-3 z-50 flex items-center gap-2 rounded-md bg-background/70 p-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/50"
        >
          <Image
            src="/assets/logos/GDG%20Logo.gif"
            alt="GDG Cloud Mumbai"
            width={120}
            height={120}
            unoptimized
            priority
            className=""
          />
          <span className="">GDG Cloud मुंबई</span>
        </Link>
        {children}
      </body>
    </html>
  );
}
