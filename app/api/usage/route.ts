import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getUserUsageStats, PLAN_LIMITS } from "@/lib/limits";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [stats, recentLogs, fullUser] = await Promise.all([
    getUserUsageStats(user.id),
    prisma.usageLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.user.findUnique({ where: { id: user.id }, select: { plan: true } }),
  ]);

  const plan = fullUser?.plan || "FREE";
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];

  return Response.json({
    stats,
    limits,
    plan,
    recentLogs,
    percentUsed: Math.round((stats.monthMeetings / limits.meetingsPerMonth) * 100),
  });
}
