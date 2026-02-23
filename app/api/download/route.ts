import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { isValidYouTubeUrl, getVideoInfo, downloadAudio, downloadVideo, validateVideoForDownload } from "@/app/lib/youtube";
import { checkUsageLimit, getUserUsage, incrementUsage } from "@/app/lib/usage";
import { prisma } from "@/app/lib/prisma";
import { rateLimit, rateLimitResponse } from "@/app/lib/rateLimit";
import { randomUUID } from "crypto";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // Require auth
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to download videos." }, { status: 401 });
  }

  const userId = session.user.id;

  // Rate limit
  const { success, resetAt } = rateLimit(`download:${userId}`, 5, 60 * 60 * 1000);
  if (!success) return rateLimitResponse(resetAt);

  // Usage limit
  const canDownload = await checkUsageLimit(userId);
  if (!canDownload) {
    const usage = await getUserUsage(userId);
    return NextResponse.json(
      { error: `Download limit reached (${usage.used}/${usage.limit}).`, usage },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!isValidYouTubeUrl(url)) {
      return NextResponse.json(
        { error: "Invalid YouTube URL. Please paste a valid YouTube link." },
        { status: 400 }
      );
    }

    const info = await getVideoInfo(url);
    validateVideoForDownload(info);

    const id = randomUUID();

    const [audioPath, videoPath] = await Promise.all([
      downloadAudio(url, `audio-${id}`),
      downloadVideo(url, `video-${id}`),
    ]);

    // Create job record
    const job = await prisma.job.create({
      data: {
        userId,
        url,
        status: "DONE",
        title: info.title,
        thumbnail: info.thumbnail,
        duration: info.duration,
        author: info.author,
        videoPath,
        audioPath,
      },
    });

    // Track usage
    await incrementUsage(userId, job.id);

    return NextResponse.json({
      videoPath,
      audioPath,
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.duration,
      author: info.author,
      id,
    });
  } catch (err: unknown) {
    console.error("[download] error:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred";

    if (message.includes("private") || message.includes("Private")) {
      return NextResponse.json(
        { error: "This video is private and cannot be downloaded." },
        { status: 403 }
      );
    }
    if (message.includes("age") || message.includes("Age")) {
      return NextResponse.json(
        { error: "This video is age-restricted and cannot be processed." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: message || "Failed to process the video. Please try another URL." },
      { status: 500 }
    );
  }
}
