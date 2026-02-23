import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { checkUsageLimit, getUserUsage } from "@/app/lib/usage";
import { isValidYouTubeUrl, getVideoInfo, validateVideoForDownload } from "@/app/lib/youtube";
import { rateLimit, rateLimitResponse } from "@/app/lib/rateLimit";

export const maxDuration = 60;

// POST /api/jobs — Create a new download job
export async function POST(req: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Please sign in to download videos." }, { status: 401 });
    }

    const userId = session.user.id;

    // Rate limit: 5 jobs per hour per user
    const { success, resetAt } = rateLimit(`jobs:${userId}`, 5, 60 * 60 * 1000);
    if (!success) return rateLimitResponse(resetAt);

    // Check usage limit
    const canDownload = await checkUsageLimit(userId);
    if (!canDownload) {
        const usage = await getUserUsage(userId);
        return NextResponse.json(
            {
                error: `Download limit reached (${usage.used}/${usage.limit}). You've used all your free downloads.`,
                usage,
            },
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

        // Pre-validate video info
        const info = await getVideoInfo(url);
        validateVideoForDownload(info);

        // Create job
        const job = await prisma.job.create({
            data: {
                userId,
                url,
                status: "PENDING",
                title: info.title,
                thumbnail: info.thumbnail,
                duration: info.duration,
                author: info.author,
            },
        });

        // Trigger processing inline (non-blocking via fetch to self)
        const baseUrl = req.nextUrl.origin;
        fetch(`${baseUrl}/api/jobs/process`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-internal-secret": process.env.INTERNAL_SECRET || "dev-secret",
            },
            body: JSON.stringify({ jobId: job.id }),
        }).catch((err) => console.error("[jobs] failed to trigger processing:", err));

        return NextResponse.json({
            jobId: job.id,
            status: job.status,
            title: info.title,
            thumbnail: info.thumbnail,
            duration: info.duration,
            author: info.author,
        });
    } catch (err: unknown) {
        console.error("[jobs] error:", err);
        const message = err instanceof Error ? err.message : "An unexpected error occurred";

        if (message.includes("private") || message.includes("Private")) {
            return NextResponse.json(
                { error: "This video is private and cannot be downloaded." },
                { status: 403 }
            );
        }

        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// GET /api/jobs — List user's jobs
export async function GET() {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobs = await prisma.job.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
            id: true,
            status: true,
            title: true,
            thumbnail: true,
            duration: true,
            author: true,
            createdAt: true,
            errorMsg: true,
        },
    });

    return NextResponse.json({ jobs });
}
