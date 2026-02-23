import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { transcribeAudio } from "@/app/lib/openai";
import { cleanupFile } from "@/app/lib/youtube";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  // Require auth
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { audioPath } = body;

    if (!audioPath || typeof audioPath !== "string") {
      return NextResponse.json(
        { error: "Audio path is required" },
        { status: 400 }
      );
    }

    const transcript = await transcribeAudio(audioPath);

    // Clean up audio file after transcription
    cleanupFile(audioPath);

    return NextResponse.json({ transcript });
  } catch (err: unknown) {
    console.error("[transcribe] error:", err);
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred";

    if (message.includes("OPENAI_API_KEY")) {
      return NextResponse.json(
        { error: "Transcription service is not configured. Please set your OpenAI API key." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate transcript. Please try again." },
      { status: 500 }
    );
  }
}
