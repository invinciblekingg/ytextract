import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  // Require auth
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    { error: "Transcription service is not available. Downloads use the Cobalt API now." },
    { status: 503 }
  );
}
