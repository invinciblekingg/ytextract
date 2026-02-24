import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    // Protect with a secret so only Vercel Cron can call this
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // No local files to clean up — downloads are served via Cobalt API URLs
    return NextResponse.json({
        message: "No cleanup needed — downloads are served via external URLs",
        timestamp: new Date().toISOString(),
    });
}
