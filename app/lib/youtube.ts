const COBALT_API_URL = process.env.COBALT_API_URL || "https://api.cobalt.tools";

const MAX_VIDEO_DURATION_SECONDS = 900; // 15 minutes max

// ─── URL Validation ─────────────────────────────────────────────────────────

const YT_REGEX =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)[a-zA-Z0-9_-]+/;

export function isValidYouTubeUrl(url: string): boolean {
  return YT_REGEX.test(url);
}

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("/")[0];
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      // /shorts/ID or /embed/ID
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts.length >= 2 && (parts[0] === "shorts" || parts[0] === "embed")) {
        return parts[1];
      }
    }
  } catch {
    // ignore
  }
  return null;
}

// ─── Video Info (YouTube oEmbed) ─────────────────────────────────────────────

interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: string;
  durationSeconds: number;
  author: string;
  isLive: boolean;
}

export async function getVideoInfo(url: string): Promise<VideoInfo> {
  const videoId = extractVideoId(url);
  if (!videoId) throw new Error("Could not extract video ID from URL.");

  // Use YouTube oEmbed API for title & author
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  const res = await fetch(oembedUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error("This video is private and cannot be downloaded.");
    if (res.status === 403) throw new Error("This video is unavailable.");
    throw new Error(`Failed to fetch video info (HTTP ${res.status}).`);
  }

  const data = await res.json();

  return {
    title: data.title || "Unknown",
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    duration: "N/A", // oEmbed doesn't provide duration
    durationSeconds: 0, // we can't validate duration via oEmbed, skip
    author: data.author_name || "Unknown",
    isLive: false,
  };
}

export function validateVideoForDownload(info: VideoInfo) {
  if (info.isLive) {
    throw new Error("Live videos cannot be downloaded.");
  }
  if (info.durationSeconds > MAX_VIDEO_DURATION_SECONDS && info.durationSeconds > 0) {
    throw new Error(
      `Video is too long (${formatDuration(info.durationSeconds)}). Maximum allowed duration is ${formatDuration(MAX_VIDEO_DURATION_SECONDS)}.`
    );
  }
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Cobalt API Download ─────────────────────────────────────────────────────

interface CobaltResponse {
  status: string;
  url?: string;
  filename?: string;
  error?: string;
  picker?: Array<{ url: string; type?: string }>;
}

async function callCobalt(
  url: string,
  mode: "auto" | "audio"
): Promise<{ downloadUrl: string; filename: string }> {
  const body: Record<string, unknown> = {
    url,
    videoQuality: "720",
    audioFormat: "mp3",
    youtubeVideoCodec: "h264",
  };

  if (mode === "audio") {
    body.downloadMode = "audio";
  }

  const res = await fetch(`${COBALT_API_URL}/`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[cobalt] HTTP error:", res.status, text);
    throw new Error(`Download service returned HTTP ${res.status}. Please try again.`);
  }

  const data: CobaltResponse = await res.json();

  if (data.status === "error") {
    throw new Error(data.error || "Download service encountered an error.");
  }

  if (data.status === "redirect" || data.status === "tunnel") {
    if (!data.url) throw new Error("Download service returned no URL.");
    return {
      downloadUrl: data.url,
      filename: data.filename || "download",
    };
  }

  if (data.status === "picker" && data.picker && data.picker.length > 0) {
    return {
      downloadUrl: data.picker[0].url,
      filename: data.filename || "download",
    };
  }

  throw new Error(`Unexpected response from download service: ${data.status}`);
}

export interface DownloadLinks {
  videoUrl: string;
  videoFilename: string;
  audioUrl: string;
  audioFilename: string;
}

export async function getDownloadLinks(url: string): Promise<DownloadLinks> {
  const [video, audio] = await Promise.all([
    callCobalt(url, "auto"),
    callCobalt(url, "audio"),
  ]);

  return {
    videoUrl: video.downloadUrl,
    videoFilename: video.filename,
    audioUrl: audio.downloadUrl,
    audioFilename: audio.filename,
  };
}
