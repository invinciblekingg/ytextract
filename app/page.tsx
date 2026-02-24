"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import FeatureTicker from "./components/FeatureTicker";
import FeaturesSection from "./components/FeaturesSection";
import HowItWorks from "./components/HowItWorks";
import DemoSection from "./components/DemoSection";
import UrlForm from "./components/UrlForm";
import DownloadButtons from "./components/DownloadButtons";
import LoadingOverlay from "./components/LoadingOverlay";
import ErrorMessage from "./components/ErrorMessage";
import Footer from "./components/Footer";

interface VideoData {
  videoUrl: string;
  audioUrl: string;
  title: string;
  thumbnail: string;
  duration: string;
  author: string;
}

type Stage = "idle" | "downloading" | "done";

export default function Home() {
  const { data: session, status: authStatus } = useSession();
  const [stage, setStage] = useState<Stage>("idle");
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [error, setError] = useState("");
  const [usage, setUsage] = useState<{ used: number; limit: number; remaining: number } | null>(null);

  // Fetch usage on auth
  useEffect(() => {
    if (session?.user) {
      fetch("/api/usage")
        .then((r) => r.json())
        .then((data) => {
          if (data.used !== undefined) setUsage(data);
        })
        .catch(() => { });
    }
  }, [session]);

  const handleSubmit = async (url: string) => {
    if (!session?.user) {
      setError("Please sign in with Google to download videos.");
      return;
    }

    if (usage && usage.remaining <= 0) {
      setError(`Download limit reached (${usage.used}/${usage.limit}). You've used all your free downloads.`);
      return;
    }

    setError("");
    setVideoData(null);
    setStage("downloading");

    try {
      // Single synchronous API call — no polling needed
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process video.");
      }

      setVideoData({
        videoUrl: data.videoUrl,
        audioUrl: data.audioUrl,
        title: data.title,
        thumbnail: data.thumbnail,
        duration: data.duration,
        author: data.author,
      });

      setStage("done");

      // Refresh usage
      fetch("/api/usage")
        .then((r) => r.json())
        .then((d) => { if (d.used !== undefined) setUsage(d); })
        .catch(() => { });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setStage("idle");
    }
  };

  const loading = stage === "downloading";
  const isAuthenticated = authStatus === "authenticated";

  return (
    <>
      <div className="noise" />
      <div className="fixed inset-0 dot-grid opacity-40 pointer-events-none" style={{ zIndex: 0 }} />

      <Navbar />

      <main className="relative" style={{ zIndex: 1 }}>
        <Hero />
        <FeatureTicker />
        <FeaturesSection />
        <HowItWorks />

        <DemoSection>
          {!isAuthenticated && authStatus !== "loading" && (
            <div
              style={{
                padding: "16px 24px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                textAlign: "center",
                marginBottom: "16px",
              }}
            >
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: 0 }}>
                🔒 Sign in with Google to start downloading videos
              </p>
            </div>
          )}

          {usage && isAuthenticated && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginBottom: "12px",
                fontSize: "13px",
                color: usage.remaining <= 1 ? "#f87171" : "rgba(255,255,255,0.5)",
              }}
            >
              <span>
                {usage.remaining > 0
                  ? `${usage.remaining} download${usage.remaining !== 1 ? "s" : ""} remaining`
                  : "No downloads remaining"}
              </span>
              <span
                style={{
                  padding: "2px 8px",
                  background: usage.remaining <= 1 ? "rgba(248,113,113,0.1)" : "rgba(167,139,250,0.1)",
                  border: `1px solid ${usage.remaining <= 1 ? "rgba(248,113,113,0.2)" : "rgba(167,139,250,0.2)"}`,
                  borderRadius: "100px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: usage.remaining <= 1 ? "#f87171" : "#a78bfa",
                }}
              >
                {usage.used}/{usage.limit}
              </span>
            </div>
          )}

          <UrlForm
            onSubmit={handleSubmit}
            loading={loading}
            disabled={!isAuthenticated || (usage !== null && usage.remaining <= 0)}
          />

          {error && <ErrorMessage message={error} onDismiss={() => setError("")} />}

          {loading && <LoadingOverlay stage="downloading" />}

          {videoData && stage === "done" && (
            <DownloadButtons data={videoData} />
          )}
        </DemoSection>

        <Footer />
      </main>
    </>
  );
}
