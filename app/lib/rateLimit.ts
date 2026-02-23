import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    Array.from(rateLimitStore.entries()).forEach(([key, entry]) => {
        if (entry.resetAt < now) {
            rateLimitStore.delete(key);
        }
    });
}, 5 * 60 * 1000);

export function getClientIP(req: NextRequest): string {
    return (
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "unknown"
    );
}

export function rateLimit(
    key: string,
    limit: number,
    windowMs: number
): { success: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt < now) {
        rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
        return { success: true, remaining: limit - 1, resetAt: now + windowMs };
    }

    if (entry.count >= limit) {
        return { success: false, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count++;
    return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

export function rateLimitResponse(resetAt: number): NextResponse {
    const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
    return NextResponse.json(
        { error: "Too many requests. Please slow down.", retryAfter },
        {
            status: 429,
            headers: { "Retry-After": String(retryAfter) },
        }
    );
}
