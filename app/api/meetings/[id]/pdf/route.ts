import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateDownloadPresignedUrl } from "@/lib/s3";
import { logUsage } from "@/lib/limits";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const meeting = await prisma.meeting.findFirst({ where: { id, userId: user.id }, include: { pdf: true } });
  if (!meeting) return Response.json({ error: "Meeting not found" }, { status: 404 });
  if (!meeting.pdf) return Response.json({ error: "PDF not ready yet" }, { status: 404 });
  const downloadUrl = await generateDownloadPresignedUrl(meeting.pdf.s3Key);
  await logUsage(user.id, "PDF_DOWNLOAD", undefined, { meetingId: id });
  return Response.json({
    url: downloadUrl,
    filename: `${meeting.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-memo.pdf`,
    size: meeting.pdf.size,
    generatedAt: meeting.pdf.createdAt,
  });
}
