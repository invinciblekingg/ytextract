import { NextRequest, NextResponse } from "next/server";
import { cleanupOldFiles } from "@/app/lib/youtube";

export async function GET(req: NextRequest) {
    // Protect with a secret so only Vercel Cron can call this
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cleaned = cleanupOldFiles(60 * 60 * 1000); // 1 hour old files
    return NextResponse.json({
        message: `Cleaned ${cleaned} expired file(s)`,
        timestamp: new Date().toISOString(),
    });
}
