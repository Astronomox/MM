import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transcribeAudio } from "@/lib/transcription";
import { summarizeMeeting, countTokensApprox } from "@/lib/summarization";
import { generateAndUploadPDF } from "@/lib/pdf";
import { logUsage } from "@/lib/limits";

// Statuses that mean processing is already underway or finished
const TERMINAL_OR_ACTIVE = ["TRANSCRIBING", "SUMMARIZING", "GENERATING_PDF", "DONE"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const meeting = await prisma.meeting.findFirst({ where: { id, userId: user.id } });
  if (!meeting) return Response.json({ error: "Meeting not found" }, { status: 404 });
  if (!meeting.audioUrl) return Response.json({ error: "No audio file found" }, { status: 400 });

  // Idempotency guard — prevent double-processing
  if (TERMINAL_OR_ACTIVE.includes(meeting.status)) {
    return Response.json(
      { error: "Meeting is already processing or has been completed" },
      { status: 400 }
    );
  }

  processInBackground(id, user.id, user.name || "User").catch((err) => {
    console.error(`Pipeline failed for meeting ${id}:`, err);
  });

  return Response.json({ message: "Processing started", meetingId: id });
}

async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries = 3
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries - 1) {
        const delay = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
        console.warn(`[${label}] attempt ${attempt + 1} failed, retrying in ${delay}ms:`, err);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}

async function processInBackground(meetingId: string, userId: string, userName: string) {
  // 30-minute hard timeout — prevents runaway serverless jobs
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Processing timeout after 30 minutes")), 30 * 60 * 1000)
  );

  try {
    await Promise.race([runPipeline(meetingId, userId, userName), timeoutPromise]);
  } catch (err) {
    console.error(`Processing error for meeting ${meetingId}:`, err);
    await prisma.meeting
      .update({ where: { id: meetingId }, data: { status: "FAILED" } })
      .catch(() => {});
  }
}

async function runPipeline(meetingId: string, userId: string, userName: string) {
  // ── Step 1: Transcribe ──────────────────────────────────────────────────────
  await prisma.meeting.update({ where: { id: meetingId }, data: { status: "TRANSCRIBING" } });

  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting?.audioUrl) throw new Error("Audio URL missing");

  const transcriptionResult = await withRetry(
    () => transcribeAudio(meeting.audioUrl!, meeting.language),
    "transcribeAudio"
  );

  // Atomically save transcript + advance status
  await prisma.$transaction([
    prisma.transcript.upsert({
      where: { meetingId },
      create: {
        meetingId,
        fullText: transcriptionResult.fullText,
        segments: transcriptionResult.segments as any,
        wordCount: transcriptionResult.wordCount,
      },
      update: {
        fullText: transcriptionResult.fullText,
        segments: transcriptionResult.segments as any,
        wordCount: transcriptionResult.wordCount,
      },
    }),
    prisma.meeting.update({
      where: { id: meetingId },
      data: {
        duration: Math.floor(transcriptionResult.duration),
        status: "SUMMARIZING",
      },
    }),
  ]);

  await logUsage(userId, "TRANSCRIBE", undefined, {
    meetingId,
    duration: transcriptionResult.duration,
    wordCount: transcriptionResult.wordCount,
  });

  // ── Step 2: Summarize ───────────────────────────────────────────────────────
  const tokenCount = countTokensApprox(transcriptionResult.fullText);

  const summaryResult = await withRetry(
    () =>
      summarizeMeeting(
        transcriptionResult.fullText,
        meeting.title,
        Math.floor(transcriptionResult.duration)
      ),
    "summarizeMeeting"
  );

  // Build speaker stats — skip malformed segments
  const speakerMap = new Map<string, { talkTime: number; wordCount: number }>();
  for (const seg of transcriptionResult.segments) {
    if (!seg.start || !seg.end || seg.end < seg.start) continue;
    const duration = seg.end - seg.start;
    const words = seg.text?.split(/\s+/).filter(Boolean).length || 0;
    const existing = speakerMap.get(seg.speaker) || { talkTime: 0, wordCount: 0 };
    speakerMap.set(seg.speaker, {
      talkTime: existing.talkTime + duration,
      wordCount: existing.wordCount + words,
    });
  }

  // Atomically save summary + speakers + advance status
  await prisma.$transaction([
    prisma.summary.upsert({
      where: { meetingId },
      create: {
        meetingId,
        tldr: summaryResult.tldr,
        keyPoints: summaryResult.keyPoints,
        actionItems: summaryResult.actionItems as any,
        decisions: summaryResult.decisions,
        sentiment: summaryResult.sentiment,
        topics: summaryResult.topics,
      },
      update: {
        tldr: summaryResult.tldr,
        keyPoints: summaryResult.keyPoints,
        actionItems: summaryResult.actionItems as any,
        decisions: summaryResult.decisions,
        sentiment: summaryResult.sentiment,
        topics: summaryResult.topics,
      },
    }),
    prisma.speaker.deleteMany({ where: { meetingId } }),
    prisma.meeting.update({ where: { id: meetingId }, data: { status: "GENERATING_PDF" } }),
  ]);

  // createMany can't be in the same interactive transaction — run after
  const speakerRows = Array.from(speakerMap.entries()).map(([label, stats]) => ({
    meetingId,
    label,
    talkTime: Math.floor(stats.talkTime),
    wordCount: stats.wordCount,
  }));
  if (speakerRows.length > 0) {
    await prisma.speaker.createMany({ data: speakerRows });
  }

  await logUsage(userId, "SUMMARIZE", tokenCount, { meetingId });

  // ── Step 3: Generate PDF ────────────────────────────────────────────────────
  const fullMeeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: { transcript: true, summary: true, pdf: true, speakers: true },
  });
  if (!fullMeeting) throw new Error("Meeting not found after processing");

  const { s3Key, url, size } = await generateAndUploadPDF({
    meeting: fullMeeting as any,
    userName,
  });

  await prisma.$transaction([
    prisma.pDF.upsert({
      where: { meetingId },
      create: { meetingId, s3Key, url, size },
      update: { s3Key, url, size },
    }),
    prisma.meeting.update({ where: { id: meetingId }, data: { status: "DONE" } }),
  ]);

  await logUsage(userId, "PDF_GENERATE", undefined, { meetingId, size });
}
