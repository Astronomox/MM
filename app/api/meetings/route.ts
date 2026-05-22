import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  audioKey: z.string().min(1),
  audioSize: z.number().optional(),
  language: z.string().default("en"),
});

// GET /api/meetings - list user's meetings
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const status = searchParams.get("status");
  const search = searchParams.get("q");

  const where: any = { userId: user.id };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { summary: { tldr: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [meetings, total] = await Promise.all([
    prisma.meeting.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        summary: {
          select: { tldr: true, actionItems: true, topics: true, sentiment: true },
        },
        pdf: { select: { url: true, size: true, createdAt: true } },
        speakers: true,
        _count: { select: { speakers: true } },
      },
    }),
    prisma.meeting.count({ where }),
  ]);

  return Response.json({
    meetings,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

// POST /api/meetings - create meeting record after upload
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { title, audioKey, audioSize, language } = parsed.data;

  const meeting = await prisma.meeting.create({
    data: {
      userId: user.id,
      title,
      audioUrl: audioKey,
      audioSize,
      language,
      status: "TRANSCRIBING",
    },
  });

  return Response.json({ meeting }, { status: 201 });
}
