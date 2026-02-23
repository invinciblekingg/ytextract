import { NextRequest, NextResponse } from "next/server";
import { isValidYouTubeUrl, getVideoInfo } from "@/app/lib/youtube";
import { rateLimit, rateLimitResponse, getClientIP } from "@/app/lib/rateLimit";

export async function GET(req: NextRequest) {
    const ip = getClientIP(req);
    const { success, resetAt } = rateLimit(`info:${ip}`, 20, 60_000);
    if (!success) return rateLimitResponse(resetAt);

    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url || typeof url !== "string") {
        return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
    }

    if (!isValidYouTubeUrl(url)) {
        return NextResponse.json(
            { error: "Invalid YouTube URL. Please paste a valid YouTube link." },
            { status: 400 }
        );
    }

    try {
        const info = await getVideoInfo(url);
        return NextResponse.json(info);
    } catch (err: unknown) {
        console.error("[info] error:", err);
        const message = err instanceof Error ? err.message : "Failed to fetch video info";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
