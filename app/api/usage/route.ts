import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { getUserUsage } from "@/app/lib/usage";

export async function GET() {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const usage = await getUserUsage(session.user.id);
    return NextResponse.json(usage);
}
