import type { Metadata } from "next";
import "../styles/globals.css";
import SessionProvider from "./components/SessionProvider";

export const metadata: Metadata = {
  title: "ytextract — Download YouTube Videos & Audio",
  description:
    "Download YouTube videos as MP4 and extract audio as MP3 — free, fast, and private. No sign-up required.",
  keywords: [
    "youtube downloader",
    "youtube to mp3",
    "youtube to mp4",
    "video download",
    "audio extractor",
    "free youtube downloader",
  ],
  openGraph: {
    title: "ytextract — Download YouTube Videos & Audio",
    description:
      "Download YouTube videos as MP4 and extract audio as MP3 — free, fast, and private.",
    type: "website",
    siteName: "ytextract",
  },
  twitter: {
    card: "summary_large_image",
    title: "ytextract — Download YouTube Videos & Audio",
    description:
      "Download YouTube videos as MP4 and extract audio as MP3 — free, fast, and private.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
