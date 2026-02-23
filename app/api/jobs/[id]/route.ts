import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const job = await prisma.job.findUnique({
        where: { id },
    });

    if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.userId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({
        id: job.id,
        status: job.status,
        title: job.title,
        thumbnail: job.thumbnail,
        duration: job.duration,
        author: job.author,
        videoPath: job.status === "DONE" ? job.videoPath : null,
        audioPath: job.status === "DONE" ? job.audioPath : null,
        transcript: job.status === "DONE" ? job.transcript : null,
        errorMsg: job.status === "FAILED" ? job.errorMsg : null,
        createdAt: job.createdAt,
    });
}
