import { prisma } from "./prisma";
import { Plan, UsageAction } from "@prisma/client";

interface PlanLimits {
  meetingsPerMonth: number;
  maxAudioSizeMB: number;
  maxDurationMinutes: number;
  customBranding: boolean;
  teamFeatures: boolean;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: {
    meetingsPerMonth: parseInt(process.env.FREE_MEETINGS_PER_MONTH || "5"),
    maxAudioSizeMB: 100,
    maxDurationMinutes: 60,
    customBranding: false,
    teamFeatures: false,
  },
  PRO: {
    meetingsPerMonth: parseInt(process.env.PRO_MEETINGS_PER_MONTH || "999"),
    maxAudioSizeMB: 500,
    maxDurationMinutes: 300,
    customBranding: true,
    teamFeatures: false,
  },
  TEAM: {
    meetingsPerMonth: 9999,
    maxAudioSizeMB: 1000,
    maxDurationMinutes: 480,
    customBranding: true,
    teamFeatures: true,
  },
};

export async function checkMeetingLimit(userId: string, plan: Plan): Promise<boolean> {
  const limits = PLAN_LIMITS[plan];
  if (limits.meetingsPerMonth >= 9999) return true;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const count = await prisma.meeting.count({
    where: {
      userId,
      createdAt: { gte: startOfMonth },
      status: { not: "FAILED" },
    },
  });

  return count < limits.meetingsPerMonth;
}

export async function logUsage(
  userId: string,
  action: UsageAction,
  tokens?: number,
  meta?: Record<string, any>
): Promise<void> {
  await prisma.usageLog.create({
    data: { userId, action, tokens, meta },
  });
}

export async function getUserUsageStats(userId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [totalMeetings, monthMeetings, totalTokens] = await Promise.all([
    prisma.meeting.count({ where: { userId, status: "DONE" } }),
    prisma.meeting.count({ where: { userId, createdAt: { gte: startOfMonth } } }),
    prisma.usageLog.aggregate({
      where: { userId },
      _sum: { tokens: true },
    }),
  ]);

  return {
    totalMeetings,
    monthMeetings,
    totalTokens: totalTokens._sum.tokens || 0,
  };
}
