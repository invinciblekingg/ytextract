import ytdl from "@distube/ytdl-core";
import path from "path";
import fs from "fs";
import { pipeline } from "stream/promises";
import os from "os";

const TMP_DIR = path.join(os.tmpdir(), "ytextract");

const MAX_VIDEO_DURATION_SECONDS = 900; // 15 minutes max for Vercel

export function ensureTmpDir() {
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
  }
}

export function isValidYouTubeUrl(url: string): boolean {
  try {
    return ytdl.validateURL(url);
  } catch {
    return false;
  }
}

export async function getVideoInfo(url: string) {
  const info = await ytdl.getInfo(url);
  const durationSeconds = parseInt(info.videoDetails.lengthSeconds);

  return {
    title: info.videoDetails.title,
    thumbnail:
      info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1]
        ?.url || "",
    duration: formatDuration(durationSeconds),
    durationSeconds,
    author: info.videoDetails.author.name,
    viewCount: info.videoDetails.viewCount,
    isLive: info.videoDetails.isLiveContent,
  };
}

export function validateVideoForDownload(info: {
  durationSeconds: number;
  isLive: boolean;
}) {
  if (info.isLive) {
    throw new Error("Live videos cannot be downloaded.");
  }
  if (info.durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
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

export async function downloadAudio(
  url: string,
  filename: string
): Promise<string> {
  ensureTmpDir();
  const outputPath = path.join(TMP_DIR, `${filename}.mp3`);

  const audioStream = ytdl(url, {
    quality: "highestaudio",
    filter: "audioonly",
  });

  await pipeline(audioStream, fs.createWriteStream(outputPath));
  return outputPath;
}

export async function downloadVideo(
  url: string,
  filename: string
): Promise<string> {
  ensureTmpDir();
  const outputPath = path.join(TMP_DIR, `${filename}.mp4`);

  const videoStream = ytdl(url, {
    quality: "highestvideo",
    filter: "videoandaudio",
  });

  await pipeline(videoStream, fs.createWriteStream(outputPath));
  return outputPath;
}

export function cleanupFile(filePath: string) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // silently fail cleanup
  }
}

export function cleanupOldFiles(maxAgeMs: number = 60 * 60 * 1000) {
  try {
    ensureTmpDir();
    const files = fs.readdirSync(TMP_DIR);
    const now = Date.now();
    let cleaned = 0;

    for (const file of files) {
      const filePath = path.join(TMP_DIR, file);
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > maxAgeMs) {
        fs.unlinkSync(filePath);
        cleaned++;
      }
    }
    return cleaned;
  } catch {
    return 0;
  }
}
