import { prisma } from "./prisma";

export const USAGE_LIMIT = 5;

export async function getUserUsage(userId: string): Promise<{ used: number; limit: number; remaining: number }> {
    const used = await prisma.usageRecord.count({
        where: { userId },
    });

    return {
        used,
        limit: USAGE_LIMIT,
        remaining: Math.max(0, USAGE_LIMIT - used),
    };
}

export async function checkUsageLimit(userId: string): Promise<boolean> {
    const { remaining } = await getUserUsage(userId);
    return remaining > 0;
}

export async function incrementUsage(userId: string, jobId: string): Promise<void> {
    await prisma.usageRecord.create({
        data: {
            userId,
            jobId,
        },
    });
}
