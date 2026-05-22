import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteObject } from "@/lib/s3";
import { z } from "zod";

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const meeting = await prisma.meeting.findFirst({
    where: { id, userId: user.id },
    include: { transcript: true, summary: true, pdf: true, speakers: true },
  });
  if (!meeting) return Response.json({ error: "Meeting not found" }, { status: 404 });
  return Response.json({ meeting });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const meeting = await prisma.meeting.findFirst({ where: { id, userId: user.id } });
  if (!meeting) return Response.json({ error: "Meeting not found" }, { status: 404 });
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid data" }, { status: 400 });
  const updated = await prisma.meeting.update({ where: { id }, data: parsed.data });
  return Response.json({ meeting: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const meeting = await prisma.meeting.findFirst({ where: { id, userId: user.id }, include: { pdf: true } });
  if (!meeting) return Response.json({ error: "Meeting not found" }, { status: 404 });
  const deletePromises: Promise<void>[] = [];
  if (meeting.audioUrl) deletePromises.push(deleteObject(meeting.audioUrl));
  if (meeting.pdf?.s3Key) deletePromises.push(deleteObject(meeting.pdf.s3Key));
  await Promise.allSettled(deletePromises);
  await prisma.meeting.delete({ where: { id } });
  return Response.json({ ok: true });
}
