import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { downloadAudio, downloadVideo } from "@/app/lib/youtube";
import { transcribeAudio } from "@/app/lib/openai";
import { incrementUsage } from "@/app/lib/usage";
import { randomUUID } from "crypto";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
    // Protect — only callable internally
    const secret = req.headers.get("x-internal-secret");
    if (secret !== (process.env.INTERNAL_SECRET || "dev-secret")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { jobId } = await req.json();

        if (!jobId) {
            return NextResponse.json({ error: "jobId required" }, { status: 400 });
        }

        const job = await prisma.job.findUnique({ where: { id: jobId } });

        if (!job || job.status !== "PENDING") {
            return NextResponse.json({ error: "Job not found or already processed" }, { status: 404 });
        }

        // Mark as processing
        await prisma.job.update({
            where: { id: jobId },
            data: { status: "PROCESSING" },
        });

        const id = randomUUID();

        try {
            // Download video and audio in parallel
            const [audioPath, videoPath] = await Promise.all([
                downloadAudio(job.url, `audio-${id}`),
                downloadVideo(job.url, `video-${id}`),
            ]);

            // Try transcription (optional — only if OpenAI key is configured)
            let transcript: string | null = null;
            try {
                if (process.env.OPENAI_API_KEY) {
                    transcript = await transcribeAudio(audioPath);
                }
            } catch (trErr) {
                console.error("[process] transcription error (non-fatal):", trErr);
            }

            // Mark as done
            await prisma.job.update({
                where: { id: jobId },
                data: {
                    status: "DONE",
                    videoPath,
                    audioPath,
                    transcript,
                },
            });

            // Track usage
            await incrementUsage(job.userId, jobId);

            return NextResponse.json({ status: "DONE", jobId });
        } catch (processErr) {
            console.error("[process] download error:", processErr);

            await prisma.job.update({
                where: { id: jobId },
                data: {
                    status: "FAILED",
                    errorMsg:
                        processErr instanceof Error
                            ? processErr.message
                            : "Download failed",
                },
            });

            return NextResponse.json({ status: "FAILED", jobId });
        }
    } catch (err) {
        console.error("[process] unexpected error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
