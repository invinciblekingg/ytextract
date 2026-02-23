import type { Metadata } from "next";
import "../styles/globals.css";
import SessionProvider from "./components/SessionProvider";

export const metadata: Metadata = {
  title: "ytextract — Download & Transcribe YouTube Videos",
  description:
    "Download videos, rip audio, generate word-perfect AI transcripts — all in one seamless workflow. Free, fast, and private.",
  keywords: [
    "youtube downloader",
    "youtube to mp3",
    "youtube transcription",
    "ai transcript",
    "video download",
    "audio extractor",
  ],
  openGraph: {
    title: "ytextract — Download & Transcribe YouTube Videos",
    description:
      "Download videos, rip audio, generate transcripts — all in one seamless workflow.",
    type: "website",
    siteName: "ytextract",
  },
  twitter: {
    card: "summary_large_image",
    title: "ytextract — Download & Transcribe YouTube Videos",
    description:
      "Download videos, rip audio, generate transcripts — all in one seamless workflow.",
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
